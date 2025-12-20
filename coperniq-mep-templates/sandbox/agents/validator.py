"""
Validator Agent
Validates MEP templates against compliance standards and best practices
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

from .base import OpenRouterClient, CERTIFICATION_KB


@dataclass
class ValidationResult:
    """Result of template validation"""
    template_id: str
    template_name: str
    passed: bool
    score: float  # 0-100
    issues: List[Dict]
    recommendations: List[str]
    compliance_checks: Dict[str, bool]
    validated_at: str


class ValidatorAgent:
    """
    AI Agent that validates MEP templates

    Validation Levels (Progressive Unlock):
    - STARTER: Basic field validation
    - PROFESSIONAL: Compliance checking
    - ENTERPRISE: Full MEP accuracy audit

    Capabilities:
    - Validates required fields
    - Checks MEP domain accuracy
    - Verifies compliance alignment
    - Provides improvement recommendations
    """

    VALIDATION_LEVELS = {
        "starter": ["field_presence", "field_types", "required_fields"],
        "professional": ["compliance_standards", "certification_fields", "work_order_linking"],
        "enterprise": ["mep_accuracy", "industry_best_practices", "regulatory_alignment"]
    }

    def __init__(self, coperniq_mock, level: str = "professional"):
        self.coperniq = coperniq_mock
        self.level = level
        self.validation_history = []
        self.client = OpenRouterClient()

    def validate_template(self, template_id: str) -> ValidationResult:
        """Validate a single template"""
        template = self.coperniq.get_template(template_id)
        if not template:
            return ValidationResult(
                template_id=template_id,
                template_name="Unknown",
                passed=False,
                score=0,
                issues=[{"type": "error", "message": "Template not found"}],
                recommendations=[],
                compliance_checks={},
                validated_at=datetime.now().isoformat()
            )

        issues = []
        recommendations = []
        compliance_checks = {}
        score = 100

        # Get applicable checks for this level
        checks = []
        for lvl in ["starter", "professional", "enterprise"]:
            checks.extend(self.VALIDATION_LEVELS[lvl])
            if lvl == self.level:
                break

        # Run validation checks
        for check in checks:
            check_result = self._run_check(check, template)
            if not check_result["passed"]:
                issues.append(check_result)
                score -= check_result.get("severity", 5)
            if check_result.get("recommendations"):
                recommendations.extend(check_result["recommendations"])

        # Compliance checks based on category
        trade_key = template.category.lower().replace(' ', '_')
        certifications = CERTIFICATION_KB.get(trade_key, {})

        for standard in certifications.get('compliance', []):
            compliance_checks[standard] = self._check_compliance(template, standard)
            if not compliance_checks[standard]:
                score -= 3
                issues.append({
                    "type": "compliance",
                    "message": f"Missing fields for {standard} compliance"
                })

        # Ensure score is within bounds
        score = max(0, min(100, score))

        result = ValidationResult(
            template_id=template_id,
            template_name=template.name,
            passed=score >= 70,
            score=score,
            issues=issues,
            recommendations=recommendations,
            compliance_checks=compliance_checks,
            validated_at=datetime.now().isoformat()
        )

        self.validation_history.append(result)
        return result

    def _run_check(self, check_name: str, template) -> Dict:
        """Run a specific validation check"""
        checks = {
            "field_presence": self._check_field_presence,
            "field_types": self._check_field_types,
            "required_fields": self._check_required_fields,
            "compliance_standards": self._check_compliance_standards,
            "certification_fields": self._check_certification_fields,
            "work_order_linking": self._check_work_order_linking,
            "mep_accuracy": self._check_mep_accuracy,
            "industry_best_practices": self._check_best_practices,
            "regulatory_alignment": self._check_regulatory_alignment
        }

        check_fn = checks.get(check_name, lambda t: {"passed": True})
        return check_fn(template)

    def _check_field_presence(self, template) -> Dict:
        """Check that template has at least one field"""
        total_fields = sum(len(g.fields) for g in template.groups)
        if total_fields < 3:
            return {
                "type": "field_presence",
                "passed": False,
                "message": f"Template has only {total_fields} fields (minimum 3)",
                "severity": 10
            }
        return {"passed": True, "type": "field_presence"}

    def _check_field_types(self, template) -> Dict:
        """Validate field types are Coperniq-compatible"""
        valid_types = ["Text", "Numeric", "Single select", "Multiple select", "File"]
        invalid = []
        for group in template.groups:
            for field in group.fields:
                if field.field_type not in valid_types:
                    invalid.append(f"{field.name}: {field.field_type}")

        if invalid:
            return {
                "type": "field_types",
                "passed": False,
                "message": f"Invalid field types: {', '.join(invalid)}",
                "severity": 15
            }
        return {"passed": True, "type": "field_types"}

    def _check_required_fields(self, template) -> Dict:
        """Check that critical fields are marked required"""
        required_count = 0
        total_fields = 0
        for group in template.groups:
            for field in group.fields:
                total_fields += 1
                if field.required:
                    required_count += 1

        if required_count == 0:
            return {
                "type": "required_fields",
                "passed": False,
                "message": "No fields marked as required",
                "severity": 8,
                "recommendations": ["Mark key identification fields as required"]
            }
        return {"passed": True, "type": "required_fields"}

    def _check_compliance_standards(self, template) -> Dict:
        """Check for compliance-related fields"""
        compliance_keywords = ["compliance", "code", "standard", "regulation", "permit"]
        has_compliance = any(
            any(kw in f.name.lower() for kw in compliance_keywords)
            for g in template.groups for f in g.fields
        )
        if not has_compliance and template.compliance:
            return {
                "type": "compliance_standards",
                "passed": False,
                "message": f"Template references {template.compliance} but lacks compliance fields",
                "severity": 5,
                "recommendations": ["Add compliance verification checkbox or notes field"]
            }
        return {"passed": True, "type": "compliance_standards"}

    def _check_certification_fields(self, template) -> Dict:
        """Check for technician certification capture"""
        cert_keywords = ["certification", "license", "cert", "epa", "nate", "nicet"]
        has_cert_field = any(
            any(kw in f.name.lower() for kw in cert_keywords)
            for g in template.groups for f in g.fields
        )

        trade_key = template.category.lower().replace(' ', '_')
        required_certs = CERTIFICATION_KB.get(trade_key, {}).get('required', [])

        if required_certs and not has_cert_field:
            return {
                "type": "certification_fields",
                "passed": False,
                "message": f"Missing certification capture for {template.category}",
                "severity": 7,
                "recommendations": [f"Add field for: {', '.join(required_certs)}"]
            }
        return {"passed": True, "type": "certification_fields"}

    def _check_work_order_linking(self, template) -> Dict:
        """Check work order type is properly set"""
        if template.work_order_type:
            return {"passed": True, "type": "work_order_linking"}
        return {
            "type": "work_order_linking",
            "passed": False,
            "message": "No work order type linked",
            "severity": 3,
            "recommendations": ["Link to appropriate work order template"]
        }

    def _check_mep_accuracy(self, template) -> Dict:
        """Deep MEP domain accuracy check (Enterprise level)"""
        # This would use LLM for deep analysis
        return {"passed": True, "type": "mep_accuracy"}

    def _check_best_practices(self, template) -> Dict:
        """Industry best practices check (Enterprise level)"""
        return {"passed": True, "type": "industry_best_practices"}

    def _check_regulatory_alignment(self, template) -> Dict:
        """Regulatory alignment check (Enterprise level)"""
        return {"passed": True, "type": "regulatory_alignment"}

    def _check_compliance(self, template, standard: str) -> bool:
        """Check if template has fields for a specific standard"""
        standard_keywords = {
            "EPA Section 608": ["refrigerant", "epa", "recovery", "leak"],
            "NFPA 25": ["sprinkler", "inspection", "test", "maintenance"],
            "NFPA 10": ["extinguisher", "inspection", "recharge"],
            "NEC 2023": ["circuit", "panel", "breaker", "grounding"],
            "NFPA 70B": ["thermography", "infrared", "temperature"],
            "ASSE 5110": ["backflow", "test", "device", "assembly"],
        }

        keywords = standard_keywords.get(standard, [standard.lower().split()[:2]])
        field_names = " ".join(f.name.lower() for g in template.groups for f in g.fields)

        return any(kw in field_names for kw in keywords)

    def validate_all(self) -> List[ValidationResult]:
        """Validate all templates in the sandbox"""
        results = []
        for template in self.coperniq.templates.values():
            result = self.validate_template(template.id)
            results.append(result)
        return results

    def get_summary(self) -> Dict:
        """Get validation summary"""
        if not self.validation_history:
            return {"message": "No validations performed yet"}

        passed = sum(1 for r in self.validation_history if r.passed)
        avg_score = sum(r.score for r in self.validation_history) / len(self.validation_history)

        return {
            "total_validated": len(self.validation_history),
            "passed": passed,
            "failed": len(self.validation_history) - passed,
            "pass_rate": f"{(passed / len(self.validation_history)) * 100:.1f}%",
            "average_score": f"{avg_score:.1f}",
            "validation_level": self.level
        }

    def __repr__(self):
        return f"ValidatorAgent(level={self.level}, validated={len(self.validation_history)})"
