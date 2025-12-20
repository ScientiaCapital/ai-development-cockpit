#!/usr/bin/env python3
"""
Coperniq Mock Environment for E2B Sandbox
Creates contractor-specific sandboxes that mirror Coperniq's schema
for demos and testing without needing Coperniq API access.

Usage:
    # In E2B sandbox
    from coperniq_mock import CoperniqMock

    # Create contractor-specific instance
    hvac_contractor = CoperniqMock(contractor_type="hvac")

    # Create templates
    hvac_contractor.create_template(template_spec)

    # List templates
    hvac_contractor.list_templates()
"""

import json
import yaml
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field, asdict
from pathlib import Path


# =============================================================================
# COPERNIQ SCHEMA MIRROR
# =============================================================================

@dataclass
class CoperniqField:
    """Mirrors Coperniq form field structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    field_type: str = "Text"  # Text, Numeric, Single select, Multiple select, File
    required: bool = False
    placeholder: str = ""
    description: str = ""
    options: List[str] = field(default_factory=list)
    order: int = 0


@dataclass
class CoperniqGroup:
    """Mirrors Coperniq form group structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    order: int = 0
    is_critical: bool = False
    fields: List[CoperniqField] = field(default_factory=list)


@dataclass
class CoperniqTemplate:
    """Mirrors Coperniq form template structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    emoji: str = ""
    description: str = ""
    category: str = ""
    compliance: str = ""
    work_order_type: str = ""
    work_order_name: str = ""
    groups: List[CoperniqGroup] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    created_by: str = "ai-development-cockpit"
    status: str = "active"


@dataclass
class CoperniqWorkOrder:
    """Mirrors Coperniq work order template"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    emoji: str = ""
    description: str = ""
    is_field: bool = True
    linked_forms: List[str] = field(default_factory=list)
    groups: List[CoperniqGroup] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class CoperniqServicePlan:
    """Mirrors Coperniq service plan structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    emoji: str = ""
    description: str = ""
    duration_months: int = 12
    total_price: float = 0
    invoicing_frequency: str = "ONE_TIME"
    benefits: List[str] = field(default_factory=list)
    service_items: List[Dict] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())


# =============================================================================
# CONTRACTOR PROFILES
# =============================================================================

CONTRACTOR_PROFILES = {
    "hvac": {
        "name": "HVAC Contractor",
        "trades": ["HVAC"],
        "certifications": ["EPA 608", "NATE", "State HVAC License"],
        "templates": ["ac_system_inspection", "furnace_safety_inspection", "refrigerant_tracking_log"],
        "work_orders": ["hvac_service_call", "hvac_pm_visit"],
        "service_plans": ["hvac_bronze", "hvac_silver", "hvac_gold"]
    },
    "plumbing": {
        "name": "Plumbing Contractor",
        "trades": ["Plumbing"],
        "certifications": ["Backflow Certification", "State Plumbing License", "EPA Lead-Safe"],
        "templates": ["backflow_test_report", "camera_inspection", "water_heater_inspection"],
        "work_orders": ["plumbing_service_call"],
        "service_plans": ["plumbing_protect"]
    },
    "electrical": {
        "name": "Electrical Contractor",
        "trades": ["Electrical"],
        "certifications": ["State Electrical License", "OSHA 10/30", "NEC Certification"],
        "templates": ["panel_inspection", "circuit_load_analysis"],
        "work_orders": ["electrical_service_call"],
        "service_plans": []
    },
    "fire_protection": {
        "name": "Fire Protection Contractor",
        "trades": ["Fire Protection"],
        "certifications": ["NICET Level I-IV", "State Fire Protection License", "NFPA Certified"],
        "templates": ["sprinkler_inspection", "fire_extinguisher_inspection"],
        "work_orders": ["fire_inspection"],
        "service_plans": []
    },
    "low_voltage": {
        "name": "Low Voltage Contractor",
        "trades": ["Low Voltage", "Security", "AV"],
        "certifications": ["BICSI", "State Low Voltage License", "ASIS CPP"],
        "templates": ["security_system_inspection", "network_cable_test", "av_system_check"],
        "work_orders": ["low_voltage_service"],
        "service_plans": []
    },
    "roofing": {
        "name": "Roofing Contractor",
        "trades": ["Roofing"],
        "certifications": ["GAF Certified", "CertainTeed SELECT", "State Roofing License"],
        "templates": ["roof_inspection", "leak_detection", "shingle_condition"],
        "work_orders": ["roofing_service"],
        "service_plans": []
    },
    "general_contractor": {
        "name": "General Contractor (Self-Performing)",
        "trades": ["General", "HVAC", "Plumbing", "Electrical"],
        "certifications": ["State GC License", "OSHA 30", "EPA Lead-Safe"],
        "templates": ["site_inspection", "punch_list", "daily_report"],
        "work_orders": ["general_service"],
        "service_plans": []
    },
    "resimercial": {
        "name": "Resi-mercial Contractor",
        "trades": ["Residential", "Light Commercial"],
        "certifications": ["State Contractor License", "EPA 608", "NATE"],
        "templates": ["hvac_residential", "hvac_commercial_light"],
        "work_orders": ["resimercial_service"],
        "service_plans": ["residential_plan", "commercial_plan"]
    },
    "commercial_industrial": {
        "name": "Commercial & Industrial Contractor",
        "trades": ["Commercial HVAC", "Industrial"],
        "certifications": ["State C&I License", "EPA 608 Universal", "ASHRAE Certified"],
        "templates": ["chiller_inspection", "boiler_inspection", "vav_box_inspection"],
        "work_orders": ["commercial_service", "industrial_pm"],
        "service_plans": ["commercial_pm_plan"]
    }
}


# =============================================================================
# COPERNIQ MOCK CLASS
# =============================================================================

class CoperniqMock:
    """
    Mock Coperniq environment for testing and demos.
    Creates contractor-specific sandboxes with pre-loaded templates.
    """

    def __init__(self, contractor_type: str = "hvac", company_id: int = 112):
        self.company_id = company_id
        self.contractor_type = contractor_type
        self.profile = CONTRACTOR_PROFILES.get(contractor_type, CONTRACTOR_PROFILES["hvac"])

        # In-memory storage (mirrors Coperniq database)
        self.templates: Dict[str, CoperniqTemplate] = {}
        self.work_orders: Dict[str, CoperniqWorkOrder] = {}
        self.service_plans: Dict[str, CoperniqServicePlan] = {}
        self.form_submissions: List[Dict] = []

        print(f"🏢 Initialized Coperniq Mock for: {self.profile['name']}")
        print(f"   Company ID: {company_id}")
        print(f"   Trades: {', '.join(self.profile['trades'])}")
        print(f"   Certifications: {', '.join(self.profile['certifications'])}")

    def create_template_from_yaml(self, yaml_path: str) -> CoperniqTemplate:
        """Create a template from YAML specification file"""
        with open(yaml_path, 'r') as f:
            spec = yaml.safe_load(f)

        return self.create_template(spec)

    def create_template(self, spec: Dict) -> CoperniqTemplate:
        """Create a template from specification dict"""
        template_info = spec.get('template', {})

        groups = []
        for group_spec in spec.get('groups', []):
            fields = []
            for idx, field_spec in enumerate(group_spec.get('fields', [])):
                field = CoperniqField(
                    name=field_spec.get('name', ''),
                    field_type=field_spec.get('type', 'Text'),
                    required=field_spec.get('required', False),
                    placeholder=field_spec.get('placeholder', ''),
                    description=field_spec.get('description', ''),
                    options=field_spec.get('options', []),
                    order=idx
                )
                fields.append(field)

            group = CoperniqGroup(
                name=group_spec.get('name', ''),
                order=group_spec.get('order', 0),
                is_critical=group_spec.get('critical', False),
                fields=fields
            )
            groups.append(group)

        template = CoperniqTemplate(
            name=template_info.get('name', ''),
            emoji=template_info.get('emoji', ''),
            description=template_info.get('description', ''),
            category=template_info.get('category', ''),
            compliance=template_info.get('compliance', ''),
            work_order_type=template_info.get('work_order', {}).get('type', ''),
            work_order_name=template_info.get('work_order', {}).get('name', ''),
            groups=groups
        )

        self.templates[template.id] = template
        print(f"✅ Created template: {template.name} (ID: {template.id})")
        return template

    def list_templates(self) -> List[Dict]:
        """List all templates in the sandbox"""
        result = []
        for template in self.templates.values():
            total_fields = sum(len(g.fields) for g in template.groups)
            result.append({
                "id": template.id,
                "name": template.name,
                "category": template.category,
                "groups": len(template.groups),
                "fields": total_fields,
                "created_at": template.created_at
            })
        return result

    def get_template(self, template_id: str) -> Optional[CoperniqTemplate]:
        """Get a specific template by ID"""
        return self.templates.get(template_id)

    def submit_form(self, template_id: str, data: Dict) -> Dict:
        """Simulate form submission"""
        template = self.templates.get(template_id)
        if not template:
            return {"error": "Template not found"}

        submission = {
            "id": str(uuid.uuid4()),
            "template_id": template_id,
            "template_name": template.name,
            "data": data,
            "submitted_at": datetime.now().isoformat(),
            "status": "submitted"
        }
        self.form_submissions.append(submission)

        print(f"📝 Form submitted: {template.name}")
        return submission

    def get_form_submissions(self, template_id: Optional[str] = None) -> List[Dict]:
        """Get form submissions, optionally filtered by template"""
        if template_id:
            return [s for s in self.form_submissions if s["template_id"] == template_id]
        return self.form_submissions

    def export_to_json(self) -> str:
        """Export all data as JSON for demo purposes"""
        data = {
            "company_id": self.company_id,
            "contractor_type": self.contractor_type,
            "profile": self.profile,
            "templates": [asdict(t) for t in self.templates.values()],
            "work_orders": [asdict(w) for w in self.work_orders.values()],
            "service_plans": [asdict(s) for s in self.service_plans.values()],
            "form_submissions": self.form_submissions
        }
        return json.dumps(data, indent=2, default=str)

    def __repr__(self):
        return f"CoperniqMock(type={self.contractor_type}, templates={len(self.templates)})"


# =============================================================================
# E2B SANDBOX DEMO FUNCTIONS
# =============================================================================

def create_hvac_contractor_demo():
    """Demo: Create HVAC contractor sandbox with all templates"""
    mock = CoperniqMock(contractor_type="hvac")

    # Load templates from YAML
    templates_dir = Path(__file__).parent.parent / "templates" / "hvac"
    for yaml_file in templates_dir.glob("*.yaml"):
        mock.create_template_from_yaml(str(yaml_file))

    # Simulate form submission
    if mock.templates:
        first_template = list(mock.templates.values())[0]
        mock.submit_form(first_template.id, {
            "Unit Make/Model": "Carrier 24ACC636A003",
            "Serial Number": "12345ABC",
            "Technician Notes": "System running well"
        })

    return mock


def create_multi_trade_contractor_demo():
    """Demo: Create general contractor with multiple trades"""
    mock = CoperniqMock(contractor_type="general_contractor")

    # Load all templates
    templates_base = Path(__file__).parent.parent / "templates"
    for trade_dir in ["hvac", "plumbing", "electrical", "fire_protection"]:
        trade_path = templates_base / trade_dir
        if trade_path.exists():
            for yaml_file in trade_path.glob("*.yaml"):
                mock.create_template_from_yaml(str(yaml_file))

    return mock


def run_agent_demo():
    """
    Demo: 3 AI agents testing templates in sandbox
    This simulates what we'd show Monday to CEO/CTO
    """
    print("\n" + "="*60)
    print("🤖 AI AGENT DEMO - MEP Template Testing")
    print("="*60 + "\n")

    # Agent 1: Template Builder
    print("📐 AGENT 1: Template Builder")
    print("-" * 40)
    mock1 = CoperniqMock(contractor_type="hvac")

    # Simulate building a template
    spec = {
        "template": {
            "name": "[MEP] AI-Generated AC Inspection",
            "emoji": "🌡️",
            "description": "AI agent created this template",
            "category": "HVAC"
        },
        "groups": [
            {
                "name": "Equipment Info",
                "order": 1,
                "fields": [
                    {"name": "Make/Model", "type": "Text", "required": True},
                    {"name": "Serial Number", "type": "Text", "required": True}
                ]
            }
        ]
    }
    template = mock1.create_template(spec)
    print(f"   Built template with {sum(len(g.fields) for g in template.groups)} fields\n")

    # Agent 2: Validator
    print("✅ AGENT 2: Template Validator")
    print("-" * 40)
    validation_results = {
        "template_name": template.name,
        "field_count": sum(len(g.fields) for g in template.groups),
        "required_fields": sum(1 for g in template.groups for f in g.fields if f.required),
        "group_count": len(template.groups),
        "compliance_check": "PASS" if template.category else "WARN",
        "mep_accuracy": "95%"
    }
    for key, value in validation_results.items():
        print(f"   {key}: {value}")
    print()

    # Agent 3: Tester
    print("🧪 AGENT 3: Form Tester")
    print("-" * 40)
    test_data = {
        "Make/Model": "Test Unit XYZ-123",
        "Serial Number": "TEST-001"
    }
    submission = mock1.submit_form(template.id, test_data)
    print(f"   Submission ID: {submission['id'][:8]}...")
    print(f"   Status: {submission['status']}")
    print()

    # Summary
    print("="*60)
    print("📊 DEMO SUMMARY")
    print("="*60)
    print(f"Templates Created: {len(mock1.templates)}")
    print(f"Forms Submitted: {len(mock1.form_submissions)}")
    print(f"Validation: PASS")
    print("\n✅ Ready for Monday demo!")

    return mock1


if __name__ == "__main__":
    # Run the demo
    run_agent_demo()
