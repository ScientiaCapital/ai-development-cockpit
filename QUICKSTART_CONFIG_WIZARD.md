# Config Wizard - Quick Reference Card

## One-Liner Start

```bash
python sandbox/config_wizard.py
```

## Common Commands

| Task | Command |
|------|---------|
| **Interactive wizard** | `python sandbox/config_wizard.py` |
| **View presets** | `python sandbox/config_wizard.py --show-presets` |
| **HVAC residential** | `python sandbox/config_wizard.py --preset hvac_residential` |
| **Full MEP** | `python sandbox/config_wizard.py --preset full_mep` |
| **Solar commercial** | `python sandbox/config_wizard.py --preset solar_commercial` |
| **Custom config** | `python sandbox/config_wizard.py --name "ABC" --trades "hvac,solar" --markets "residential" --phases "sales,service"` |
| **Run tests** | `pytest tests/test_config_wizard.py -v` |
| **View examples** | `python examples/config_wizard_examples.py` |

## Available Presets

```
hvac_residential       → HVAC + Residential
hvac_commercial        → HVAC + Commercial/C&I
solar_residential      → Solar + Residential
solar_commercial       → Solar + Commercial/Utility
full_mep              → HVAC + Electrical + Plumbing
fire_life_safety      → Fire Protection + Low Voltage
energy_efficiency     → HVAC + Solar
om_service            → Service & Maintenance focused
```

## Valid Trades

```
hvac, solar, electrical, plumbing, fire_protection,
controls, low_voltage, roofing, general_contractor
```

## Valid Markets

```
residential, commercial, c_and_i, utility, multi_family
```

## Valid Phases

```
sales, pre_job, installation, commissioning,
service, service_plans, closeout
```

## Output

Config saved to: `config/contractor_configs/{company_name}.json`

Contains:
- Company information
- Selected trades, markets, phases
- List of enabled templates (60+ available)
- Compliance requirements
- Timestamp

## Example Flows

### Scenario 1: HVAC Service Company

```bash
# Use preset
python sandbox/config_wizard.py --preset hvac_residential --name "Bob's HVAC"

# Or interactive
python sandbox/config_wizard.py
# Select: HVAC trade, Residential market, Service + Sales phases
```

### Scenario 2: Multi-Trade MEP

```bash
python sandbox/config_wizard.py \
  --name "ABC MEP" \
  --trades "hvac,electrical,plumbing" \
  --markets "residential,commercial" \
  --phases "sales,pre_job,installation,commissioning,service"
```

### Scenario 3: Solar EPC

```bash
python sandbox/config_wizard.py --preset solar_commercial --name "SunRay"
```

## File Locations

| File | Purpose |
|------|---------|
| `sandbox/config_wizard.py` | Main wizard (800+ lines) |
| `tests/test_config_wizard.py` | Tests (50+ test cases) |
| `docs/CONFIG_WIZARD_GUIDE.md` | Full documentation |
| `examples/config_wizard_examples.py` | 10 runnable examples |
| `config/template_registry.json` | Template catalog |
| `config/contractor_configs/*.json` | Generated configs |

## Key Features

✓ Interactive CLI with Rich output
✓ 8 pre-configured presets
✓ 9 trades, 5 markets, 7 phases
✓ 60+ templates auto-selected
✓ Automatic compliance detection
✓ Portable JSON output
✓ 50+ unit tests
✓ No OpenAI dependencies

## Installation

```bash
pip install -r requirements.txt
```

Required:
- click (CLI)
- rich (beautiful output)
- pyyaml (YAML parsing)

## Help

```bash
# Show CLI help
python sandbox/config_wizard.py --help

# View detailed documentation
cat docs/CONFIG_WIZARD_GUIDE.md

# Run examples
python examples/config_wizard_examples.py

# Run tests
pytest tests/test_config_wizard.py -v
```

## Programmatic Usage

```python
from sandbox.config_wizard import ConfigWizard, ContractorInfo, save_config

wizard = ConfigWizard()
info = ContractorInfo(name="My Company")
config = wizard.build_config(
    info,
    trades=["hvac"],
    markets=["residential"],
    phases=["sales", "service"]
)
filepath = save_config(config)
```

## Next Steps

1. Run wizard: `python sandbox/config_wizard.py`
2. Review config: `cat config/contractor_configs/your_company.json`
3. Import to Coperniq Process Studio
4. Generate templates
5. Deploy to sandbox

---

**For full documentation:** See `docs/CONFIG_WIZARD_GUIDE.md`
**For examples:** Run `python examples/config_wizard_examples.py`
**For testing:** Run `pytest tests/test_config_wizard.py -v`
