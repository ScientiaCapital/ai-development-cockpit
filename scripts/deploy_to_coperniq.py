#!/usr/bin/env python3
"""
Deploy Payment Structures and Automations to Coperniq Instance 388

This script uses:
1. Coperniq REST API - for catalog items, financial documents, contacts
2. Playwright MCP - for Process Studio UI (automations, workflows, forms)

Usage:
    python scripts/deploy_to_coperniq.py --component all
    python scripts/deploy_to_coperniq.py --component payment-structures
    python scripts/deploy_to_coperniq.py --component automations
    python scripts/deploy_to_coperniq.py --dry-run
"""

import json
import os
import asyncio
import httpx
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Configuration
COPERNIQ_API_URL = "https://api.coperniq.io/v1"
COPERNIQ_INSTANCE = os.getenv("COPERNIQ_COMPANY_ID", "388")
COPERNIQ_API_KEY = os.getenv("COPERNIQ_API_KEY")
COPERNIQ_APP_URL = f"https://app.coperniq.io/{COPERNIQ_INSTANCE}"

# Paths
CONFIG_DIR = Path(__file__).parent.parent / "config"
PAYMENT_STRUCTURES_DIR = CONFIG_DIR / "payment-structures"
AUTOMATIONS_DIR = CONFIG_DIR / "trade-automations"


class CoperniqAPIClient:
    """Client for Coperniq REST API operations."""

    def __init__(self, api_key: str, base_url: str = COPERNIQ_API_URL):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json"
        }

    async def create_catalog_item(self, item: dict) -> dict:
        """Create a catalog item (service or product)."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/catalog-items",
                headers=self.headers,
                json=item,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def create_service_plan(self, plan: dict) -> dict:
        """Create a service plan template."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/service-plans",
                headers=self.headers,
                json=plan,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()

    async def list_catalog_items(self, item_type: Optional[str] = None) -> list:
        """List existing catalog items."""
        params = {}
        if item_type:
            params["type"] = item_type

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/catalog-items",
                headers=self.headers,
                params=params,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()


class PaymentStructureDeployer:
    """Deploy payment structure templates to Coperniq."""

    def __init__(self, api_client: CoperniqAPIClient):
        self.api = api_client
        self.results = {"created": [], "skipped": [], "errors": []}

    async def deploy_service_agreements(self, dry_run: bool = False):
        """Deploy service agreement plans as catalog items."""

        sa_file = PAYMENT_STRUCTURES_DIR / "service-agreement-templates.json"
        with open(sa_file) as f:
            sa_data = json.load(f)

        print("\n📋 Deploying Service Agreement Plans...")
        print("=" * 50)

        for trade, plans in sa_data.get("serviceAgreementTypes", {}).items():
            for plan_key, plan_data in plans.items():
                # Convert to catalog item format
                for billing in plan_data.get("billingOptions", []):
                    item_name = f"{plan_data['name']} ({billing['frequency']})"

                    # Calculate price based on billing option
                    if "price" in billing:
                        price = billing["price"]
                    elif "pricePerTon" in billing:
                        price = billing.get("minPrice", billing["pricePerTon"] * 5)
                    elif "pricePerUnit" in billing:
                        price = billing.get("minPrice", billing["pricePerUnit"] * 10)
                    else:
                        price = 0

                    catalog_item = {
                        "name": item_name,
                        "type": "SERVICE",
                        "category": "MAINTENANCE",
                        "price": price,
                        "cost": price * 0.4,  # 60% margin estimate
                        "description": plan_data.get("description", ""),
                        "code": f"SA-{trade}-{plan_key}-{billing['frequency']}"
                    }

                    if dry_run:
                        print(f"  [DRY RUN] Would create: {item_name} @ ${price}")
                        self.results["skipped"].append(item_name)
                    else:
                        try:
                            result = await self.api.create_catalog_item(catalog_item)
                            print(f"  ✅ Created: {item_name} (ID: {result.get('id')})")
                            self.results["created"].append(item_name)
                        except Exception as e:
                            print(f"  ❌ Error: {item_name} - {e}")
                            self.results["errors"].append({"item": item_name, "error": str(e)})

                    await asyncio.sleep(0.5)  # Rate limiting

    async def deploy_emergency_services(self, dry_run: bool = False):
        """Deploy emergency/premium service items."""

        pricing_file = PAYMENT_STRUCTURES_DIR / "emergency-premium-pricing.json"
        with open(pricing_file) as f:
            pricing_data = json.load(f)

        print("\n🚨 Deploying Emergency/Premium Service Items...")
        print("=" * 50)

        # Create premium service catalog items
        for service_key, service in pricing_data.get("premiumServices", {}).items():
            price = service.get("premium") or service.get("price", 0)

            catalog_item = {
                "name": service["name"],
                "type": "SERVICE",
                "category": "OTHER",
                "price": price,
                "cost": 0,
                "description": service.get("description", ""),
                "code": f"PREMIUM-{service_key}"
            }

            if dry_run:
                print(f"  [DRY RUN] Would create: {service['name']} @ ${price}")
                self.results["skipped"].append(service["name"])
            else:
                try:
                    result = await self.api.create_catalog_item(catalog_item)
                    print(f"  ✅ Created: {service['name']} (ID: {result.get('id')})")
                    self.results["created"].append(service["name"])
                except Exception as e:
                    print(f"  ❌ Error: {service['name']} - {e}")
                    self.results["errors"].append({"item": service["name"], "error": str(e)})

            await asyncio.sleep(0.5)


class PlaywrightAutomationBuilder:
    """
    Build automations in Coperniq Process Studio using Playwright MCP.

    This class generates the commands/steps needed - actual execution
    happens through Claude's Playwright MCP tools.
    """

    def __init__(self):
        self.automation_steps = []

    def generate_automation_steps(self) -> list:
        """Generate step-by-step Playwright commands for building automations."""

        automations_file = AUTOMATIONS_DIR / "core-automations.json"
        with open(automations_file) as f:
            automations_data = json.load(f)

        steps = []

        # Navigate to automations
        steps.append({
            "action": "navigate",
            "url": f"{COPERNIQ_APP_URL}/company/studio/automations",
            "description": "Navigate to Process Studio > Automations"
        })

        for category, data in automations_data.get("automationCategories", {}).items():
            for automation in data.get("automations", []):
                if automation.get("status") in ["TEMPLATE", "PARTIAL"]:
                    steps.append({
                        "action": "create_automation",
                        "automation": automation,
                        "steps": self._generate_automation_build_steps(automation)
                    })

        return steps

    def _generate_automation_build_steps(self, automation: dict) -> list:
        """Generate specific steps to build one automation."""

        return [
            {
                "step": 1,
                "action": "click",
                "target": "New Automation button",
                "selector": "button:has-text('New Automation')"
            },
            {
                "step": 2,
                "action": "type",
                "target": "Name field",
                "value": automation["name"]
            },
            {
                "step": 3,
                "action": "select_trigger",
                "trigger_type": automation["trigger"]["type"],
                "conditions": automation["trigger"].get("conditions", {})
            },
            {
                "step": 4,
                "action": "add_actions",
                "actions": automation["actions"]
            },
            {
                "step": 5,
                "action": "click",
                "target": "Save button",
                "selector": "button:has-text('Save')"
            }
        ]

    def export_playwright_script(self, output_path: Path):
        """Export a Playwright script for manual execution or review."""

        steps = self.generate_automation_steps()

        script = {
            "metadata": {
                "generated": datetime.now().isoformat(),
                "target": f"Coperniq Instance {COPERNIQ_INSTANCE}",
                "purpose": "Build automations in Process Studio"
            },
            "prerequisites": [
                "Login to Coperniq at https://app.coperniq.io",
                "Ensure you have admin access to Process Studio",
                "Have Playwright MCP server running"
            ],
            "steps": steps
        }

        with open(output_path, "w") as f:
            json.dump(script, f, indent=2)

        print(f"\n📄 Playwright script exported to: {output_path}")
        return output_path


def print_summary(results: dict):
    """Print deployment summary."""

    print("\n" + "=" * 60)
    print("📊 DEPLOYMENT SUMMARY")
    print("=" * 60)
    print(f"✅ Created: {len(results['created'])} items")
    print(f"⏭️  Skipped: {len(results['skipped'])} items")
    print(f"❌ Errors:  {len(results['errors'])} items")

    if results["errors"]:
        print("\nErrors:")
        for err in results["errors"]:
            print(f"  - {err['item']}: {err['error']}")


async def main():
    import argparse

    parser = argparse.ArgumentParser(description="Deploy to Coperniq Instance 388")
    parser.add_argument("--component", choices=["all", "payment-structures", "automations", "service-agreements", "emergency-services"],
                       default="all", help="Which component to deploy")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created without actually creating")
    parser.add_argument("--export-playwright", action="store_true", help="Export Playwright script for automations")

    args = parser.parse_args()

    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  Coperniq Instance 388 - Deployment Tool                     ║
║  Company: Kipper Energy Solutions                            ║
╚══════════════════════════════════════════════════════════════╝

Mode: {'DRY RUN' if args.dry_run else 'LIVE DEPLOYMENT'}
Component: {args.component}
""")

    # Check API key
    if not COPERNIQ_API_KEY and not args.dry_run and not args.export_playwright:
        print("❌ Error: COPERNIQ_API_KEY not set in .env file")
        print("   Set it to run live deployment, or use --dry-run to preview")
        return

    # Initialize API client
    api_client = CoperniqAPIClient(COPERNIQ_API_KEY or "dry-run-key")

    # Deploy based on component selection
    if args.component in ["all", "payment-structures", "service-agreements"]:
        deployer = PaymentStructureDeployer(api_client)
        await deployer.deploy_service_agreements(dry_run=args.dry_run)
        print_summary(deployer.results)

    if args.component in ["all", "payment-structures", "emergency-services"]:
        deployer = PaymentStructureDeployer(api_client)
        await deployer.deploy_emergency_services(dry_run=args.dry_run)
        print_summary(deployer.results)

    if args.component in ["all", "automations"] or args.export_playwright:
        builder = PlaywrightAutomationBuilder()

        if args.export_playwright:
            output_path = CONFIG_DIR / "playwright-automation-script.json"
            builder.export_playwright_script(output_path)
        else:
            print("\n🤖 Automation Deployment")
            print("=" * 50)
            print("Automations require Playwright MCP for UI interaction.")
            print("Use --export-playwright to generate the script, then run:")
            print("  'Build the automations from playwright-automation-script.json'")
            print("  in Claude Code with Playwright MCP enabled.")


if __name__ == "__main__":
    asyncio.run(main())
