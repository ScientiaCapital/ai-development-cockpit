"""
Template Builder Agent
Creates MEP form templates from specifications using LangGraph + OpenRouter
"""

import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from .base import OpenRouterClient, MEP_TOOLS, CERTIFICATION_KB


@dataclass
class TemplateSpec:
    """Specification for building a template"""
    name: str
    category: str
    description: str
    groups: List[Dict]
    compliance: List[str]
    work_order_type: Optional[str] = None


class TemplateBuilderAgent:
    """
    AI Agent that builds MEP form templates

    Capabilities:
    - Reads YAML specifications
    - Generates Coperniq-compatible templates
    - Ensures MEP domain accuracy
    - Applies certification requirements
    """

    def __init__(self, coperniq_mock, model: str = "deepseek/deepseek-chat"):
        self.coperniq = coperniq_mock
        self.model = model
        self.client = OpenRouterClient()
        self.templates_built = []

    def build_from_yaml(self, yaml_path: str) -> Dict:
        """Build a template from YAML specification file"""
        with open(yaml_path, 'r') as f:
            spec = yaml.safe_load(f)

        return self.build_template(spec)

    def build_template(self, spec: Dict) -> Dict:
        """Build a template from specification dict"""
        # Extract template info
        template_info = spec.get('template', {})
        category = template_info.get('category', 'HVAC')

        # Get certification requirements for this trade
        trade_key = category.lower().replace(' ', '_')
        certifications = CERTIFICATION_KB.get(trade_key, {})

        # Build the template using Coperniq mock
        template = self.coperniq.create_template(spec)

        # Track what we built
        result = {
            "id": template.id,
            "name": template.name,
            "category": template.category,
            "groups": len(template.groups),
            "fields": sum(len(g.fields) for g in template.groups),
            "certifications_applicable": certifications.get('required', []),
            "compliance": certifications.get('compliance', []),
            "status": "created"
        }

        self.templates_built.append(result)
        return result

    def build_all_from_directory(self, directory: str) -> List[Dict]:
        """Build all templates from YAML files in a directory"""
        results = []
        templates_path = Path(directory)

        for yaml_file in templates_path.rglob("*.yaml"):
            try:
                result = self.build_from_yaml(str(yaml_file))
                result["source_file"] = str(yaml_file)
                results.append(result)
                print(f"✅ Built: {result['name']}")
            except Exception as e:
                results.append({
                    "source_file": str(yaml_file),
                    "status": "error",
                    "error": str(e)
                })
                print(f"❌ Error building {yaml_file}: {e}")

        return results

    def generate_template_from_prompt(self, prompt: str) -> Dict:
        """
        Use LLM to generate a template from natural language prompt

        Example: "Create an inspection checklist for residential AC systems"
        """
        system_prompt = """You are an MEP template expert. Generate a template specification
        in YAML format based on the user's request. Include:
        - Proper [MEP] prefix in name
        - Relevant field groups
        - Required fields for compliance
        - Appropriate field types (Text, Numeric, Single select, Multiple select, File)

        Output ONLY valid YAML, no explanation."""

        # Use OpenRouter for generation
        response = self.client.simple_chat(
            prompt=prompt,
            model=self.model,
            system=system_prompt
        )

        # Parse the YAML response
        try:
            spec = yaml.safe_load(response)
            return self.build_template(spec)
        except yaml.YAMLError as e:
            return {"status": "error", "error": f"Invalid YAML generated: {e}"}

    def get_build_summary(self) -> Dict:
        """Get summary of all templates built"""
        return {
            "total_templates": len(self.templates_built),
            "by_category": self._count_by_category(),
            "total_fields": sum(t.get('fields', 0) for t in self.templates_built),
            "templates": self.templates_built
        }

    def _count_by_category(self) -> Dict[str, int]:
        """Count templates by category"""
        counts = {}
        for t in self.templates_built:
            cat = t.get('category', 'Unknown')
            counts[cat] = counts.get(cat, 0) + 1
        return counts

    def __repr__(self):
        return f"TemplateBuilderAgent(built={len(self.templates_built)}, model={self.model})"
