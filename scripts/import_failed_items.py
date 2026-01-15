#!/usr/bin/env python3
"""
Import only the 42 catalog items that failed in the initial import.

These items failed due to invalid category values (HVAC_EQUIPMENT, ELECTRICAL_PANEL)
that don't exist in the Coperniq API.
"""

import json
import os
import sys
import time
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Coperniq API configuration
COPERNIQ_API_URL = "https://api.coperniq.io/v1"
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")
COPERNIQ_COMPANY_ID = os.getenv("COPERNIQ_COMPANY_ID", "388")

# Rate limiting
REQUEST_DELAY = 0.5

# List of items that failed in the initial import (exact names)
FAILED_ITEM_NAMES = [
    # HVAC - Split AC Systems (7)
    "Split AC System 1.5 Ton 14 SEER",
    "Split AC System 2.0 Ton 14 SEER",
    "Split AC System 2.5 Ton 14 SEER",
    "Split AC System 3.0 Ton 14 SEER",
    "Split AC System 3.5 Ton 14 SEER",
    "Split AC System 4.0 Ton 14 SEER",
    "Split AC System 5.0 Ton 14 SEER",
    # HVAC - Gas Furnaces (6)
    "Gas Furnace 40,000 BTU 80% AFUE",
    "Gas Furnace 60,000 BTU 80% AFUE",
    "Gas Furnace 80,000 BTU 80% AFUE",
    "Gas Furnace 100,000 BTU 80% AFUE",
    "Gas Furnace 120,000 BTU 80% AFUE",
    "Gas Furnace 80,000 BTU 96% AFUE High Efficiency",
    "Gas Furnace 100,000 BTU 96% AFUE High Efficiency",
    # HVAC - Heat Pumps (5)
    "Heat Pump 2.0 Ton 15 SEER",
    "Heat Pump 3.0 Ton 15 SEER",
    "Heat Pump 4.0 Ton 15 SEER",
    "Cold Climate Heat Pump 3.0 Ton",
    "Cold Climate Heat Pump 4.0 Ton",
    # HVAC - Mini-Splits (7)
    "Mini-Split 9,000 BTU Single Zone",
    "Mini-Split 12,000 BTU Single Zone",
    "Mini-Split 18,000 BTU Single Zone",
    "Mini-Split 24,000 BTU Single Zone",
    "Mini-Split 36,000 BTU Single Zone",
    "Multi-Zone Mini-Split 2 Zone",
    "Multi-Zone Mini-Split 4 Zone",
    # HVAC - RTUs (5)
    "RTU 7.5 Ton Gas/Electric",
    "RTU 10 Ton Gas/Electric",
    "RTU 15 Ton Gas/Electric",
    "RTU 20 Ton Gas/Electric",
    "RTU 25 Ton Gas/Electric",
    # HVAC - Chillers (4)
    "Air-Cooled Chiller 50 Ton",
    "Air-Cooled Chiller 100 Ton",
    "Air-Cooled Chiller 150 Ton",
    "Air-Cooled Chiller 200 Ton",
    # Electrical - Panels and Switchboards (8)
    "Main Panel 100A Indoor",
    "Smart Electrical Panel - Span",
    "Panelboard 225A MLO",
    "Panelboard 400A MLO",
    "Switchboard 600A",
    "Switchboard 800A",
    "Switchboard 1200A",
]


def create_catalog_item(item: dict, dry_run: bool = False) -> dict | None:
    """Create a single catalog item via the Coperniq REST API."""
    if not COPERNIQ_API_KEY:
        print("ERROR: COPERNIQ_API_KEY not set in environment")
        return None

    payload = {
        "name": item["name"],
        "type": item["type"],
        "category": item["category"],  # Should be "OTHER" now
        "tradeGroup": item["tradeGroup"],
        "description": item.get("description", ""),
        "cost": item.get("cost", 0),
        "price": item.get("price", 0),
    }
    if "code" in item:
        payload["code"] = item["code"]
    if "manufacturer" in item:
        payload["manufacturer"] = item["manufacturer"]

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

    print("=" * 60)
    print("Coperniq Catalog Import - Failed Items Retry")
    print("=" * 60)
    print(f"API URL: {COPERNIQ_API_URL}")
    print(f"Company ID: {COPERNIQ_COMPANY_ID}")
    print(f"Dry Run: {dry_run}")
    print(f"Items to import: {len(FAILED_ITEM_NAMES)}")
    print("=" * 60)

    if not COPERNIQ_API_KEY:
        print("\nERROR: COPERNIQ_API_KEY not found in environment!")
        sys.exit(1)

    # Load consolidated catalog
    catalog_path = Path(__file__).parent.parent / 'config' / 'phase1-consolidated-import.json'
    with open(catalog_path, 'r') as f:
        catalog = json.load(f)

    items_list = catalog.get("items", [])

    # Filter to only failed items
    failed_items = [item for item in items_list if item["name"] in FAILED_ITEM_NAMES]

    print(f"\nFound {len(failed_items)} items matching failed item names")
    print()

    # Track results
    created = 0
    failed = 0

    # Import items
    for item in failed_items:
        result = create_catalog_item(item, dry_run=dry_run)

        if result:
            created += 1
        else:
            failed += 1

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
