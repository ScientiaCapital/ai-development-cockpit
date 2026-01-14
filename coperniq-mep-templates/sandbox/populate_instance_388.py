"""
Populate Instance 388 with Demo Data
====================================

Creates realistic MEP contractor data for Kipper Energy Solutions.
This data will appear in Coperniq UI at https://app.coperniq.io/388

Run: python sandbox/populate_instance_388.py
"""

import os
import sys
from pathlib import Path

# Add sandbox to path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

import httpx
from datetime import datetime, timedelta
import random

# API Configuration
BASE_URL = os.getenv("COPERNIQ_API_URL", "https://api.coperniq.io/v1")
API_KEY = os.getenv("COPERNIQ_API_KEY")

if not API_KEY:
    print("ERROR: COPERNIQ_API_KEY not set")
    sys.exit(1)

HEADERS = {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json"
}


def api_request(method: str, endpoint: str, data=None, params=None):
    """Make API request with error handling."""
    url = f"{BASE_URL}{endpoint}"
    try:
        response = httpx.request(
            method=method,
            url=url,
            headers=HEADERS,
            json=data,
            params=params,
            timeout=30.0,
        )
        if response.status_code >= 400:
            print(f"  ERROR {response.status_code}: {response.text[:200]}")
            return None
        return response.json() if response.text else {}
    except Exception as e:
        print(f"  ERROR: {e}")
        return None


# =============================================================================
# Sample Data for Kipper Energy Solutions (Austin, TX)
# =============================================================================

SAMPLE_CLIENTS = [
    {
        "title": "Johnson Residence",
        "primaryEmail": "johnson@email.com",
        "primaryPhone": "+15125551001",
        "address": ["123 Oak Hill Dr", "Austin, TX 78749"]
    },
    {
        "title": "Smith Family Home",
        "primaryEmail": "smith.family@email.com",
        "primaryPhone": "+15125551002",
        "address": ["456 Cedar Park Blvd", "Cedar Park, TX 78613"]
    },
    {
        "title": "Davis Property Management",
        "primaryEmail": "davis.pm@email.com",
        "primaryPhone": "+15125551003",
        "address": ["789 Downtown Blvd Suite 100", "Austin, TX 78701"]
    },
    {
        "title": "Martinez Restaurant Group",
        "primaryEmail": "martinez.group@email.com",
        "primaryPhone": "+15125551004",
        "address": ["321 Congress Ave", "Austin, TX 78701"]
    },
    {
        "title": "Wilson Commercial Properties",
        "primaryEmail": "wilson.comm@email.com",
        "primaryPhone": "+15125551005",
        "address": ["555 Research Blvd", "Austin, TX 78758"]
    },
    {
        "title": "Thompson Residence",
        "primaryEmail": "thompson.home@email.com",
        "primaryPhone": "+15125551006",
        "address": ["888 Lakeway Dr", "Lakeway, TX 78734"]
    },
    {
        "title": "Garcia Auto Shop",
        "primaryEmail": "garcia.auto@email.com",
        "primaryPhone": "+15125551007",
        "address": ["222 Industrial Blvd", "Austin, TX 78741"]
    },
    {
        "title": "Anderson Medical Clinic",
        "primaryEmail": "anderson.clinic@email.com",
        "primaryPhone": "+15125551008",
        "address": ["444 Medical Pkwy", "Austin, TX 78756"]
    },
]

SAMPLE_REQUESTS = [
    {
        "title": "AC Not Cooling - Emergency",
        "address": ["123 Oak Hill Dr", "Austin, TX 78749"],
        "trades": ["HVAC"],
        "priority": "EMERGENCY",
        "description": "AC unit stopped cooling. House temperature rising. 95F outside. Elderly resident.",
        "primaryPhone": "+15125551001"
    },
    {
        "title": "Furnace Making Strange Noise",
        "address": ["456 Cedar Park Blvd", "Cedar Park, TX 78613"],
        "trades": ["HVAC"],
        "priority": "URGENT",
        "description": "Furnace making loud banging noise when starting. Concerned about safety.",
        "primaryPhone": "+15125551002"
    },
    {
        "title": "Kitchen Hood Not Working",
        "address": ["321 Congress Ave", "Austin, TX 78701"],
        "trades": ["HVAC"],
        "priority": "URGENT",
        "description": "Commercial kitchen hood ventilation not working. Health inspection next week.",
        "primaryPhone": "+15125551004"
    },
    {
        "title": "PM Visit - Quarterly HVAC",
        "address": ["555 Research Blvd", "Austin, TX 78758"],
        "trades": ["HVAC"],
        "priority": "SCHEDULED",
        "description": "Quarterly preventive maintenance per service agreement. 3 RTUs.",
        "primaryPhone": "+15125551005"
    },
    {
        "title": "Water Heater Leaking",
        "address": ["888 Lakeway Dr", "Lakeway, TX 78734"],
        "trades": ["Plumbing"],
        "priority": "URGENT",
        "description": "Water heater in garage is leaking. Water spreading on floor.",
        "primaryPhone": "+15125551006"
    },
]

SAMPLE_PROJECTS = [
    {
        "title": "[HVAC] AC Replacement - Johnson",
        "address": ["123 Oak Hill Dr", "Austin, TX 78749"],
        "trades": ["HVAC"],
        "description": "Replace 15-year-old 3-ton split system. Customer approved 16 SEER upgrade."
    },
    {
        "title": "[Solar] 8kW Residential - Thompson",
        "address": ["888 Lakeway Dr", "Lakeway, TX 78734"],
        "trades": ["Solar"],
        "description": "8kW rooftop solar installation. South-facing roof. Enphase microinverters."
    },
    {
        "title": "[HVAC] RTU Replacement - Wilson Commercial",
        "address": ["555 Research Blvd", "Austin, TX 78758"],
        "trades": ["HVAC"],
        "description": "Replace 2 of 5 RTUs. 7.5 ton and 10 ton units. Weekend install required."
    },
    {
        "title": "[Fire] Sprinkler Inspection - Davis PM",
        "address": ["789 Downtown Blvd Suite 100", "Austin, TX 78701"],
        "trades": ["Fire Protection"],
        "description": "Annual fire sprinkler inspection per NFPA 25. Multi-story building."
    },
]


def populate_clients():
    """Create or update sample clients."""
    print("\n=== POPULATING CLIENTS ===")

    # Get existing clients first
    existing = api_request("GET", "/clients") or []
    existing_names = {c.get("title", ""): c.get("id") for c in existing if isinstance(existing, list)}

    created = 0
    for client in SAMPLE_CLIENTS:
        if client["title"] in existing_names:
            print(f"  SKIP: {client['title']} (already exists)")
            continue

        result = api_request("POST", "/clients", data=client)
        if result:
            print(f"  CREATE: {client['title']} -> ID {result.get('id')}")
            created += 1
        else:
            print(f"  FAIL: {client['title']}")

    print(f"  Total created: {created}")
    return created


def populate_requests():
    """Create sample service requests."""
    print("\n=== POPULATING REQUESTS ===")

    # Get existing requests
    existing = api_request("GET", "/requests") or []
    existing_titles = {r.get("title", "") for r in existing if isinstance(existing, list)}

    created = 0
    for req in SAMPLE_REQUESTS:
        if req["title"] in existing_titles:
            print(f"  SKIP: {req['title'][:40]}... (already exists)")
            continue

        result = api_request("POST", "/requests", data=req)
        if result:
            print(f"  CREATE: {req['title'][:40]}... -> ID {result.get('id')}")
            created += 1
        else:
            print(f"  FAIL: {req['title'][:40]}...")

    print(f"  Total created: {created}")
    return created


def populate_projects():
    """Create sample projects."""
    print("\n=== POPULATING PROJECTS ===")

    # Get existing projects
    existing = api_request("GET", "/projects") or []
    existing_titles = {p.get("title", "") for p in existing if isinstance(existing, list)}

    created = 0
    for proj in SAMPLE_PROJECTS:
        if proj["title"] in existing_titles:
            print(f"  SKIP: {proj['title'][:40]}... (already exists)")
            continue

        result = api_request("POST", "/projects", data=proj)
        if result:
            print(f"  CREATE: {proj['title'][:40]}... -> ID {result.get('id')}")
            created += 1
        else:
            print(f"  FAIL: {proj['title'][:40]}...")

    print(f"  Total created: {created}")
    return created


def create_work_orders():
    """Create work orders from templates for existing requests/projects."""
    print("\n=== CREATING WORK ORDERS ===")

    # Get templates
    templates = api_request("GET", "/work-orders/templates") or []
    template_map = {t.get("name", ""): t.get("id") for t in templates if isinstance(templates, list)}

    print(f"  Available templates: {len(template_map)}")

    # Get requests that need work orders
    requests = api_request("GET", "/requests") or []

    created = 0
    for req in requests[:5] if isinstance(requests, list) else []:
        req_id = req.get("id")
        title = req.get("title", "")

        # Match template to request type
        if "AC" in title or "HVAC" in title or "Furnace" in title:
            template_name = "HVAC - Emergency Service Call"
        elif "PM Visit" in title:
            template_name = "HVAC - AC Tune-Up / PM Visit"
        elif "Hood" in title:
            template_name = "HVAC - Emergency Service Call"
        elif "Water Heater" in title:
            template_name = "HVAC - Emergency Service Call"  # Placeholder
        else:
            continue

        template_id = template_map.get(template_name)
        if not template_id:
            print(f"  SKIP: No template '{template_name}' found")
            continue

        result = api_request("POST", f"/requests/{req_id}/work-orders", data={"templateId": template_id})
        if result:
            print(f"  CREATE: WO for '{title[:30]}...' using template {template_id}")
            created += 1
        else:
            print(f"  FAIL: WO for '{title[:30]}...'")

    print(f"  Total created: {created}")
    return created


def show_summary():
    """Show current Instance 388 summary."""
    print("\n" + "="*60)
    print("INSTANCE 388 SUMMARY")
    print("="*60)

    # Clients
    clients = api_request("GET", "/clients") or []
    named_clients = [c for c in clients if isinstance(clients, list) and c.get("title")]
    print(f"\nClients: {len(clients) if isinstance(clients, list) else 0} total, {len(named_clients)} named")

    # Requests
    requests = api_request("GET", "/requests") or []
    print(f"Requests: {len(requests) if isinstance(requests, list) else 0}")

    # Projects
    projects = api_request("GET", "/projects") or []
    print(f"Projects: {len(projects) if isinstance(projects, list) else 0}")

    # Work Orders
    work_orders = api_request("GET", "/work-orders") or []
    print(f"Work Orders: {len(work_orders) if isinstance(work_orders, list) else 0}")

    # Templates
    templates = api_request("GET", "/work-orders/templates") or []
    print(f"WO Templates: {len(templates) if isinstance(templates, list) else 0}")

    # Workflows
    workflows = api_request("GET", "/workflows") or []
    print(f"Workflows: {len(workflows) if isinstance(workflows, list) else 0}")

    print("\n" + "="*60)
    print("View at: https://app.coperniq.io/388")
    print("="*60)


if __name__ == "__main__":
    print("="*60)
    print("POPULATING INSTANCE 388 - Kipper Energy Solutions")
    print("="*60)

    # Run population
    populate_clients()
    populate_requests()
    populate_projects()
    create_work_orders()

    # Show summary
    show_summary()
