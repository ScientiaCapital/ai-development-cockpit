#!/usr/bin/env python3
"""
Import expanded catalog items to Coperniq Instance 388.

This script reads the expanded catalog JSON and imports new items
via the Coperniq REST API.

Usage:
    python scripts/import_expanded_catalog.py
    python scripts/import_expanded_catalog.py --dry-run
"""

import json
import os
import sys
import time
import requests
from typing import Any
from pathlib import Path
from dotenv import load_dotenv

# ServiceCategory mapping: JSON human-readable → API enum
# ServiceCategory enums: INSTALLATION, MAINTENANCE, REPAIR, INSPECTION, DIAGNOSTICS,
#   COMMISSIONING, TESTING, CALIBRATION, CLEANING, OPTIMIZATION, MONITORING, ENGINEERING,
#   SITE_SURVEY, TRAINING, OTHER
SERVICE_CATEGORY_MAP = {
    # Service categories
    "Commercial Installation": "INSTALLATION",
    "Installation": "INSTALLATION",
    "Maintenance Agreement": "MAINTENANCE",
    "Monitoring": "MONITORING",
    "Monitoring & Controls": "MONITORING",
    "Inspection": "INSPECTION",
    "Testing": "TESTING",
    "Efficiency": "OPTIMIZATION",
    "IAQ": "OTHER",
    "Controls & Automation": "ENGINEERING",
    "Grid Interconnection": "ENGINEERING",
    "Electrical Safety Studies": "ENGINEERING",
    "Administrative": "OTHER",
    "Demolition": "OTHER",
    # Equipment/Product categories
    "Equipment": "OTHER",
    "Materials": "OTHER",
    "Commercial Labor": "OTHER",
    # Trade-specific services
    "Commercial HVAC": "MAINTENANCE",
    "Commercial Electrical": "INSTALLATION",
    "Commercial Lighting": "INSTALLATION",
    "Commercial Plumbing": "INSTALLATION",
    "Commercial Solar": "INSTALLATION",
    "Utility-Scale Solar": "INSTALLATION",
    "EV Infrastructure": "INSTALLATION",
    "Energy Storage": "INSTALLATION",
    "Smart Home": "INSTALLATION",
    # Industrial categories
    "Industrial Automation": "ENGINEERING",
    "Industrial Cooling": "INSTALLATION",
    "Industrial Heating": "INSTALLATION",
    "Industrial Piping": "INSTALLATION",
    "Industrial Ventilation": "INSTALLATION",
    "Industrial Gases": "OTHER",
    "Industrial Sprinkler": "INSTALLATION",
    # Power/Electrical categories
    "Critical Power": "INSTALLATION",
    "Emergency Power": "INSTALLATION",
    "Medium Voltage": "INSTALLATION",
    "Motor Control": "INSTALLATION",
    "Power Quality": "TESTING",
    "Distribution Transformers": "OTHER",
    "Utility Metering": "OTHER",
    # Data Center
    "Data Center Cooling": "INSTALLATION",
    "Clean Room Systems": "INSTALLATION",
    # Fire/Safety
    "Fire Alarm": "INSTALLATION",
    "Fire Protection": "INSPECTION",
    "Fire Pumps": "INSTALLATION",
    "Special Hazard": "INSTALLATION",
    # Water/Plumbing
    "Water Treatment": "INSTALLATION",
    "Gas": "INSTALLATION",
}

# ProductCategory mapping: JSON human-readable → API enum
# ProductCategory enums: BATTERY_SYSTEM, BATTERY_MANAGEMENT_SYSTEM, CHARGING_GATEWAY,
#   COMBINER_BOX, EV_CHARGER, LOAD_CENTER, MICROINVERTER, MOUNTING, POWER_OPTIMIZER,
#   PRODUCTION_METER, PV_INVERTER, PV_MODULE, RACKING, RAPID_SHUTDOWN_DEVICE, TRACKER,
#   WEATHER_STATION, OTHER
PRODUCT_CATEGORY_MAP = {
    "Commercial Solar": "PV_INVERTER",
    "Commercial HVAC": "OTHER",
    "Motor Control": "OTHER",
    "Distribution Transformers": "OTHER",
    "Materials": "OTHER",
    "Equipment": "OTHER",
    "Air Conditioner": "OTHER",
    "Rooftop Unit (RTU)": "OTHER",
    "Heat Pump": "OTHER",
    "Thermostat": "OTHER",
}

# TradeGroup mapping: JSON catalog → API tradeGroup enum
# API accepts: ENERGY, MECHANICAL, ELECTRICAL, PLUMBING, LOW_VOLTAGE, ENVELOPE, OTHER
TRADE_GROUP_MAP = {
    "MECHANICAL": "MECHANICAL",
    "ELECTRICAL": "ELECTRICAL",
    "PLUMBING": "PLUMBING",
    "ENERGY": "ENERGY",
    "LOW_VOLTAGE": "LOW_VOLTAGE",
    "ROOFING": "ENVELOPE",  # Roofing maps to ENVELOPE
    "FIRE_SAFETY": "OTHER",  # Fire Safety doesn't have dedicated group
}

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Coperniq API configuration
COPERNIQ_API_URL = "https://api.coperniq.io/v1"
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")
COPERNIQ_COMPANY_ID = os.getenv("COPERNIQ_COMPANY_ID", "388")

# Rate limiting
REQUEST_DELAY = 0.5  # seconds between requests


def load_expanded_catalog(use_consolidated: bool = True) -> dict:
    """Load the catalog JSON file.

    Args:
        use_consolidated: If True, use the Phase 1 consolidated file (default).
                         If False, use the old expanded catalog format.
    """
    if use_consolidated:
        # New Phase 1 consolidated format - items already transformed to API schema
        catalog_path = Path(__file__).parent.parent / 'config' / 'phase1-consolidated-import.json'
    else:
        # Old format for backwards compatibility
        catalog_path = Path(__file__).parent.parent / 'config' / 'master-catalog' / 'catalog-items-expanded.json'

    with open(catalog_path, 'r') as f:
        return json.load(f)


def create_catalog_item(item: dict[str, Any], dry_run: bool = False, pre_transformed: bool = True) -> dict | None:
    """
    Create a single catalog item via the Coperniq REST API.

    Args:
        item: Catalog item data
        dry_run: If True, don't actually create the item
        pre_transformed: If True, item is already in API schema format (from consolidated file)

    Returns:
        API response or None on error
    """
    if not COPERNIQ_API_KEY:
        print("ERROR: COPERNIQ_API_KEY not set in environment")
        return None

    # Skip section markers
    if 'section' in item:
        return None

    if pre_transformed:
        # Item is already in API format from consolidated file
        payload = {
            "name": item["name"],
            "type": item["type"],
            "category": item["category"],
            "tradeGroup": item["tradeGroup"],
            "description": item.get("description", ""),
            "cost": item.get("cost", 0),
            "price": item.get("price", 0),
        }
        if "code" in item:
            payload["code"] = item["code"]
        if "manufacturer" in item:
            payload["manufacturer"] = item["manufacturer"]
    else:
        # Legacy format - needs transformation
        # Map category to API enum based on item type
        raw_category = item.get("category", "")
        item_type = item["type"].upper()
        if item_type == "PRODUCT":
            mapped_category = PRODUCT_CATEGORY_MAP.get(raw_category, "OTHER")
        else:
            mapped_category = SERVICE_CATEGORY_MAP.get(raw_category, "OTHER")

        # Map catalog/trade to API tradeGroup enum
        # API CONSTRAINT: tradeGroup must be 'OTHER' for SERVICE type items
        if item_type == "SERVICE":
            mapped_trade = "OTHER"  # Services must use OTHER
        else:
            raw_trade = item.get("catalog", "OTHER")
            mapped_trade = TRADE_GROUP_MAP.get(raw_trade, "OTHER")

        # Prepare payload for Coperniq API
        payload = {
            "name": item["name"],
            "type": item["type"].upper(),  # API requires UPPERCASE: PRODUCT or SERVICE
            "category": mapped_category,
            "tradeGroup": mapped_trade,
            "description": item.get("description", ""),
            "cost": item.get("cost", 0),
            "price": item.get("price", 0),
        }

        # Add optional fields
        if "code" in item:
            payload["code"] = item["code"]
        if "manufacturer" in item:
            payload["manufacturer"] = item["manufacturer"]
        if "sku" in item:
            payload["sku"] = item["sku"]

    if dry_run:
        print(f"  [DRY RUN] Would create: {item['name']}")
        print(f"            type={payload['type']}, category={payload['category']}, tradeGroup={payload['tradeGroup']}")
        return {"dry_run": True, "item": payload}

    try:
        response = requests.post(
            f"{COPERNIQ_API_URL}/catalog-items",
            headers={
                "x-api-key": COPERNIQ_API_KEY,
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=30
        )

        if response.status_code in [200, 201]:
            print(f"  ✅ Created: {item['name']}")
            return response.json()
        else:
            print(f"  ❌ Failed ({response.status_code}): {item['name']}")
            print(f"     Response: {response.text[:200]}")
            return None

    except Exception as e:
        print(f"  ❌ Error creating {item['name']}: {str(e)}")
        return None


def main():
    """Main entry point."""
    dry_run = "--dry-run" in sys.argv
    use_legacy = "--legacy" in sys.argv  # Use old format

    print("=" * 60)
    print("Coperniq Catalog Import - Phase 1 Consolidated")
    print("=" * 60)
    print(f"API URL: {COPERNIQ_API_URL}")
    print(f"Company ID: {COPERNIQ_COMPANY_ID}")
    print(f"Dry Run: {dry_run}")
    print(f"Using: {'Legacy format' if use_legacy else 'Phase 1 Consolidated (378 items)'}")
    print("=" * 60)

    if not COPERNIQ_API_KEY:
        print("\nERROR: COPERNIQ_API_KEY not found in environment!")
        print("Please set it in your .env file.")
        sys.exit(1)

    # Load catalog
    print("\nLoading catalog...")
    catalog = load_expanded_catalog(use_consolidated=not use_legacy)

    # Handle both formats
    if use_legacy:
        items_list = catalog.get("new_items", [])
        pre_transformed = False
    else:
        items_list = catalog.get("items", [])
        pre_transformed = True
        # Show stats from consolidated file
        metadata = catalog.get("metadata", {})
        stats = metadata.get("stats", {})
        print(f"\n📊 Catalog Stats:")
        print(f"   Total items: {metadata.get('total_items', len(items_list))}")
        if "by_type" in stats:
            print(f"   Products: {stats['by_type'].get('PRODUCT', 0)}")
            print(f"   Services: {stats['by_type'].get('SERVICE', 0)}")
        if "by_trade" in stats:
            print(f"   By Trade: {', '.join(f'{k}:{v}' for k, v in stats['by_trade'].items())}")

    # Filter out any section markers (shouldn't exist in consolidated, but safety check)
    items_to_import = [item for item in items_list if "section" not in item]

    print(f"\nFound {len(items_to_import)} items to import")
    print()

    # Track results
    created = 0
    failed = 0

    # Import items
    for i, item in enumerate(items_to_import, 1):
        # Progress indicator every 50 items
        if i % 50 == 0:
            print(f"\n📦 Progress: {i}/{len(items_to_import)} items processed...")

        result = create_catalog_item(item, dry_run=dry_run, pre_transformed=pre_transformed)

        if result:
            created += 1
        else:
            failed += 1

        # Rate limiting
        if not dry_run:
            time.sleep(REQUEST_DELAY)

    # Summary
    print("\n" + "=" * 60)
    print("Import Summary")
    print("=" * 60)
    print(f"Total items processed: {created + failed}")
    print(f"Successfully created: {created}")
    print(f"Failed: {failed}")

    if dry_run:
        print("\n⚠️  DRY RUN - No items were actually created")
        print("   Run without --dry-run to import items")
    else:
        print(f"\n✅ Import complete! Check Coperniq catalog at:")
        print(f"   https://app.coperniq.io/{COPERNIQ_COMPANY_ID}/company/studio/catalog")


if __name__ == "__main__":
    main()
