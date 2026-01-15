#!/usr/bin/env python3
"""
Coperniq Catalog Bulk Import Script

Imports catalog items from master-catalog/catalog-items.json to Coperniq via REST API.

Usage:
    # Using API key from .env file
    python import_catalog.py

    # Using API key as argument
    python import_catalog.py --api-key YOUR_API_KEY

    # Generate API key first (requires Coperniq login credentials)
    python import_catalog.py --generate-key --email YOUR_EMAIL --password YOUR_PASSWORD

Requirements:
    pip install httpx python-dotenv
"""

import json
import os
import sys
import argparse
import time
from pathlib import Path
from typing import Optional

try:
    import httpx
except ImportError:
    print("Error: httpx not installed. Run: pip install httpx")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    print("Error: python-dotenv not installed. Run: pip install python-dotenv")
    sys.exit(1)


# Configuration
BASE_URL = "https://api.coperniq.io/v1"
CATALOG_FILE = Path(__file__).parent.parent / "config" / "master-catalog" / "catalog-items.json"

# Trade group mapping (our JSON catalog field → API tradeGroup)
TRADE_GROUP_MAP = {
    "ENERGY": "ENERGY",
    "MECHANICAL": "MECHANICAL",
    "ELECTRICAL": "ELECTRICAL",
    "PLUMBING": "PLUMBING",
    "LOW_VOLTAGE": "LOW_VOLTAGE",
    "FIRE_SAFETY": "OTHER",  # API may not have FIRE_SAFETY, map to OTHER
    "ROOFING": "ENVELOPE",   # Roofing is part of building envelope
}

# Service category mapping (our free-form → API enum values)
SERVICE_CATEGORY_MAP = {
    "Installation": "INSTALLATION",
    "Maintenance": "MAINTENANCE",
    "Repair": "REPAIR",
    "Diagnostics": "DIAGNOSTICS",
    "Inspection": "INSPECTION",
    "Cleaning": "CLEANING",
    "Commissioning": "COMMISSIONING",
    "Site Survey": "SITE_SURVEY",
    "Testing": "TESTING",
    "Replacement": "REPLACEMENT",
    # Default fallback
    "DEFAULT": "OTHER"
}

# Product category mapping (our free-form → API enum values)
PRODUCT_CATEGORY_MAP = {
    # Energy trade
    "Equipment": "OTHER",  # Will be refined based on name
    "Materials": "OTHER",
    # Specific mappings by item name patterns
}


def load_env():
    """Load environment variables from .env file."""
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        return True
    return False


def generate_api_key(email: str, password: str) -> Optional[str]:
    """
    Generate a new Coperniq API key using Basic Auth credentials.

    POST https://api.coperniq.io/v1/api-keys
    Authorization: Basic base64(email:password)
    """
    import base64

    credentials = base64.b64encode(f"{email}:{password}".encode()).decode()

    with httpx.Client() as client:
        try:
            response = client.post(
                f"{BASE_URL}/api-keys",
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/json"
                },
                json={
                    "name": "MEP Catalog Import Script",
                    "description": "API key for bulk catalog import"
                },
                timeout=30.0
            )

            if response.status_code in (200, 201):
                data = response.json()
                api_key = data.get("token") or data.get("key") or data.get("apiKey")
                print(f"✅ API key generated successfully!")
                print(f"   Token: {api_key}")
                print(f"   Company ID: {data.get('companyId')}")
                print(f"   Add to .env: COPERNIQ_API_KEY={api_key}")
                return api_key
            else:
                print(f"❌ Failed to generate API key: {response.status_code}")
                print(f"   Response: {response.text}")
                return None

        except httpx.RequestError as e:
            print(f"❌ Request error: {e}")
            return None


def load_catalog() -> list[dict]:
    """Load and parse the catalog items JSON file."""
    if not CATALOG_FILE.exists():
        print(f"❌ Catalog file not found: {CATALOG_FILE}")
        sys.exit(1)

    with open(CATALOG_FILE, "r") as f:
        data = json.load(f)

    items = data.get("catalog_items", [])

    # Filter out section headers (items with only "section" key)
    catalog_items = [
        item for item in items
        if "name" in item and "type" in item
    ]

    print(f"📦 Loaded {len(catalog_items)} catalog items from JSON")
    return catalog_items


def get_product_category(item_name: str, trade: str) -> str:
    """Map product name to valid Coperniq ProductCategory enum value."""
    name_lower = item_name.lower()

    # Energy trade products
    if "solar panel" in name_lower or "pv module" in name_lower:
        return "PV_MODULE"
    if "inverter" in name_lower and "micro" in name_lower:
        return "MICROINVERTER"
    if "inverter" in name_lower:
        return "PV_INVERTER"
    if "battery" in name_lower:
        return "BATTERY_SYSTEM"
    if "ev charger" in name_lower or "charger" in name_lower:
        return "EV_CHARGER"
    if "generator" in name_lower:
        return "GENERATOR"
    if "transfer switch" in name_lower:
        return "AUTOMATIC_TRANSFER_SWITCH"

    # Mechanical trade products
    if "thermostat" in name_lower:
        return "THERMOSTAT"
    if "heat pump" in name_lower:
        return "HEAT_PUMP"
    if "condenser" in name_lower or "ac unit" in name_lower:
        return "AIR_CONDITIONER"
    if "furnace" in name_lower:
        return "ROOFTOP_UNIT"  # Closest match
    if "mini split" in name_lower:
        return "AIR_CONDITIONER"
    if "filter" in name_lower:
        return "OTHER"

    # Electrical trade products
    if "panel" in name_lower and ("main" in name_lower or "sub" in name_lower):
        return "PANELBOARD"
    if "breaker" in name_lower:
        return "BREAKER"
    if "outlet" in name_lower or "receptacle" in name_lower:
        return "OTHER"
    if "surge" in name_lower:
        return "OTHER"

    # Plumbing trade products
    if "water heater" in name_lower:
        return "WATER_HEATER"
    if "disposal" in name_lower:
        return "OTHER"
    if "toilet" in name_lower or "faucet" in name_lower:
        return "OTHER"

    # Low voltage trade products
    if "camera" in name_lower:
        return "CAMERA"
    if "sensor" in name_lower:
        return "SENSOR"
    if "nvr" in name_lower or "video recorder" in name_lower:
        return "NETWORK_VIDEO_RECORDER"
    if "switch" in name_lower and "network" in name_lower:
        return "NETWORK_SWITCH"
    if "doorbell" in name_lower:
        return "CAMERA"
    if "security panel" in name_lower:
        return "ACCESS_CONTROLLER"
    if "cable" in name_lower or "cat6" in name_lower:
        return "WIRE"

    # Fire & safety products
    if "smoke" in name_lower or "detector" in name_lower:
        return "SENSOR"
    if "extinguisher" in name_lower:
        return "OTHER"
    if "exit sign" in name_lower or "emergency light" in name_lower:
        return "OTHER"
    if "sprinkler" in name_lower:
        return "OTHER"
    if "alarm" in name_lower:
        return "SENSOR"

    # Roofing products
    if "shingle" in name_lower or "underlayment" in name_lower:
        return "OTHER"
    if "flashing" in name_lower or "vent" in name_lower:
        return "OTHER"
    if "gutter" in name_lower:
        return "OTHER"

    return "OTHER"


def get_trade_for_product_category(category: str, default_trade: str) -> str:
    """
    Get the correct tradeGroup for a product category.
    Some product categories require specific trade groups.
    """
    # Map product categories to their required trade groups
    CATEGORY_TRADE_MAP = {
        "GENERATOR": "ELECTRICAL",
        "AUTOMATIC_TRANSFER_SWITCH": "ELECTRICAL",
        "HEAT_PUMP": "MECHANICAL",
        "AIR_CONDITIONER": "MECHANICAL",
        "ROOFTOP_UNIT": "MECHANICAL",
        "THERMOSTAT": "MECHANICAL",
        "PANELBOARD": "ELECTRICAL",
        "BREAKER": "ELECTRICAL",
        "WATER_HEATER": "PLUMBING",
        "CAMERA": "LOW_VOLTAGE",
        "SENSOR": "LOW_VOLTAGE",
        "NETWORK_VIDEO_RECORDER": "LOW_VOLTAGE",
        "NETWORK_SWITCH": "LOW_VOLTAGE",
        "ACCESS_CONTROLLER": "LOW_VOLTAGE",
        "WIRE": "ELECTRICAL",  # Wire requires ELECTRICAL trade
    }
    return CATEGORY_TRADE_MAP.get(category, default_trade)


def transform_item(item: dict) -> dict:
    """
    Transform catalog item from our JSON schema to Coperniq API schema.

    Our JSON:
        name, catalog, type, category, cost, price, code, description, manufacturer

    Coperniq API:
        name, tradeGroup, type, category, cost, price, code, description, manufacturer, sku

    Rules discovered:
        - Services MUST have tradeGroup: "OTHER"
        - Products MUST have manufacturer field
        - Some product categories require specific tradeGroups
    """
    item_type = item["type"]
    original_category = item.get("category", "")

    if item_type == "SERVICE":
        # Services must use tradeGroup "OTHER"
        category = SERVICE_CATEGORY_MAP.get(original_category, SERVICE_CATEGORY_MAP["DEFAULT"])
        trade_group = "OTHER"
    else:  # PRODUCT
        category = get_product_category(item["name"], item.get("catalog", ""))
        # Get the correct trade group for this product category
        default_trade = TRADE_GROUP_MAP.get(item.get("catalog"), "OTHER")
        trade_group = get_trade_for_product_category(category, default_trade)

    api_item = {
        "name": item["name"],
        "type": item_type,
        "category": category,
        "cost": item["cost"],
        "price": item["price"],
        "tradeGroup": trade_group,
    }

    # Optional fields
    if item.get("code"):
        api_item["code"] = item["code"]
    if item.get("description"):
        api_item["description"] = item["description"]

    # Products require manufacturer - use "Various" as default
    if item_type == "PRODUCT":
        api_item["manufacturer"] = item.get("manufacturer") or "Various"

    return api_item


def create_catalog_item(client: httpx.Client, api_key: str, item: dict) -> tuple[bool, str]:
    """
    Create a single catalog item via POST /catalog-items

    Returns:
        (success: bool, message: str)
    """
    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json"
    }

    try:
        response = client.post(
            f"{BASE_URL}/catalog-items",
            headers=headers,
            json=item,
            timeout=30.0
        )

        if response.status_code in (200, 201):
            return True, "Created"
        elif response.status_code == 409:
            # Conflict - item may already exist
            return False, f"Conflict (may already exist): {response.text}"
        elif response.status_code == 422:
            # Validation error
            return False, f"Validation error: {response.text}"
        else:
            return False, f"HTTP {response.status_code}: {response.text}"

    except httpx.RequestError as e:
        return False, f"Request error: {e}"


def list_existing_items(client: httpx.Client, api_key: str) -> set[str]:
    """
    Get list of existing catalog item names to avoid duplicates.

    GET /catalog-items
    """
    headers = {"x-api-key": api_key}
    existing_names = set()

    try:
        response = client.get(
            f"{BASE_URL}/catalog-items",
            headers=headers,
            timeout=30.0
        )

        if response.status_code == 200:
            items = response.json()
            if isinstance(items, list):
                existing_names = {item.get("name", "") for item in items}
            elif isinstance(items, dict) and "items" in items:
                existing_names = {item.get("name", "") for item in items["items"]}

            print(f"📋 Found {len(existing_names)} existing catalog items")
        else:
            print(f"⚠️  Could not list existing items: {response.status_code}")

    except httpx.RequestError as e:
        print(f"⚠️  Error listing existing items: {e}")

    return existing_names


def import_catalog(api_key: str, skip_existing: bool = True, dry_run: bool = False):
    """
    Main import function - loads catalog and creates items via API.

    Args:
        api_key: Coperniq API key
        skip_existing: Skip items that already exist (by name)
        dry_run: Print what would be created without actually creating
    """
    catalog_items = load_catalog()

    with httpx.Client() as client:
        # Get existing items to avoid duplicates
        existing_names = set()
        if skip_existing and not dry_run:
            existing_names = list_existing_items(client, api_key)

        # Statistics
        created = 0
        skipped = 0
        failed = 0
        errors = []

        print(f"\n{'🔍 DRY RUN MODE - No items will be created' if dry_run else '🚀 Starting import...'}\n")

        for i, item in enumerate(catalog_items, 1):
            name = item["name"]

            # Skip if already exists
            if name in existing_names:
                print(f"  [{i:3d}/{len(catalog_items)}] ⏭️  {name} (already exists)")
                skipped += 1
                continue

            # Transform to API schema
            api_item = transform_item(item)

            if dry_run:
                print(f"  [{i:3d}/{len(catalog_items)}] 📝 Would create: {name}")
                print(f"       Type: {api_item['type']}, Trade: {api_item['tradeGroup']}, Price: ${api_item['price']}")
                created += 1
                continue

            # Create via API
            success, message = create_catalog_item(client, api_key, api_item)

            if success:
                print(f"  [{i:3d}/{len(catalog_items)}] ✅ {name}")
                created += 1
            else:
                print(f"  [{i:3d}/{len(catalog_items)}] ❌ {name}: {message}")
                failed += 1
                errors.append((name, message))

            # Rate limiting - small delay between requests
            time.sleep(0.1)

        # Summary
        print(f"\n{'=' * 60}")
        print(f"📊 Import Summary")
        print(f"{'=' * 60}")
        print(f"   Total items:     {len(catalog_items)}")
        print(f"   Created:         {created}")
        print(f"   Skipped:         {skipped}")
        print(f"   Failed:          {failed}")

        if errors:
            print(f"\n❌ Failed items:")
            for name, msg in errors[:10]:
                print(f"   - {name}: {msg}")
            if len(errors) > 10:
                print(f"   ... and {len(errors) - 10} more")


def main():
    parser = argparse.ArgumentParser(
        description="Import catalog items to Coperniq via REST API",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Import using API key from .env
    python import_catalog.py

    # Import with explicit API key
    python import_catalog.py --api-key YOUR_KEY

    # Dry run (preview without creating)
    python import_catalog.py --dry-run

    # Generate new API key first
    python import_catalog.py --generate-key --email your@email.com --password yourpass
        """
    )

    parser.add_argument("--api-key", help="Coperniq API key (or set COPERNIQ_API_KEY env var)")
    parser.add_argument("--generate-key", action="store_true", help="Generate new API key")
    parser.add_argument("--email", help="Coperniq email (for --generate-key)")
    parser.add_argument("--password", help="Coperniq password (for --generate-key)")
    parser.add_argument("--dry-run", action="store_true", help="Preview import without creating")
    parser.add_argument("--no-skip", action="store_true", help="Don't skip existing items")

    args = parser.parse_args()

    # Load .env file
    load_env()

    print("=" * 60)
    print("🏗️  Coperniq Catalog Import Tool")
    print("=" * 60)

    # Generate API key if requested
    if args.generate_key:
        email = args.email or os.getenv("COPERNIQ_EMAIL")
        password = args.password or os.getenv("COPERNIQ_PASSWORD")

        if not email or not password:
            print("❌ Error: --email and --password required for --generate-key")
            sys.exit(1)

        api_key = generate_api_key(email, password)
        if not api_key:
            sys.exit(1)
    else:
        # Get API key from args or env
        api_key = args.api_key or os.getenv("COPERNIQ_API_KEY")

        if not api_key:
            print("❌ Error: No API key found!")
            print("   Either:")
            print("   1. Set COPERNIQ_API_KEY in .env file")
            print("   2. Pass --api-key argument")
            print("   3. Use --generate-key to create a new key")
            sys.exit(1)

    # Run import
    import_catalog(
        api_key=api_key,
        skip_existing=not args.no_skip,
        dry_run=args.dry_run
    )


if __name__ == "__main__":
    main()
