# Coperniq MEP Config Wizard

Interactive Python CLI for MEP contractor onboarding and template configuration.

## Quick Start

```bash
# Install dependencies (if not already installed)
pip install -r requirements.txt

# Run interactive wizard
cd coperniq-mep-templates
python sandbox/config_wizard.py

# Or use a quick preset
python sandbox/config_wizard.py --preset hvac_residential

# View all available presets
python sandbox/config_wizard.py --show-presets
```

## What It Does

The Config Wizard helps contractors:

1. **Select their trades** - HVAC, Solar, Electrical, Plumbing, Fire Protection, etc.
2. **Choose target markets** - Residential, Commercial, Industrial, Utility
3. **Specify business phases** - Sales, Installation, Service, Maintenance, etc.
4. **Enter company info** - Name, contact details, licenses, etc.

The wizard then **automatically generates a configuration JSON** that:
- Selects matching templates from the registry (60+ available)
- Identifies compliance requirements (EPA 608, NFPA 25, NEC 2023, etc.)
- Creates a portable config file for template generation

## Features

### Interactive Mode
Beautiful terminal interface with:
- ✓ Checkbox selections for trades, markets, phases
- ✓ Real-time template counting
- ✓ Configuration summary before saving
- ✓ Color-coded output for better readability

### 8 Quick Presets
One-click setup for common contractor types:
- `hvac_residential` - Residential HVAC service & installation
- `hvac_commercial` - Commercial HVAC contracting
- `solar_residential` - Residential solar installation
- `solar_commercial` - Utility-scale solar EPC
- `full_mep` - Multi-trade MEP contractor
- `fire_life_safety` - Fire protection & security
- `energy_efficiency` - HVAC + Solar combined
- `om_service` - Operations & maintenance focused

### Automatic Compliance Detection
Selects required compliance standards based on trades:
- HVAC: EPA 608, OSHA
- Solar: NEC 2023, OSHA
- Fire Protection: NFPA 25, NFPA 72
- Electrical: NEC 2023, OSHA
- Low Voltage: TIA-568, BICSI standards

### Template Registry Integration
- Access to 60+ templates across 9 trades
- Automatic template filtering by:
  - Trade specialties
  - Business phases
  - Market segments
- No manual template selection needed

## Usage Examples

### Interactive Mode (Recommended)

```bash
python sandbox/config_wizard.py
```

Follow the prompts to enter company info and select:
- Trades (HVAC, Solar, Electrical, etc.)
- Markets (Residential, Commercial, C&I, etc.)
- Phases (Sales, Installation, Service, etc.)

Output: `config/contractor_configs/abc_hvac_services.json`

### Quick Preset

```bash
python sandbox/config_wizard.py --preset hvac_residential --name "ABC HVAC"
```

Instantly creates config using pre-configured settings.

### Non-Interactive

```bash
python sandbox/config_wizard.py \
  --name "ABC HVAC" \
  --trades "hvac,solar" \
  --markets "residential,commercial" \
  --phases "sales,installation,service" \
  --output ./my_configs/
```

All options: `--name`, `--trades`, `--markets`, `--phases`, `--output`

### View All Presets

```bash
python sandbox/config_wizard.py --show-presets
```

## Output Format

Generates a JSON configuration file:

```json
{
  "contractor_name": "ABC HVAC Services",
  "contractor_info": {
    "name": "ABC HVAC Services",
    "legal_name": "ABC HVAC Services LLC",
    "city": "Denver",
    "state": "CO",
    "phone": "303-555-0100",
    "email": "contact@abchvac.com"
  },
  "trades": ["hvac", "solar"],
  "markets": ["residential", "commercial"],
  "phases": ["sales", "installation", "commissioning", "service"],
  "templates_enabled": [
    "templates/hvac/lead_intake.yaml",
    "templates/hvac/site_survey_residential.yaml",
    "templates/solar/site_assessment.yaml",
    ...
  ],
  "template_counts": {
    "hvac": 12,
    "solar": 6
  },
  "compliance_requirements": ["EPA 608", "NEC 2023", "OSHA"],
  "created_at": "2025-12-20T18:30:45.123456",
  "preset_used": null
}
```

## Configuration Directory

Configs are saved to: `config/contractor_configs/{company_name}.json`

This directory is automatically created if it doesn't exist.

## Testing

Run the comprehensive test suite:

```bash
pytest tests/test_config_wizard.py -v

# With coverage report
pytest tests/test_config_wizard.py --cov=sandbox.config_wizard
```

**Test Coverage:** 50+ unit tests covering:
- Data models and enums
- Template registry operations
- Preset validation
- Configuration building
- File operations
- Error handling
- Integration flows

## Documentation

Full documentation available in:
- `docs/CONFIG_WIZARD_GUIDE.md` - Complete guide with all options
- `examples/config_wizard_examples.py` - 10 runnable examples

## Architecture

```
config_wizard.py
├── Enums
│   ├── Trade (HVAC, Solar, Electrical, Plumbing, etc.)
│   ├── Market (Residential, Commercial, C&I, Utility)
│   └── Phase (Sales, Installation, Service, etc.)
├── Data Models
│   ├── ContractorInfo
│   └── ContractorConfig
├── TemplateRegistry
│   └── Load & query templates from template_registry.json
├── ConfigWizard
│   └── Interactive CLI wizard
└── CLI (Click-based)
    └── Command-line interface with options
```

## Dependencies

- `click>=8.0.0` - CLI framework
- `rich>=13.0.0` - Beautiful terminal output
- `pyyaml>=6.0.0` - YAML parsing (for template registry)
- Python 3.10+

## Next Steps

1. **Review the configuration**
   ```bash
   cat config/contractor_configs/abc_hvac_services.json
   ```

2. **Import into Coperniq**
   - Open Process Studio
   - Select templates from the `templates_enabled` list
   - Create form instances

3. **Customize templates**
   - Add company logo
   - Customize field labels
   - Set company-specific workflows

4. **Deploy to sandbox**
   - Test with sample data
   - Train contractor team
   - Go live!

## API Usage

Use the wizard programmatically:

```python
from sandbox.config_wizard import ConfigWizard, ContractorInfo, save_config

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

# Save to file
filepath = save_config(config)
print(f"Saved to: {filepath}")
```

## Troubleshooting

### "Template registry not found"
Ensure `config/template_registry.json` exists.

### "ModuleNotFoundError: No module named 'click'"
Install dependencies: `pip install -r requirements.txt`

### "No templates found"
Try a different phase combination or use a preset.

### "Configuration not saving"
Check directory permissions:
```bash
mkdir -p coperniq-mep-templates/config/contractor_configs/
chmod 755 coperniq-mep-templates/config/contractor_configs/
```

## Advanced Features

### Custom Presets

Edit `sandbox/config_wizard.py` and add to `PRESETS`:

```python
PRESETS["my_custom"] = {
    "name": "My Custom Preset",
    "description": "Description here",
    "trades": ["hvac", "solar"],
    "markets": ["residential"],
    "phases": ["sales", "installation"]
}
```

### Extending Enums

Add custom trades or markets:

```python
class Trade(str, Enum):
    HVAC = "hvac"
    CUSTOM = "custom_trade"
```

## Support

For issues or questions:
1. Check the full guide: `docs/CONFIG_WIZARD_GUIDE.md`
2. Review examples: `examples/config_wizard_examples.py`
3. Run tests: `pytest tests/test_config_wizard.py -v`
4. Contact: engineering@scientia-capital.com

## License

Part of the Coperniq MEP Templates project.

---

**Version:** 1.0
**Updated:** 2025-12-20
**Status:** Production Ready

No OpenAI dependencies - uses standard Python ecosystem (Click, Rich, YAML).
