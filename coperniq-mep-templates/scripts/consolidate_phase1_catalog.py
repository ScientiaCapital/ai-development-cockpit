#!/usr/bin/env python3
"""
Consolidate Phase 1 Catalog Expansion Files

This script reads all 7 trade-specific catalog JSON files and consolidates
them into a single import-ready file with proper Coperniq API schema mapping.

Coperniq API Schema Requirements:
- type: "PRODUCT" | "SERVICE" (uppercase)
- tradeGroup: "MECHANICAL" | "ELECTRICAL" | "PLUMBING" | "LOW_VOLTAGE" | "ENERGY" | "ENVELOPE" | "OTHER"
- category: ProductCategory or ServiceCategory enum
- manufacturer: Required for PRODUCT type
- SERVICE items MUST have tradeGroup: "OTHER" (API constraint)
"""

import json
import os
from pathlib import Path
from datetime import datetime

# Trade group mappings from catalog field to API tradeGroup
TRADE_GROUP_MAP = {
    "MECHANICAL": "MECHANICAL",
    "ELECTRICAL": "ELECTRICAL",
    "PLUMBING": "PLUMBING",
    "ENERGY": "ENERGY",
    "LOW_VOLTAGE": "LOW_VOLTAGE",
    "ROOFING": "ENVELOPE",  # Roofing maps to ENVELOPE
    "FIRE_SAFETY": "OTHER",  # No direct mapping, use OTHER
}

# Category mappings from human-readable to API enum
SERVICE_CATEGORY_MAP = {
    # Installation
    "Installation": "INSTALLATION",
    "Commercial Installation": "INSTALLATION",
    "Residential Installation": "INSTALLATION",
    # Maintenance
    "Maintenance": "MAINTENANCE",
    "Maintenance Agreement": "MAINTENANCE",
    "Preventive Maintenance": "MAINTENANCE",
    # Repair
    "Repair": "REPAIR",
    "Repair Service": "REPAIR",
    # Inspection
    "Inspection": "INSPECTION",
    "Fire Protection": "INSPECTION",  # Fire inspections
    # Testing
    "Testing": "TESTING",
    # Commissioning
    "Commissioning": "COMMISSIONING",
    # Monitoring
    "Monitoring": "MONITORING",
    # Engineering
    "Engineering": "ENGINEERING",
    "Engineering Studies": "ENGINEERING",
    "Grid Interconnection": "ENGINEERING",
    # Site Survey
    "Site Survey": "SITE_SURVEY",
    # Safety
    "Safety": "OTHER",
    # Consulting
    "Consulting": "OTHER",
    # Administrative
    "Administrative": "OTHER",
    # Controls
    "Controls & Automation": "COMMISSIONING",
    # Demolition
    "Demolition": "OTHER",
    # Default
    "Commercial HVAC": "OTHER",  # Labor rates
}

PRODUCT_CATEGORY_MAP = {
    # Solar/Energy - These have direct mappings in Coperniq API
    "Commercial Solar": "PV_MODULE",
    "Utility-Scale Solar": "PV_MODULE",
    "Energy Storage": "BATTERY_SYSTEM",
    "EV Infrastructure": "EV_CHARGER",
    "Mounting": "MOUNTING",
    "Racking": "RACKING",
    "Inverter": "PV_INVERTER",
    "Battery": "BATTERY_SYSTEM",
    # HVAC - No direct mapping, use OTHER
    "Commercial HVAC": "OTHER",
    "Residential HVAC": "OTHER",
    "HVAC Equipment": "OTHER",
    # Electrical - No direct mapping except load centers
    "Wire & Cable": "OTHER",
    "Conduit": "OTHER",
    "Boxes": "OTHER",
    "Enclosures": "OTHER",
    "Distribution": "OTHER",  # Panels, switchboards → OTHER (API has LOAD_CENTER but it's specific)
    "Transformers": "OTHER",
    "Motor Control": "OTHER",
    "Disconnects": "OTHER",
    "Lighting": "OTHER",
    "Lighting Controls": "OTHER",
    "Electrical Equipment": "OTHER",
    # Plumbing - No direct mapping in API
    "Plumbing Equipment": "OTHER",
    "Water Heaters": "OTHER",
    "Fixtures": "OTHER",
    "Equipment": "OTHER",  # Generic equipment
    # Fire Safety - No direct mapping
    "Fire Safety": "OTHER",
    "Fire Alarm": "OTHER",
    "Sprinkler": "OTHER",
    # Low Voltage - No direct mapping
    "Low Voltage": "OTHER",
    "Security": "OTHER",
    "Network": "OTHER",
    # Roofing - No direct mapping
    "Roofing": "OTHER",
    "Shingles": "OTHER",
    "Membrane": "OTHER",
    # Materials
    "Materials": "OTHER",
    # Default - catch-all
}


def extract_items_from_section(section_data: dict) -> list:
    """Extract actual items from a section, filtering out section headers."""
    items = []
    if "items" in section_data:
        for item in section_data["items"]:
            # Skip section header markers
            if "section" in item:
                continue
            items.append(item)
    return items


def transform_item(item: dict) -> dict:
    """Transform a catalog item to Coperniq API format."""
    item_type = item.get("type", "").upper()
    catalog = item.get("catalog", "OTHER")
    category = item.get("category", "OTHER")

    # Determine tradeGroup
    # IMPORTANT: SERVICE items must have tradeGroup "OTHER" per API constraint
    if item_type == "SERVICE":
        trade_group = "OTHER"
    else:
        trade_group = TRADE_GROUP_MAP.get(catalog, "OTHER")

    # Map category to API enum
    if item_type == "SERVICE":
        api_category = SERVICE_CATEGORY_MAP.get(category, "OTHER")
    else:
        api_category = PRODUCT_CATEGORY_MAP.get(category, "OTHER")

    # Build the transformed item
    transformed = {
        "name": item.get("name", ""),
        "type": item_type,
        "category": api_category,
        "tradeGroup": trade_group,
        "cost": item.get("cost", 0),
        "price": item.get("price", 0),
        "code": item.get("code", ""),
        "description": item.get("description", ""),
    }

    # Add manufacturer for PRODUCT type (required)
    if item_type == "PRODUCT":
        manufacturer = item.get("manufacturer", "")
        if manufacturer:
            transformed["manufacturer"] = manufacturer
        else:
            # Default manufacturer if missing
            transformed["manufacturer"] = "Generic"

    return transformed


def load_catalog_file(filepath: Path) -> list:
    """Load a catalog JSON file and extract all items."""
    with open(filepath, "r") as f:
        data = json.load(f)

    items = []
    # Iterate through all sections in the file
    for key, value in data.items():
        if key in ("metadata", "summary"):
            continue
        if isinstance(value, dict):
            items.extend(extract_items_from_section(value))

    return items


def main():
    """Main consolidation function."""
    # Paths
    base_path = Path(__file__).parent.parent / "config" / "master-catalog"
    output_path = Path(__file__).parent.parent / "config" / "phase1-consolidated-import.json"

    # Catalog files to process
    catalog_files = [
        "hvac-catalog-expansion.json",
        "electrical-catalog-expansion.json",
        "plumbing-catalog-expansion.json",
        "solar-catalog-expansion.json",
        "fire-safety-catalog-expansion.json",
        "low-voltage-catalog-expansion.json",
        "roofing-catalog-expansion.json",
    ]

    all_items = []
    stats = {
        "by_trade": {},
        "by_type": {"PRODUCT": 0, "SERVICE": 0},
        "by_category": {},
    }

    # Process each catalog file
    for filename in catalog_files:
        filepath = base_path / filename
        if not filepath.exists():
            print(f"⚠️  Skipping missing file: {filename}")
            continue

        print(f"📄 Processing: {filename}")
        items = load_catalog_file(filepath)

        # Track stats by source file
        trade_name = filename.replace("-catalog-expansion.json", "").upper()
        stats["by_trade"][trade_name] = len(items)

        # Transform items
        for item in items:
            transformed = transform_item(item)
            all_items.append(transformed)

            # Update stats
            item_type = transformed["type"]
            stats["by_type"][item_type] = stats["by_type"].get(item_type, 0) + 1

            category = transformed["category"]
            stats["by_category"][category] = stats["by_category"].get(category, 0) + 1

    # Create output structure
    output = {
        "metadata": {
            "version": "1.0.0",
            "created": datetime.now().strftime("%Y-%m-%d"),
            "description": "Phase 1 Consolidated Catalog - Ready for Coperniq API Import",
            "instance": 388,
            "company": "Kipper Energy Solutions",
            "total_items": len(all_items),
            "stats": stats,
        },
        "items": all_items,
    }

    # Write output file
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n✅ Consolidated {len(all_items)} items to: {output_path}")
    print(f"\n📊 Statistics:")
    print(f"   By Trade:")
    for trade, count in stats["by_trade"].items():
        print(f"      {trade}: {count}")
    print(f"   By Type:")
    for item_type, count in stats["by_type"].items():
        print(f"      {item_type}: {count}")
    print(f"\n🎯 Ready for import with: python scripts/import_expanded_catalog.py --dry-run")


if __name__ == "__main__":
    main()
