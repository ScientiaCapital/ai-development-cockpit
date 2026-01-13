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

# Load environment variables
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Coperniq API configuration
COPERNIQ_API_URL = "https://api.coperniq.io/v1"
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")
COPERNIQ_COMPANY_ID = os.getenv("COPERNIQ_COMPANY_ID", "388")

# Rate limiting
REQUEST_DELAY = 0.5  # seconds between requests


def load_expanded_catalog() -> dict:
    """Load the expanded catalog JSON file."""
    catalog_path = Path(__file__).parent.parent / 'config' / 'master-catalog' / 'catalog-items-expanded.json'
    with open(catalog_path, 'r') as f:
        return json.load(f)


def create_catalog_item(item: dict[str, Any], dry_run: bool = False) -> dict | None:
    """
    Create a single catalog item via the Coperniq REST API.

    Args:
        item: Catalog item data
        dry_run: If True, don't actually create the item

    Returns:
        API response or None on error
    """
    if not COPERNIQ_API_KEY:
        print("ERROR: COPERNIQ_API_KEY not set in environment")
        return None

    # Skip section markers
    if 'section' in item:
        return None

    # Prepare payload for Coperniq API
    payload = {
        "name": item["name"],
        "type": item["type"].lower(),  # service or product
        "category": item.get("category", ""),
        "description": item.get("description", ""),
        "cost": item.get("cost", 0),
        "price": item.get("price", 0),
    }

    # Add optional fields
    if "code" in item:
        payload["code"] = item["code"]
    if "manufacturer" in item:
        payload["manufacturer"] = item["manufacturer"]

    if dry_run:
        print(f"  [DRY RUN] Would create: {item['name']} ({item['type']})")
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
    print("Coperniq Expanded Catalog Import")
    print("=" * 60)
    print(f"API URL: {COPERNIQ_API_URL}")
    print(f"Company ID: {COPERNIQ_COMPANY_ID}")
    print(f"Dry Run: {dry_run}")
    print("=" * 60)

    if not COPERNIQ_API_KEY:
        print("\nERROR: COPERNIQ_API_KEY not found in environment!")
        print("Please set it in your .env file.")
        sys.exit(1)

    # Load expanded catalog
    print("\nLoading expanded catalog...")
    catalog = load_expanded_catalog()
    new_items = catalog.get("new_items", [])

    # Filter out section markers
    items_to_import = [item for item in new_items if "section" not in item]

    print(f"Found {len(items_to_import)} items to import")
    print()

    # Track results
    created = 0
    failed = 0
    skipped = 0

    # Import items
    current_section = ""
    for item in new_items:
        if "section" in item:
            current_section = item["section"]
            print(f"\n{current_section}")
            continue

        result = create_catalog_item(item, dry_run=dry_run)

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


if __name__ == "__main__":
    main()
