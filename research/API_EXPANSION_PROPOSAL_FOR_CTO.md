# Coperniq API Expansion Proposal

**Prepared for:** Coperniq CTO & Engineering Leadership
**Prepared by:** Kipper Energy Solutions (Instance 388)
**Date:** 2026-01-13
**Status:** PROPOSAL - Multi-Trade MEP Support

---

## Executive Summary

During our comprehensive catalog buildout for Instance 388, we discovered that **Coperniq's API currently supports only 17 ProductCategory values** - primarily designed for solar EPC workflows. This limits the platform's ability to serve the broader **$500B+ MEP contractor market** (HVAC, Electrical, Plumbing, Fire Safety, Low Voltage, Roofing).

We've documented the gap and propose **15 additional ProductCategory values** that would unlock multi-trade contractor support with minimal engineering effort.

---

## The Discovery

### What We Built
We created a **378-item multi-trade catalog** covering:
- **HVAC:** Split systems, furnaces, heat pumps, RTUs, chillers
- **Electrical:** Wire, conduit, panels, switchboards, transformers, VFDs
- **Plumbing:** Water heaters, backflow devices, pumps, fixtures
- **Solar/Energy:** PV modules, inverters, batteries, EV chargers
- **Fire Safety:** Sprinklers, alarms, extinguishers
- **Low Voltage:** Access control, cameras, network equipment
- **Roofing:** Shingles, membranes, insulation

### What We Found

| Trade | Items | API Support |
|-------|-------|-------------|
| Solar/Energy | 39 | ✅ Full support (PV_MODULE, PV_INVERTER, BATTERY_SYSTEM, etc.) |
| HVAC | 63 | ❌ All forced to "OTHER" |
| Electrical | 113 | ⚠️ Partial (only LOAD_CENTER has mapping) |
| Plumbing | 43 | ❌ All forced to "OTHER" |
| Fire Safety | 47 | ❌ All forced to "OTHER" |
| Low Voltage | 36 | ❌ All forced to "OTHER" |
| Roofing | 37 | ❌ All forced to "OTHER" |

**Result:** 42 catalog items initially failed import because they required categories that don't exist in the API.

---

## Current API ProductCategory Values (17 total)

```
BATTERY_SYSTEM
BATTERY_MANAGEMENT_SYSTEM
CHARGING_GATEWAY
COMBINER_BOX
EV_CHARGER
LOAD_CENTER
MICROINVERTER
MOUNTING
POWER_OPTIMIZER
PRODUCTION_METER
PV_INVERTER
PV_MODULE
RACKING
RAPID_SHUTDOWN_DEVICE
TRACKER
WEATHER_STATION
OTHER
```

**Observation:** 16 of 17 values are solar-specific. Only `OTHER` is available for all other trades.

---

## Proposed ProductCategory Additions (15 values)

### HVAC Categories (5 new)
| Category | Use Case |
|----------|----------|
| `HVAC_SPLIT_SYSTEM` | Central AC split systems, heat pumps |
| `HVAC_FURNACE` | Gas/electric furnaces, heat exchangers |
| `HVAC_MINI_SPLIT` | Ductless mini-splits (residential, commercial) |
| `HVAC_ROOFTOP_UNIT` | Packaged RTUs (commercial) |
| `HVAC_CHILLER` | Chillers, cooling towers (commercial, industrial) |

### Electrical Categories (4 new)
| Category | Use Case |
|----------|----------|
| `ELECTRICAL_PANEL` | Main panels, subpanels, panelboards |
| `ELECTRICAL_SWITCHGEAR` | Switchboards, switchgear assemblies |
| `ELECTRICAL_TRANSFORMER` | Dry-type, oil-filled transformers |
| `ELECTRICAL_MOTOR_CONTROL` | VFDs, soft starters, motor starters |

### Plumbing Categories (3 new)
| Category | Use Case |
|----------|----------|
| `PLUMBING_WATER_HEATER` | Tank, tankless, heat pump water heaters |
| `PLUMBING_FIXTURE` | Toilets, faucets, sinks, tubs |
| `PLUMBING_PUMP` | Sump pumps, sewage ejectors, booster pumps |

### Fire Safety Categories (2 new)
| Category | Use Case |
|----------|----------|
| `FIRE_SPRINKLER` | Sprinkler heads, valves, FDCs |
| `FIRE_ALARM` | Detectors, panels, notification devices |

### Low Voltage Categories (1 new)
| Category | Use Case |
|----------|----------|
| `SECURITY_SYSTEM` | Access control, cameras, NVRs, intrusion |

---

## Business Impact

### TAM Expansion

| Market Segment | Annual US Market | Current Coperniq Support |
|----------------|------------------|-------------------------|
| Solar Residential | $30B | ✅ Full |
| Solar Commercial | $20B | ✅ Full |
| **HVAC Residential** | **$40B** | ❌ Limited |
| **HVAC Commercial** | **$70B** | ❌ Limited |
| **Electrical Contracting** | **$200B** | ❌ Limited |
| **Plumbing** | **$130B** | ❌ Limited |
| **Fire Protection** | **$15B** | ❌ Limited |
| **Low Voltage/Security** | **$20B** | ❌ Limited |

**Total addressable market expansion: ~$525B**

### Competitive Positioning

| Competitor | Multi-Trade Catalog | Smart Categories |
|------------|--------------------|--------------------|
| ServiceTitan | ✅ Yes | ❌ Basic |
| Procore | ✅ Yes | ❌ Basic |
| JobTread | ⚠️ Manual | ❌ None |
| FieldEdge | ✅ Yes | ❌ Basic |
| **Coperniq (proposed)** | **✅ Yes** | **✅ Smart** |

Adding these categories would allow Coperniq to be the **first platform with intelligent, trade-specific equipment categorization** for multi-MEP contractors.

---

## Technical Implementation

### Schema Change
```graphql
enum ProductCategory {
  # Existing Solar/Energy (keep all 16)
  BATTERY_SYSTEM
  BATTERY_MANAGEMENT_SYSTEM
  # ... (existing)

  # NEW: HVAC
  HVAC_SPLIT_SYSTEM
  HVAC_FURNACE
  HVAC_MINI_SPLIT
  HVAC_ROOFTOP_UNIT
  HVAC_CHILLER

  # NEW: Electrical
  ELECTRICAL_PANEL
  ELECTRICAL_SWITCHGEAR
  ELECTRICAL_TRANSFORMER
  ELECTRICAL_MOTOR_CONTROL

  # NEW: Plumbing
  PLUMBING_WATER_HEATER
  PLUMBING_FIXTURE
  PLUMBING_PUMP

  # NEW: Fire Safety
  FIRE_SPRINKLER
  FIRE_ALARM

  # NEW: Low Voltage
  SECURITY_SYSTEM

  # Keep
  OTHER
}
```

### Migration Path
1. **No breaking changes** - existing "OTHER" items continue working
2. **Optional re-categorization** - customers can upgrade items if desired
3. **Backward compatible** - old API clients unaffected

### Estimated Effort
| Task | Effort |
|------|--------|
| Add enum values to GraphQL schema | 1 hour |
| Update validation logic | 2 hours |
| Database migration (add valid enum values) | 1 hour |
| Update documentation | 4 hours |
| QA and testing | 8 hours |
| **Total** | **~2 days** |

---

## Immediate Value for Instance 388

Once these categories are added, we can:

1. **Re-categorize 42 items** currently stuck on "OTHER"
2. **Enable smart filtering** in catalog by equipment type
3. **Build trade-specific reports** (e.g., "Show all HVAC equipment installed this quarter")
4. **Create intelligent job costing** that knows equipment categories
5. **Support warranty tracking** by equipment type

---

## Additional Discovery: ServiceCategory Gap

We also noticed the **ServiceCategory enum** is comprehensive (15 values) but missing:

| Missing | Use Case |
|---------|----------|
| `SAFETY_INSPECTION` | Fire, electrical, OSHA inspections |
| `CODE_COMPLIANCE` | NEC, NFPA code reviews |
| `ENERGY_AUDIT` | ASHRAE Level 1-3 audits |

These are lower priority but worth noting for future expansion.

---

## Summary

### What We're Asking
Add **15 ProductCategory enum values** to support multi-trade MEP contractors.

### Why It Matters
- Unlocks **$525B TAM** beyond solar
- Differentiates Coperniq from ServiceTitan, Procore, FieldEdge
- Enables **intelligent equipment categorization** (first in market)
- **~2 days of engineering** for massive market expansion

### Our Commitment
Kipper Energy Solutions (Instance 388) will:
- Test the new categories immediately upon release
- Provide feedback and additional category suggestions
- Build out reference implementations for other MEP contractors

---

## Appendix: Full Category Mapping Table

| Equipment Type | Current Category | Proposed Category |
|----------------|------------------|-------------------|
| Split AC System | OTHER | HVAC_SPLIT_SYSTEM |
| Gas Furnace | OTHER | HVAC_FURNACE |
| Heat Pump | OTHER | HVAC_SPLIT_SYSTEM |
| Mini-Split | OTHER | HVAC_MINI_SPLIT |
| RTU | OTHER | HVAC_ROOFTOP_UNIT |
| Chiller | OTHER | HVAC_CHILLER |
| Main Panel | OTHER | ELECTRICAL_PANEL |
| Panelboard | OTHER | ELECTRICAL_PANEL |
| Switchboard | OTHER | ELECTRICAL_SWITCHGEAR |
| Transformer | OTHER | ELECTRICAL_TRANSFORMER |
| VFD | OTHER | ELECTRICAL_MOTOR_CONTROL |
| Water Heater | OTHER | PLUMBING_WATER_HEATER |
| Backflow Device | OTHER | PLUMBING_FIXTURE |
| Sump Pump | OTHER | PLUMBING_PUMP |
| Sprinkler Head | OTHER | FIRE_SPRINKLER |
| Fire Alarm Panel | OTHER | FIRE_ALARM |
| IP Camera | OTHER | SECURITY_SYSTEM |
| Access Control | OTHER | SECURITY_SYSTEM |

---

**Contact:** Tim Kipper, Kipper Energy Solutions
**Instance:** 388
**Email:** [available upon request]
