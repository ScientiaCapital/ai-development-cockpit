"""
Coperniq Agent Orchestrator
LangGraph-powered coordination of MEP template agents

This is the brain of the autonomous demo system.
"""

import json
import yaml
from typing import Dict, List, Any, Optional, TypedDict
from datetime import datetime
from dataclasses import dataclass, field
from pathlib import Path

# Import our agents
from .template_builder import TemplateBuilderAgent
from .validator import ValidatorAgent
from .tester import TesterAgent
from .base import OpenRouterClient, CERTIFICATION_KB

# Import the mock environment
import sys
sys.path.append(str(Path(__file__).parent.parent))
from coperniq_mock import CoperniqMock


class AgentState(TypedDict):
    """State shared between agents in the graph"""
    contractor_type: str
    vertical: Optional[str]  # GTM vertical (solar_epc, hvac_mep, om_service, multi_trade)
    vertical_config: Optional[Dict]  # Loaded vertical configuration
    templates_built: List[Dict]
    validation_results: List[Dict]
    test_results: List[Dict]
    csv_imports: List[Dict]
    current_step: str
    errors: List[str]
    messages: List[str]
    cost_tracker: Dict


@dataclass
class CoperniqAgentOrchestrator:
    """
    Orchestrates multiple AI agents for MEP template management

    Workflow:
    1. Initialize contractor-specific sandbox
    2. Build templates (TemplateBuilderAgent)
    3. Validate templates (ValidatorAgent)
    4. Test templates (TesterAgent)
    5. Report results

    Demo Capabilities:
    - No-hands autonomous execution
    - CSV import from competitor platforms
    - Real-time progress updates
    - Cost tracking
    """

    contractor_type: str = "hvac"
    level: str = "professional"  # starter, professional, enterprise

    # Agents (initialized lazily)
    mock: Optional[CoperniqMock] = field(default=None, repr=False)
    builder: Optional[TemplateBuilderAgent] = field(default=None, repr=False)
    validator: Optional[ValidatorAgent] = field(default=None, repr=False)
    tester: Optional[TesterAgent] = field(default=None, repr=False)

    # State
    state: AgentState = field(default_factory=lambda: {
        "contractor_type": "",
        "vertical": None,
        "vertical_config": None,
        "templates_built": [],
        "validation_results": [],
        "test_results": [],
        "csv_imports": [],
        "current_step": "initialized",
        "errors": [],
        "messages": [],
        "cost_tracker": {"total_tokens": 0, "total_cost": 0.0}
    })

    def __post_init__(self):
        """Initialize the sandbox and agents"""
        self.state["contractor_type"] = self.contractor_type
        self._initialize_agents()

    def _initialize_agents(self):
        """Create the agent team"""
        print(f"\n{'='*60}")
        print(f"🚀 INITIALIZING COPERNIQ AGENT ORCHESTRATOR")
        print(f"{'='*60}\n")

        # Create the mock Coperniq environment
        self.mock = CoperniqMock(contractor_type=self.contractor_type)

        # Initialize agents
        self.builder = TemplateBuilderAgent(self.mock)
        self.validator = ValidatorAgent(self.mock, level=self.level)
        self.tester = TesterAgent(self.mock, level=self.level)

        self.state["current_step"] = "agents_ready"
        self._log(f"Agents initialized for {self.contractor_type} contractor")

    def _log(self, message: str):
        """Add message to state and print"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        full_message = f"[{timestamp}] {message}"
        self.state["messages"].append(full_message)
        print(full_message)

    # =========================================================================
    # CORE WORKFLOW
    # =========================================================================

    def run_full_demo(self, templates_path: Optional[str] = None) -> Dict:
        """
        Run the complete autonomous demo

        This is the no-hands demo for Monday.
        """
        start_time = datetime.now()

        print(f"\n{'='*60}")
        print(f"🤖 AUTONOMOUS DEMO - {self.contractor_type.upper()} CONTRACTOR")
        print(f"{'='*60}\n")

        try:
            # Step 1: Build Templates
            self._log("📐 PHASE 1: Building Templates...")
            self.state["current_step"] = "building"

            if templates_path:
                build_results = self.builder.build_all_from_directory(templates_path)
            else:
                # Use default templates path
                default_path = Path(__file__).parent.parent.parent / "templates"
                if default_path.exists():
                    build_results = self.builder.build_all_from_directory(str(default_path))
                else:
                    build_results = []
                    self._log("⚠️ No templates directory found")

            self.state["templates_built"] = build_results
            self._log(f"Built {len(build_results)} templates")

            # Step 2: Validate Templates
            self._log("\n✅ PHASE 2: Validating Templates...")
            self.state["current_step"] = "validating"

            validation_results = self.validator.validate_all()
            self.state["validation_results"] = [
                {
                    "template_id": r.template_id,
                    "template_name": r.template_name,
                    "passed": r.passed,
                    "score": r.score,
                    "issues": r.issues
                }
                for r in validation_results
            ]
            self._log(f"Validated {len(validation_results)} templates")

            # Step 3: Test Templates
            self._log("\n🧪 PHASE 3: Testing Templates...")
            self.state["current_step"] = "testing"

            test_results = self.tester.test_all_templates()
            self.state["test_results"] = [
                {
                    "template_id": r.template_id,
                    "template_name": r.template_name,
                    "passed": r.passed,
                    "duration_ms": r.duration_ms
                }
                for r in test_results
            ]
            self._log(f"Tested {len(test_results)} templates")

            # Step 4: Generate Report
            self._log("\n📊 PHASE 4: Generating Report...")
            self.state["current_step"] = "complete"

            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()

            report = self._generate_report(duration)
            return report

        except Exception as e:
            self.state["errors"].append(str(e))
            self._log(f"❌ Error: {e}")
            raise

    def _generate_report(self, duration: float) -> Dict:
        """Generate final demo report"""
        build_summary = self.builder.get_build_summary()
        validation_summary = self.validator.get_summary()
        test_summary = self.tester.get_summary()

        report = {
            "demo_info": {
                "contractor_type": self.contractor_type,
                "level": self.level,
                "duration_seconds": round(duration, 2),
                "completed_at": datetime.now().isoformat()
            },
            "templates": build_summary,
            "validation": validation_summary,
            "testing": test_summary,
            "csv_imports": len(self.state["csv_imports"]),
            "errors": self.state["errors"]
        }

        # Print summary
        print(f"\n{'='*60}")
        print(f"📊 DEMO COMPLETE - SUMMARY")
        print(f"{'='*60}")
        print(f"Duration: {duration:.1f} seconds")
        print(f"Templates Built: {build_summary.get('total_templates', 0)}")
        print(f"Validation Pass Rate: {validation_summary.get('pass_rate', 'N/A')}")
        print(f"Test Pass Rate: {test_summary.get('pass_rate', 'N/A')}")
        print(f"CSV Imports: {len(self.state['csv_imports'])}")
        if self.state["errors"]:
            print(f"Errors: {len(self.state['errors'])}")
        print(f"{'='*60}\n")

        return report

    # =========================================================================
    # CSV IMPORT (Competitor Migration)
    # =========================================================================

    def import_csv(self, csv_path: str, source_platform: str = "unknown") -> Dict:
        """
        Import data from competitor platform CSV export

        Supported platforms:
        - ServiceTitan
        - Procore
        - BuildOps
        - Buildertrend
        - Monday.com
        - Salesforce
        - Pipedrive
        - HubSpot
        """
        import csv as csv_module

        self._log(f"📥 Importing CSV from {source_platform}...")

        # Platform-specific column mappings
        PLATFORM_MAPPINGS = {
            "servicetitan": {
                "customer_name": ["Customer Name", "CustomerName", "Name"],
                "address": ["Address", "Service Address", "Location"],
                "equipment_type": ["Equipment", "Unit Type", "System Type"],
                "serial_number": ["Serial", "Serial Number", "SerialNo"],
                "last_service": ["Last Service", "LastServiceDate", "Service Date"]
            },
            "procore": {
                "project_name": ["Project Name", "Project", "Name"],
                "customer_name": ["Client", "Owner", "Customer"],
                "address": ["Location", "Site Address", "Address"],
                "status": ["Status", "Project Status"]
            },
            "buildops": {
                "customer_name": ["Customer", "Account Name", "Name"],
                "job_type": ["Job Type", "Service Type"],
                "equipment": ["Equipment", "Asset"],
                "technician": ["Technician", "Assigned To"]
            },
            "buildertrend": {
                "project_name": ["Project Name", "Job Name"],
                "customer_name": ["Client", "Customer", "Owner"],
                "stage": ["Stage", "Phase", "Status"]
            },
            "monday": {
                "item_name": ["Name", "Item", "Task"],
                "status": ["Status"],
                "owner": ["Owner", "Person", "Assigned"]
            },
            "salesforce": {
                "account_name": ["Account Name", "Account"],
                "opportunity": ["Opportunity Name", "Opportunity"],
                "stage": ["Stage", "Opportunity Stage"],
                "amount": ["Amount", "Value"]
            },
            "pipedrive": {
                "deal_name": ["Deal", "Deal Title", "Name"],
                "person": ["Person", "Contact"],
                "org": ["Organization", "Company"],
                "stage": ["Stage", "Pipeline Stage"]
            },
            "hubspot": {
                "company": ["Company", "Company Name"],
                "contact": ["Contact", "Contact Name"],
                "deal": ["Deal", "Deal Name"],
                "stage": ["Deal Stage", "Stage"]
            }
        }

        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv_module.DictReader(f)
                rows = list(reader)

            if not rows:
                return {"status": "error", "message": "Empty CSV file"}

            # Detect platform if not specified
            headers = rows[0].keys() if rows else []
            mapping = PLATFORM_MAPPINGS.get(source_platform.lower(), {})

            # Map the data
            imported_records = []
            for row in rows:
                mapped_row = {"_source": source_platform, "_raw": dict(row)}

                for target_field, source_options in mapping.items():
                    for source_field in source_options:
                        if source_field in row:
                            mapped_row[target_field] = row[source_field]
                            break

                imported_records.append(mapped_row)

            import_result = {
                "status": "success",
                "source_platform": source_platform,
                "records_imported": len(imported_records),
                "columns_detected": list(headers),
                "sample_record": imported_records[0] if imported_records else None
            }

            self.state["csv_imports"].append(import_result)
            self._log(f"✅ Imported {len(imported_records)} records from {source_platform}")

            return import_result

        except Exception as e:
            error_result = {
                "status": "error",
                "source_platform": source_platform,
                "error": str(e)
            }
            self.state["csv_imports"].append(error_result)
            self._log(f"❌ CSV import failed: {e}")
            return error_result

    # =========================================================================
    # INTERACTIVE COMMANDS
    # =========================================================================

    def ask(self, question: str) -> str:
        """
        Ask a question about the MEP domain or current state

        Example: "What certifications does an HVAC contractor need?"
        """
        client = OpenRouterClient()

        # Build context from current state
        context = f"""
        Contractor Type: {self.contractor_type}
        Templates Built: {len(self.state['templates_built'])}
        Certifications for this trade: {json.dumps(CERTIFICATION_KB.get(self.contractor_type, {}), indent=2)}
        """

        system_prompt = f"""You are an MEP domain expert assistant for Coperniq.
        Current context:
        {context}

        Answer questions about MEP trades, certifications, templates, and best practices.
        Be specific and actionable."""

        response = client.simple_chat(
            prompt=question,
            system=system_prompt
        )

        return response

    def switch_contractor(self, new_type: str):
        """Switch to a different contractor type"""
        valid_types = ["hvac", "plumbing", "electrical", "fire_protection",
                       "low_voltage", "roofing", "general_contractor",
                       "resimercial", "commercial_industrial"]

        if new_type not in valid_types:
            raise ValueError(f"Invalid contractor type. Choose from: {valid_types}")

        self.contractor_type = new_type
        self.state = {
            "contractor_type": new_type,
            "templates_built": [],
            "validation_results": [],
            "test_results": [],
            "csv_imports": [],
            "current_step": "switching",
            "errors": [],
            "messages": [],
            "cost_tracker": {"total_tokens": 0, "total_cost": 0.0}
        }
        self._initialize_agents()
        self._log(f"Switched to {new_type} contractor")

    def get_state(self) -> Dict:
        """Get current orchestrator state"""
        return dict(self.state)

    # =========================================================================
    # WIZARD CONFIGURATION SYSTEM
    # =========================================================================

    @classmethod
    def from_wizard(cls, wizard_path: str) -> "CoperniqAgentOrchestrator":
        """
        Create orchestrator from a contractor setup wizard configuration

        Args:
            wizard_path: Path to contractor_setup_wizard.yaml

        Returns:
            Configured CoperniqAgentOrchestrator instance
        """
        with open(wizard_path, 'r') as f:
            wizard = yaml.safe_load(f)

        # Determine primary contractor type from enabled trades
        trades = wizard.get('trades', {})
        enabled_trades = [k for k, v in trades.items() if v.get('enabled', False)]

        if not enabled_trades:
            contractor_type = "hvac"  # Default
        else:
            contractor_type = enabled_trades[0]  # Primary trade

        # Create instance
        instance = cls(contractor_type=contractor_type, level="professional")
        instance._wizard_config = wizard
        instance._enabled_trades = enabled_trades

        return instance

    def get_wizard_templates(self) -> List[Dict]:
        """
        Get list of templates based on wizard configuration

        Returns:
            List of template definitions to build
        """
        if not hasattr(self, '_wizard_config'):
            return []

        # Load template registry
        registry_path = Path(__file__).parent.parent.parent / "config" / "template_registry.json"
        if not registry_path.exists():
            self._log("❌ Template registry not found")
            return []

        with open(registry_path, 'r') as f:
            registry = json.load(f)

        wizard = self._wizard_config

        # Get enabled items
        enabled_trades = [k for k, v in wizard.get('trades', {}).items() if v.get('enabled', False)]
        enabled_segments = [k for k, v in wizard.get('market_segments', {}).items() if v.get('enabled', False)]
        enabled_phases = [k for k, v in wizard.get('business_phases', {}).items() if v.get('enabled', False)]

        # Include optional templates?
        include_optional = wizard.get('output', {}).get('include_optional', False)

        templates_to_build = []

        # Filter templates based on wizard selections
        for trade_key, trade_data in registry.get('trades', {}).items():
            if trade_key not in enabled_trades:
                continue

            for phase_key, phase_templates in trade_data.get('templates', {}).items():
                if phase_key not in enabled_phases:
                    continue

                for template_key, template_info in phase_templates.items():
                    # Check if segments overlap
                    template_segments = template_info.get('segments', [])
                    if not any(seg in enabled_segments for seg in template_segments):
                        continue

                    # Check if required or optional
                    is_required = template_info.get('required', False)
                    if not is_required and not include_optional:
                        continue

                    templates_to_build.append({
                        "trade": trade_key,
                        "phase": phase_key,
                        "template_key": template_key,
                        "file": template_info.get('file'),
                        "name": template_info.get('name'),
                        "description": template_info.get('description'),
                        "fields_count": template_info.get('fields_count', 0),
                        "compliance": template_info.get('compliance', [])
                    })

        self._log(f"📋 Wizard selected {len(templates_to_build)} templates based on configuration")
        return templates_to_build

    def apply_preset(self, preset_name: str) -> Dict:
        """
        Apply a quick-setup preset from the wizard

        Args:
            preset_name: Name of preset (e.g., 'hvac_residential', 'solar_commercial')

        Returns:
            Updated wizard configuration
        """
        if not hasattr(self, '_wizard_config'):
            # Load default wizard
            wizard_path = Path(__file__).parent.parent.parent / "config" / "contractor_setup_wizard.yaml"
            if wizard_path.exists():
                with open(wizard_path, 'r') as f:
                    self._wizard_config = yaml.safe_load(f)
            else:
                raise FileNotFoundError("Wizard configuration not found")

        preset = self._wizard_config.get('presets', {}).get(preset_name)
        if not preset:
            available = list(self._wizard_config.get('presets', {}).keys())
            raise ValueError(f"Unknown preset: {preset_name}. Available: {available}")

        # Apply preset selections
        auto_select = preset.get('auto_select', {})

        # Enable trades
        for trade in auto_select.get('trades', []):
            if trade in self._wizard_config.get('trades', {}):
                self._wizard_config['trades'][trade]['enabled'] = True

        # Enable market segments
        for segment in auto_select.get('segments', []):
            if segment in self._wizard_config.get('market_segments', {}):
                self._wizard_config['market_segments'][segment]['enabled'] = True

        # Enable business phases
        for phase in auto_select.get('phases', []):
            if phase in self._wizard_config.get('business_phases', {}):
                self._wizard_config['business_phases'][phase]['enabled'] = True

        self._enabled_trades = auto_select.get('trades', [])

        self._log(f"✅ Applied preset: {preset.get('name', preset_name)}")
        self._log(f"   Trades: {auto_select.get('trades', [])}")
        self._log(f"   Segments: {auto_select.get('segments', [])}")
        self._log(f"   Phases: {auto_select.get('phases', [])}")

        return self._wizard_config

    def generate_from_wizard(self) -> Dict:
        """
        Generate all templates based on wizard configuration

        Returns:
            Build report with all generated templates
        """
        templates = self.get_wizard_templates()

        if not templates:
            return {"status": "error", "message": "No templates selected. Configure wizard first."}

        self._log(f"\n🚀 GENERATING {len(templates)} TEMPLATES FROM WIZARD")
        self._log("="*60)

        results = []
        for template in templates:
            file_path = Path(__file__).parent.parent.parent / template['file']

            if file_path.exists():
                result = self.builder.build_from_yaml(str(file_path))
                results.append({
                    "template": template['name'],
                    "status": "built" if result else "failed",
                    "file": template['file']
                })
                self._log(f"✅ {template['name']}")
            else:
                results.append({
                    "template": template['name'],
                    "status": "missing",
                    "file": template['file']
                })
                self._log(f"⚠️ {template['name']} (file not found)")

        # Summary
        built = sum(1 for r in results if r['status'] == 'built')
        missing = sum(1 for r in results if r['status'] == 'missing')

        report = {
            "status": "complete",
            "total": len(results),
            "built": built,
            "missing": missing,
            "results": results
        }

        self._log(f"\n📊 WIZARD BUILD COMPLETE")
        self._log(f"   Built: {built}/{len(results)}")
        self._log(f"   Missing: {missing}")

        return report

    # =========================================================================
    # GTM VERTICAL CONFIGURATION (E2B Sandbox Integration)
    # =========================================================================

    AVAILABLE_VERTICALS = ["solar_epc", "hvac_mep", "om_service", "multi_trade"]

    def load_vertical(self, vertical_name: str) -> Dict:
        """
        Load a GTM vertical configuration for E2B sandbox onboarding

        Args:
            vertical_name: One of solar_epc, hvac_mep, om_service, multi_trade

        Returns:
            Loaded vertical configuration with schema, phases, agents, csv_requirements
        """
        if vertical_name not in self.AVAILABLE_VERTICALS:
            raise ValueError(
                f"Unknown vertical: {vertical_name}. "
                f"Available: {self.AVAILABLE_VERTICALS}"
            )

        vertical_path = (
            Path(__file__).parent.parent.parent /
            "config" / "gtm_verticals" / f"{vertical_name}.json"
        )

        if not vertical_path.exists():
            raise FileNotFoundError(f"Vertical config not found: {vertical_path}")

        with open(vertical_path, 'r') as f:
            config = json.load(f)

        # Store in state
        self.state["vertical"] = vertical_name
        self.state["vertical_config"] = config

        # Update contractor type based on vertical
        vertical_to_contractor = {
            "solar_epc": "solar",
            "hvac_mep": "hvac",
            "om_service": "hvac",  # O&M can be any trade
            "multi_trade": "general_contractor"
        }
        self.contractor_type = vertical_to_contractor.get(vertical_name, "hvac")
        self.state["contractor_type"] = self.contractor_type

        self._log(f"📦 Loaded GTM Vertical: {config.get('display_name', vertical_name)}")
        self._log(f"   Workflow: {config.get('workflow_type', 'unknown')}")
        self._log(f"   Tables: {', '.join(config.get('schema', {}).get('tables', []))}")
        self._log(f"   Agents: {', '.join(config.get('agents', {}).keys())}")

        return config

    def get_vertical_schema(self) -> Dict:
        """Get the Coperniq schema for the loaded vertical"""
        if not self.state.get("vertical_config"):
            raise ValueError("No vertical loaded. Call load_vertical() first.")
        return self.state["vertical_config"].get("schema", {})

    def get_vertical_csv_requirements(self) -> Dict:
        """Get CSV import requirements with exact Coperniq field names"""
        if not self.state.get("vertical_config"):
            raise ValueError("No vertical loaded. Call load_vertical() first.")
        return self.state["vertical_config"].get("csv_requirements", {})

    def get_vertical_agents(self) -> Dict[str, str]:
        """Get available agents for the loaded vertical"""
        if not self.state.get("vertical_config"):
            raise ValueError("No vertical loaded. Call load_vertical() first.")
        return self.state["vertical_config"].get("agents", {})

    def get_sample_queries(self) -> List[str]:
        """Get sample queries for the loaded vertical"""
        if not self.state.get("vertical_config"):
            raise ValueError("No vertical loaded. Call load_vertical() first.")
        return self.state["vertical_config"].get("sample_queries", [])

    def import_coperniq_csv(self, csv_path: str, coperniq_type: str) -> Dict:
        """
        Import CSV using exact Coperniq type schema

        Args:
            csv_path: Path to CSV file
            coperniq_type: Coperniq GraphQL type (Contact, Site, Asset, Task, etc.)

        Returns:
            Import result with validation status
        """
        import csv as csv_module

        if not self.state.get("vertical_config"):
            raise ValueError("No vertical loaded. Call load_vertical() first.")

        csv_requirements = self.get_vertical_csv_requirements()
        expected_file = f"{coperniq_type}.csv"

        if expected_file not in csv_requirements:
            available = list(csv_requirements.keys())
            raise ValueError(
                f"Unknown Coperniq type: {coperniq_type}. "
                f"Available for this vertical: {available}"
            )

        schema = csv_requirements[expected_file]
        required_fields = schema.get("required", [])
        expected_columns = schema.get("columns", {})

        self._log(f"📥 Importing {coperniq_type} from {csv_path}...")

        try:
            with open(csv_path, 'r', encoding='utf-8-sig') as f:
                reader = csv_module.DictReader(f)
                rows = list(reader)

            if not rows:
                return {"status": "error", "message": "Empty CSV file"}

            headers = list(rows[0].keys())

            # Validate required fields
            missing_required = [
                field for field in required_fields
                if field not in headers
            ]

            if missing_required:
                self._log(f"⚠️ Missing required fields: {missing_required}")

            # Map and validate data
            validated_records = []
            validation_errors = []

            for i, row in enumerate(rows):
                record = {"_coperniq_type": coperniq_type, "_row": i + 1}

                for field, field_type in expected_columns.items():
                    if field in row:
                        value = row[field]

                        # Type validation
                        if field_type == "int" and value:
                            try:
                                record[field] = int(value)
                            except ValueError:
                                validation_errors.append(
                                    f"Row {i+1}: {field} should be int, got '{value}'"
                                )
                                record[field] = None
                        elif field_type == "decimal" and value:
                            try:
                                record[field] = float(value)
                            except ValueError:
                                validation_errors.append(
                                    f"Row {i+1}: {field} should be decimal, got '{value}'"
                                )
                                record[field] = None
                        elif field_type == "boolean" and value:
                            record[field] = value.lower() in ("true", "1", "yes")
                        elif field_type == "string[]" and value:
                            # Handle array fields (comma-separated)
                            record[field] = [v.strip() for v in value.split(",")]
                        else:
                            record[field] = value if value else None

                validated_records.append(record)

            import_result = {
                "status": "success",
                "coperniq_type": coperniq_type,
                "records_imported": len(validated_records),
                "columns_detected": headers,
                "columns_expected": list(expected_columns.keys()),
                "missing_required": missing_required,
                "validation_errors": validation_errors[:10],  # First 10 errors
                "total_validation_errors": len(validation_errors),
                "sample_record": validated_records[0] if validated_records else None
            }

            self.state["csv_imports"].append(import_result)

            if validation_errors:
                self._log(f"⚠️ Imported {len(validated_records)} records with {len(validation_errors)} warnings")
            else:
                self._log(f"✅ Imported {len(validated_records)} {coperniq_type} records")

            return import_result

        except Exception as e:
            error_result = {
                "status": "error",
                "coperniq_type": coperniq_type,
                "error": str(e)
            }
            self.state["csv_imports"].append(error_result)
            self._log(f"❌ CSV import failed: {e}")
            return error_result

    def print_vertical_info(self):
        """Print information about the loaded vertical"""
        if not self.state.get("vertical_config"):
            print("❌ No vertical loaded. Call load_vertical() first.")
            return

        config = self.state["vertical_config"]

        print("\n" + "="*60)
        print(f"📦 GTM VERTICAL: {config.get('display_name', 'Unknown')}")
        print("="*60)

        print(f"\n📝 Description: {config.get('description', 'N/A')}")
        print(f"🔄 Workflow Type: {config.get('workflow_type', 'N/A')}")

        # Phases
        phases = config.get("phases")
        if phases:
            if isinstance(phases, list):
                print(f"\n📊 Phases: {' → '.join(phases)}")
            elif isinstance(phases, dict):
                for phase_type, phase_list in phases.items():
                    if phase_list:
                        print(f"\n📊 {phase_type.title()} Phases: {' → '.join(phase_list)}")

        # Schema
        schema = config.get("schema", {})
        print(f"\n🗄️ Coperniq Tables: {', '.join(schema.get('tables', []))}")
        print(f"📊 Views: {', '.join(schema.get('views', []))}")

        # Agents
        agents = config.get("agents", {})
        if agents:
            print("\n🤖 Available Agents:")
            for agent_name, description in agents.items():
                print(f"   • {agent_name}: {description}")

        # Sample Queries
        queries = config.get("sample_queries", [])
        if queries:
            print("\n💬 Sample Queries:")
            for query in queries[:4]:
                print(f"   • \"{query}\"")

        # CSV Requirements
        csv_reqs = config.get("csv_requirements", {})
        if csv_reqs:
            print("\n📥 CSV Import Files:")
            for filename, schema in csv_reqs.items():
                coperniq_type = schema.get("coperniq_type", "Unknown")
                required = schema.get("required", [])
                print(f"   • {filename} → {coperniq_type}")
                print(f"     Required: {', '.join(required)}")

        print("\n" + "="*60 + "\n")

    @classmethod
    def from_vertical(cls, vertical_name: str) -> "CoperniqAgentOrchestrator":
        """
        Create orchestrator configured for a specific GTM vertical

        Args:
            vertical_name: One of solar_epc, hvac_mep, om_service, multi_trade

        Returns:
            Configured CoperniqAgentOrchestrator instance
        """
        instance = cls(contractor_type="hvac", level="professional")
        instance.load_vertical(vertical_name)
        return instance

    # =========================================================================
    # WIZARD CONFIGURATION (Legacy - still supported)
    # =========================================================================

    def print_wizard_checklist(self):
        """Print a user-friendly checklist of wizard options"""
        if not hasattr(self, '_wizard_config'):
            wizard_path = Path(__file__).parent.parent.parent / "config" / "contractor_setup_wizard.yaml"
            if wizard_path.exists():
                with open(wizard_path, 'r') as f:
                    self._wizard_config = yaml.safe_load(f)

        print("\n" + "="*60)
        print("📋 CONTRACTOR SETUP WIZARD - CHECKLIST")
        print("="*60)

        # Trades
        print("\n🔧 TRADES")
        for trade, config in self._wizard_config.get('trades', {}).items():
            status = "☑" if config.get('enabled') else "☐"
            print(f"   {status} {trade.upper()}")

        # Market Segments
        print("\n🏠 MARKET SEGMENTS")
        for segment, config in self._wizard_config.get('market_segments', {}).items():
            status = "☑" if config.get('enabled') else "☐"
            print(f"   {status} {segment.replace('_', ' ').title()}")

        # Business Phases
        print("\n📂 BUSINESS PHASES")
        for phase, config in self._wizard_config.get('business_phases', {}).items():
            status = "☑" if config.get('enabled') else "☐"
            print(f"   {status} {phase.replace('_', ' ').title()}")

        # Presets
        print("\n⚡ QUICK PRESETS")
        for preset_key, preset in self._wizard_config.get('presets', {}).items():
            print(f"   • {preset_key}: {preset.get('description', '')}")

        print("="*60 + "\n")


# =============================================================================
# DEMO RUNNER
# =============================================================================

def run_monday_demo():
    """
    The Monday Demo - Show CEO/CTO the full autonomous capability

    This runs completely hands-free:
    1. Creates HVAC contractor sandbox
    2. Builds all templates from YAML
    3. Validates against MEP standards
    4. Tests with realistic data
    5. Shows import capability from ServiceTitan
    """
    print("\n" + "="*70)
    print("🎯 MONDAY DEMO - COPERNIQ AI AGENT PLATFORM")
    print("="*70)
    print("\n📌 What you're about to see:")
    print("   • 3 AI agents working autonomously")
    print("   • Template building, validation, testing")
    print("   • MEP domain expertise embedded")
    print("   • Competitor data migration capability")
    print("\n" + "-"*70 + "\n")

    # Create orchestrator
    orchestrator = CoperniqAgentOrchestrator(
        contractor_type="hvac",
        level="professional"
    )

    # Run the full demo
    templates_path = Path(__file__).parent.parent.parent / "templates"
    report = orchestrator.run_full_demo(str(templates_path))

    # Demo the ask capability
    print("\n" + "-"*70)
    print("💬 DEMO: Ask the AI about HVAC certifications...")
    print("-"*70)
    answer = orchestrator.ask("What EPA 608 certification level do I need for residential AC work?")
    print(f"\n{answer}\n")

    # Show state
    print("-"*70)
    print("📊 FINAL STATE")
    print("-"*70)
    state = orchestrator.get_state()
    print(f"Templates: {len(state['templates_built'])}")
    print(f"Validations: {len(state['validation_results'])}")
    print(f"Tests: {len(state['test_results'])}")

    print("\n" + "="*70)
    print("✅ DEMO COMPLETE - Ready for Monday!")
    print("="*70 + "\n")

    return orchestrator, report


if __name__ == "__main__":
    run_monday_demo()
