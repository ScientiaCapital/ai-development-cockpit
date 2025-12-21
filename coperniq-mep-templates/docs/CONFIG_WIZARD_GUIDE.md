# Coperniq MEP Config Wizard - Complete Guide

**Version:** 1.0
**Updated:** 2025-12-20
**Status:** Production Ready

## Overview

The **Config Wizard** is an interactive Python CLI tool that helps MEP contractors quickly configure their business templates. It guides contractors through selecting:

- Trade specialties (HVAC, Solar, Electrical, Plumbing, etc.)
- Target markets (Residential, Commercial, C&I, Utility)
- Business phases (Sales, Installation, Service, etc.)
- Company information

The wizard then generates a **contractor config JSON** that:
- Automatically selects matching templates from the registry
- Identifies compliance requirements (EPA 608, NFPA 25, etc.)
- Creates a portable configuration for template generation
- Can be imported into Coperniq Process Studio

## Quick Start

### Installation

The wizard is part of the coperniq-mep-templates package. Dependencies are already in `requirements.txt`:

```bash
cd coperniq-mep-templates
pip install -r requirements.txt
```

Required packages:
- `click` - CLI framework
- `rich` - Beautiful terminal output

### Basic Usage

```bash
# Interactive mode (recommended for first-time setup)
python sandbox/config_wizard.py

# View available presets
python sandbox/config_wizard.py --show-presets

# Use a quick preset
python sandbox/config_wizard.py --preset hvac_residential

# Non-interactive with explicit options
python sandbox/config_wizard.py \
  --name "ABC HVAC" \
  --trades "hvac" \
  --markets "residential" \
  --phases "sales,service" \
  --output ./configs/
```

## Interactive Mode

Run the wizard with no arguments to enter interactive mode:

```bash
python sandbox/config_wizard.py
```

The wizard will guide you through these steps:

### Step 1: Quick Setup Presets (Optional)

```
Coperniq MEP Contractor Config Wizard
┌─────────────────────────────────────────────────────────┐
│ Quick Setup Presets                                     │
├────────────────────┬──────────────────────────────────┤
│ Preset ID          │ Name                             │
├────────────────────┼──────────────────────────────────┤
│ hvac_residential   │ HVAC - Residential Focus         │
│ hvac_commercial    │ HVAC - Commercial Focus          │
│ solar_residential  │ Solar - Residential              │
│ solar_commercial   │ Solar - Commercial/Industrial    │
│ full_mep           │ Full MEP Contractor              │
│ fire_life_safety   │ Fire & Life Safety               │
│ energy_efficiency  │ Energy Efficiency Specialist     │
│ om_service         │ Operations & Maintenance Service │
└────────────────────┴──────────────────────────────────┘
```

Enter the preset ID to use pre-configured settings, or press Enter to skip.

### Step 2: Company Information

```
┌──────────────────────────────────────┐
│ Company Information                  │
└──────────────────────────────────────┘
  Company Name: ABC HVAC Services
  Legal Company Name: ABC HVAC Services LLC
  Address: 123 Main Street
  City: Denver
  State: CO
  ZIP Code: 80202
  Phone: 303-555-0100
  Email: contact@abchvac.com
  Website: www.abchvac.com
  License Number: CO-HVAC-12345
```

**All fields except Company Name are optional.**

### Step 3: Select Your Trades

```
┌──────────────────────────────────────┐
│ Select Your Trades                   │
│ Check all that apply                 │
└──────────────────────────────────────┘
  hvac                  Heating, Ventilation, Air Conditioning...
  ☑ HVAC

  solar                 Solar PV installation, design, commissioning
  ☐ Solar

  electrical            Electrical services, panels, upgrades
  ☐ Electrical

  [etc.]
```

**At least one trade is required.** Common selections:

- **HVAC Only** - Installation and service specialists
- **HVAC + Solar** - Energy efficiency focus
- **HVAC + Electrical + Plumbing** - Full MEP contractors
- **Fire Protection + Low Voltage** - Life safety focus

### Step 4: Select Target Markets

```
┌──────────────────────────────────────┐
│ Select Target Markets                │
│ Where do you do business?            │
└──────────────────────────────────────┘
  ☑ Residential  Single family homes, townhomes, residential
  ☑ Commercial   Office, retail, schools, medical, hospitality
  ☐ C&I          Industrial, warehouses, data centers
  ☐ Utility      Utility-scale solar projects
  ☐ Multi-family Multi-family buildings (2+ units)
```

**At least one market is required.** Market selection affects:
- Which templates are included
- Field requirements and options
- Compliance standards

### Step 5: Select Business Phases

```
┌──────────────────────────────────────┐
│ Select Business Phases               │
│ Which phases apply to your business? │
└──────────────────────────────────────┘
  ☑ Sales         Lead intake, site surveys, proposals
  ☐ Pre-Job       Job planning, permits, material ordering
  ☑ Installation  Equipment install, checklists, daily logs
  ☑ Commissioning System testing, verification, handoff
  ☑ Service       Service calls, maintenance, inspections
  ☑ Service Plans Recurring maintenance contracts
  ☐ Closeout      Final inspection, warranty, sign-off
```

**At least one phase is required.** Phases determine:
- Which form templates are generated
- Workflow structure
- Checklist and inspection requirements

### Configuration Summary

After selection, you'll see a summary:

```
┌──────────────────────────────────────────┐
│ Configuration Summary                    │
├──────────────────────────────────────────┤
│ Company: ABC HVAC Services               │
│ Legal Name: ABC HVAC Services LLC        │
│ Phone: 303-555-0100                      │
│ Email: contact@abchvac.com               │
│                                          │
│ Trades: hvac, solar                      │
│ Markets: residential, commercial         │
│ Phases: sales, installation, service     │
│                                          │
│ Templates: 18 templates selected         │
│   • hvac        12 templates             │
│   • solar        6 templates             │
│                                          │
│ Compliance: EPA 608, NEC 2023, OSHA      │
└──────────────────────────────────────────┘
```

Review the summary and confirm to save.

## Command-Line Options

### `--preset PRESET_ID`
Use a quick setup preset instead of manual selection.

```bash
# Use HVAC Residential preset
python sandbox/config_wizard.py --preset hvac_residential

# View all available presets
python sandbox/config_wizard.py --show-presets
```

**Available Presets:**
- `hvac_residential` - HVAC + residential markets + service-focused
- `hvac_commercial` - HVAC + commercial/C&I markets
- `solar_residential` - Solar + residential only
- `solar_commercial` - Solar + commercial/utility markets
- `full_mep` - HVAC + Electrical + Plumbing multi-trade
- `fire_life_safety` - Fire Protection + Low Voltage
- `energy_efficiency` - HVAC + Solar combined
- `om_service` - Operations & Maintenance service-focused

### `--name COMPANY_NAME`
Set company name for non-interactive mode.

```bash
python sandbox/config_wizard.py \
  --name "ABC HVAC" \
  --trades "hvac" \
  --markets "residential" \
  --phases "sales,service"
```

### `--trades TRADE_LIST`
Comma-separated list of trades (use in non-interactive mode).

Valid trades: `hvac`, `solar`, `electrical`, `plumbing`, `fire_protection`, `controls`, `low_voltage`, `roofing`, `general_contractor`

```bash
python sandbox/config_wizard.py --name "ABC" --trades "hvac,solar"
```

### `--markets MARKET_LIST`
Comma-separated list of target markets.

Valid markets: `residential`, `commercial`, `c_and_i`, `utility`, `multi_family`

```bash
python sandbox/config_wizard.py --name "ABC" --markets "residential,commercial"
```

### `--phases PHASE_LIST`
Comma-separated list of business phases.

Valid phases: `sales`, `pre_job`, `installation`, `commissioning`, `service`, `service_plans`, `closeout`

```bash
python sandbox/config_wizard.py --name "ABC" --phases "sales,installation,service"
```

### `--output DIRECTORY`
Specify output directory for config file (default: `config/contractor_configs/`).

```bash
python sandbox/config_wizard.py --preset hvac_residential --output ./my_configs/
```

### `--interactive/--no-interactive`
Force interactive or non-interactive mode (default: interactive).

```bash
# Force interactive even with options
python sandbox/config_wizard.py --interactive

# Non-interactive mode (requires all options)
python sandbox/config_wizard.py --no-interactive \
  --name "ABC" \
  --trades "hvac" \
  --markets "residential" \
  --phases "sales,service"
```

### `--show-presets`
Display available presets and exit.

```bash
python sandbox/config_wizard.py --show-presets
```

## Configuration Output

The wizard saves a **contractor config JSON** to `config/contractor_configs/{company_name}.json`:

```json
{
  "contractor_name": "ABC HVAC Services",
  "contractor_info": {
    "name": "ABC HVAC Services",
    "legal_name": "ABC HVAC Services LLC",
    "city": "Denver",
    "state": "CO",
    "zip_code": "80202",
    "phone": "303-555-0100",
    "email": "contact@abchvac.com",
    "website": "www.abchvac.com",
    "license_number": "CO-HVAC-12345",
    "address": "123 Main Street",
    "logo_url": null
  },
  "trades": ["hvac", "solar"],
  "markets": ["residential", "commercial"],
  "phases": ["sales", "installation", "commissioning", "service"],
  "templates_enabled": [
    "templates/hvac/lead_intake.yaml",
    "templates/hvac/equipment_proposal.yaml",
    "templates/hvac/site_survey_residential.yaml",
    "templates/hvac/job_planning_worksheet.yaml",
    "templates/hvac/ac_system_inspection.yaml",
    "templates/hvac/furnace_safety_inspection.yaml",
    "templates/solar/site_assessment.yaml",
    "templates/solar/proposal_builder.yaml",
    "templates/solar/commissioning_report.yaml"
  ],
  "template_counts": {
    "hvac": 6,
    "solar": 3
  },
  "compliance_requirements": [
    "EPA 608",
    "NEC 2023",
    "OSHA"
  ],
  "preset_used": null,
  "created_at": "2025-12-20T18:30:45.123456",
  "notes": null
}
```

**Key Fields:**

- `contractor_name` - Company name (used for filename)
- `contractor_info` - Full company details
- `trades` - Selected trade specialties
- `markets` - Target market segments
- `phases` - Business lifecycle phases
- `templates_enabled` - List of template files to generate/import
- `template_counts` - Count of templates per trade
- `compliance_requirements` - Regulatory standards (EPA, NFPA, etc.)
- `preset_used` - Name of preset if applicable
- `created_at` - ISO 8601 timestamp
- `notes` - Optional notes

## Preset Configurations

Presets are pre-configured template selections for common contractor profiles.

### HVAC Residential

Perfect for HVAC contractors focused on residential service and installation.

```json
{
  "trades": ["hvac"],
  "markets": ["residential"],
  "phases": ["sales", "pre_job", "installation", "commissioning", "service", "service_plans"]
}
```

**Includes:** Lead intake, site surveys, proposals, job planning, AC/furnace inspection, service calls, maintenance plans.

### HVAC Commercial

For HVAC contractors serving commercial and industrial clients.

```json
{
  "trades": ["hvac"],
  "markets": ["commercial", "c_and_i"],
  "phases": ["sales", "pre_job", "installation", "commissioning", "service"]
}
```

### Solar Residential

Residential solar installation and service.

```json
{
  "trades": ["solar"],
  "markets": ["residential"],
  "phases": ["sales", "installation", "commissioning"]
}
```

### Solar Commercial

Commercial and utility-scale solar EPC (Engineering, Procurement, Construction).

```json
{
  "trades": ["solar"],
  "markets": ["commercial", "utility"],
  "phases": ["sales", "pre_job", "installation", "commissioning"]
}
```

### Full MEP

Multi-trade MEP contractors (HVAC, Electrical, Plumbing).

```json
{
  "trades": ["hvac", "electrical", "plumbing"],
  "markets": ["residential", "commercial"],
  "phases": ["sales", "pre_job", "installation", "commissioning", "service", "service_plans"]
}
```

**Includes:** All trades' templates across all phases.

### Fire & Life Safety

Fire protection and low-voltage/security focus.

```json
{
  "trades": ["fire_protection", "low_voltage"],
  "markets": ["commercial", "c_and_i"],
  "phases": ["installation", "service"]
}
```

### Energy Efficiency Specialist

Combined HVAC and Solar for energy-focused contractors.

```json
{
  "trades": ["hvac", "solar"],
  "markets": ["residential", "commercial"],
  "phases": ["sales", "installation", "commissioning", "service"]
}
```

### Operations & Maintenance Service

Service-focused contractors handling maintenance contracts.

```json
{
  "trades": ["hvac", "plumbing", "electrical"],
  "markets": ["residential", "commercial"],
  "phases": ["service", "service_plans"]
}
```

## Common Use Cases

### Use Case 1: Residential HVAC Contractor

Bob runs a small HVAC company in Denver doing residential service and installation.

```bash
python sandbox/config_wizard.py --preset hvac_residential --name "Bob's HVAC"
```

Result: 12 templates across sales, installation, commissioning, and service phases.

### Use Case 2: Multi-Trade MEP Contractor

ABC Sheet Metal does HVAC, electrical, and some plumbing work for commercial clients.

```bash
python sandbox/config_wizard.py \
  --name "ABC Sheet Metal" \
  --trades "hvac,electrical,plumbing" \
  --markets "commercial,c_and_i" \
  --phases "sales,pre_job,installation,commissioning,service"
```

### Use Case 3: Solar EPC Company

SunRay Solar installs large commercial and utility-scale solar systems.

```bash
python sandbox/config_wizard.py --preset solar_commercial --name "SunRay Solar"
```

### Use Case 4: Service-Only Operation

GreenTech specializes in maintenance agreements and service calls.

```bash
python sandbox/config_wizard.py \
  --name "GreenTech Services" \
  --trades "hvac,plumbing" \
  --markets "residential,commercial" \
  --phases "service,service_plans"
```

## Next Steps After Configuration

### 1. Review the Configuration
```bash
cat config/contractor_configs/abc_hvac_services.json
```

### 2. Import into Coperniq
1. Open Coperniq Process Studio (https://app.coperniq.io/112)
2. Go to Form Templates → Create from Template
3. Upload or copy the `templates_enabled` list
4. Templates will be auto-populated based on selection

### 3. Generate Templates
```bash
# (Future: orchestrator will use config to generate templates)
python sandbox/agents/orchestrator.py \
  --config config/contractor_configs/abc_hvac_services.json \
  --action generate
```

### 4. Brand and Customize
- Add company logo
- Customize field labels
- Add company-specific workflows
- Set up integrations

### 5. Deploy to Sandbox
- Test with sample data
- Train team on templates
- Go live!

## Architecture

### File Structure

```
coperniq-mep-templates/
├── sandbox/
│   └── config_wizard.py          # Main wizard script
├── config/
│   ├── contractor_configs/       # Generated configs
│   │   └── abc_hvac_services.json
│   ├── template_registry.json    # Master template catalog
│   └── contractor_setup_wizard.yaml  # YAML spec
├── templates/                    # Template files by trade
│   ├── hvac/
│   ├── solar/
│   ├── electrical/
│   └── ...
└── tests/
    └── test_config_wizard.py     # Unit tests
```

### Data Flow

```
User Input
    ↓
ConfigWizard.run_interactive()
    ↓
Select: Trades, Markets, Phases
    ↓
TemplateRegistry.get_templates_by_phase()
    ↓
Build: ContractorConfig
    ↓
save_config() → JSON file
    ↓
config/contractor_configs/{name}.json
```

### Template Registry Matching

```python
# The wizard uses template_registry.json to find matching templates

registry.get_template_files(
    trades=["hvac", "solar"],
    phases=["sales", "installation"],
    markets=["residential", "commercial"]
)

# Returns list of matching template files:
[
    "templates/hvac/lead_intake.yaml",
    "templates/hvac/site_survey_residential.yaml",
    "templates/solar/site_assessment.yaml",
    ...
]
```

## Testing

Run the full test suite:

```bash
pytest tests/test_config_wizard.py -v

# With coverage
pytest tests/test_config_wizard.py --cov=sandbox.config_wizard
```

**Test Coverage:**
- 50+ unit tests
- Data model validation
- Preset validation
- Template registry integration
- File operations
- Error handling
- Integration tests

## API Reference

### Main Classes

#### `ConfigWizard`
Interactive CLI wizard for contractor configuration.

```python
from sandbox.config_wizard import ConfigWizard

wizard = ConfigWizard()

# Interactive mode
config = wizard.run_interactive()

# Print summary
wizard.print_summary(config)
```

**Methods:**
- `run_interactive()` - Run full wizard flow
- `get_company_info()` - Collect company details
- `select_trades()` - Interactively select trades
- `select_markets()` - Interactively select markets
- `select_phases()` - Interactively select phases
- `use_preset()` - Ask about preset usage
- `build_config()` - Create ContractorConfig
- `print_summary()` - Display configuration summary

#### `TemplateRegistry`
Loads and searches template registry.

```python
from sandbox.config_wizard import TemplateRegistry

registry = TemplateRegistry()

# Get templates for specific criteria
files = registry.get_template_files(
    trades=["hvac"],
    phases=["sales"],
    markets=["residential"]
)

# Get compliance requirements
compliance = registry.get_required_compliance(["hvac", "solar"])
```

**Methods:**
- `get_templates_for_trade(trade)` - Get all templates for a trade
- `get_templates_by_phase(trade, phase)` - Get templates for trade/phase
- `get_template_files(trades, phases, markets)` - Search templates
- `get_required_compliance(trades)` - Get compliance standards

#### `ContractorConfig`
Data model for contractor configuration.

```python
from sandbox.config_wizard import ContractorConfig, ContractorInfo

info = ContractorInfo(
    name="ABC HVAC",
    city="Denver",
    state="CO",
    email="info@abchvac.com"
)

config = ContractorConfig(
    contractor_name="ABC HVAC",
    contractor_info=info,
    trades=["hvac"],
    markets=["residential"],
    phases=["sales", "service"]
)

# Export to dict/JSON
config_dict = config.to_dict()
import json
json_str = json.dumps(config_dict)
```

### Utility Functions

#### `save_config(config, directory=None)`
Save contractor config to JSON file.

```python
from sandbox.config_wizard import save_config

filepath = save_config(config)  # Saves to config/contractor_configs/
print(filepath)  # /path/to/config/contractor_configs/abc_hvac.json
```

#### `get_config_directory()`
Get or create contractor configs directory.

```python
from sandbox.config_wizard import get_config_directory

config_dir = get_config_directory()
print(config_dir)  # Path to config/contractor_configs/
```

## Troubleshooting

### "Template registry not found"

The wizard expects `template_registry.json` in the `config/` directory.

```bash
# Check if registry exists
ls -la coperniq-mep-templates/config/template_registry.json

# If missing, it might need to be generated
python sandbox/agents/orchestrator.py --action build_registry
```

### "No templates found for your selection"

This might happen if:
1. Selected trades don't have templates for chosen phases
2. Market segments don't match available templates

**Solution:** Try a different phase combination or use a preset.

### "Company name contains invalid characters"

The filename is sanitized to remove spaces and special characters. This is normal - the config will save correctly.

### "ModuleNotFoundError: No module named 'click'"

Install required dependencies:

```bash
pip install -r requirements.txt
```

### Configuration not saving

Check directory permissions:

```bash
# Ensure directory exists and is writable
mkdir -p coperniq-mep-templates/config/contractor_configs/
chmod 755 coperniq-mep-templates/config/contractor_configs/
```

## Advanced: Extending the Wizard

### Adding Custom Presets

Edit `sandbox/config_wizard.py` and add to `PRESETS`:

```python
PRESETS["my_custom_preset"] = {
    "name": "My Custom Preset",
    "description": "Custom template selection",
    "trades": ["hvac", "solar"],
    "markets": ["residential"],
    "phases": ["sales", "installation"]
}
```

### Programmatic Usage

```python
from sandbox.config_wizard import ConfigWizard, ContractorInfo

# Create wizard
wizard = ConfigWizard()

# Build config programmatically
info = ContractorInfo(name="Test Company")
config = wizard.build_config(
    info,
    trades=["hvac"],
    markets=["residential"],
    phases=["sales", "service"]
)

# Save
from sandbox.config_wizard import save_config
filepath = save_config(config)
print(f"Saved to: {filepath}")
```

### Custom Market/Trade Definitions

Extend the Enum classes:

```python
class Trade(str, Enum):
    HVAC = "hvac"
    SOLAR = "solar"
    # Add custom:
    CUSTOM_TRADE = "custom_trade"
```

## Support & Contributing

### Reporting Issues

If you encounter issues with the wizard:

1. Check this guide for solutions
2. Review test cases in `tests/test_config_wizard.py`
3. Check existing GitHub issues
4. Submit new issue with:
   - Command used
   - Error message
   - System info (OS, Python version)

### Contributing

Improvements welcome! Areas for enhancement:

- [ ] Additional presets for specific regions/industries
- [ ] Configuration file format support (YAML, etc.)
- [ ] Configuration merging/inheritance
- [ ] Validation against Coperniq schema
- [ ] Template preview before saving
- [ ] Batch contractor setup

## Changelog

### v1.0 (2025-12-20)
- Initial release
- Interactive wizard with 8 presets
- Template registry integration
- Full test coverage (50+ tests)
- Comprehensive documentation
- No OpenAI dependencies (uses Anthropic Claude)

---

**For support:** contact engineering@scientia-capital.com
