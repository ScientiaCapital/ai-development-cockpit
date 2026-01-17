# Coperniq Instance 388 - Complete MEP Buildout Plan

**Created:** 2026-01-16
**Target:** Production-Ready Demo Environment
**Instance:** https://app.coperniq.io/388

---

## Executive Summary

This plan outlines the complete buildout of Coperniq Instance 388 as a comprehensive demonstration environment for **Energy + MEP contractors** covering all 7 trades across 4 market segments.

### Trades Covered
| Trade | Code | Lead Technician | Readiness |
|-------|------|-----------------|-----------|
| HVAC | H | Mark Thompson | 95% |
| Electrical | E | David Kim | 60% |
| Plumbing | P | Carlos Rodriguez | 50% |
| Roofing | R | James Miller | 70% |
| Low Voltage | LV | Alex Turner | 40% |
| Fire & Safety | FS | Patricia Williams | 70% |
| Solar/Energy | S | Jennifer Lee | 95% |

### Market Segments
| Segment | Code | Description | Asset Target |
|---------|------|-------------|--------------|
| Residential | RES | Single-family, small multi-family | 150 assets |
| Resimercial | RSM | Light commercial, restaurants, small retail | 100 assets |
| Commercial & Industrial | C&I | Medium/large buildings, manufacturing | 150 assets |
| Industrial/Utility | IND | Data centers, process, utility-scale | 100 assets |
| **TOTAL** | | | **500+ assets** |

---

## Current State Audit

### Catalog Inventory (570 items)
| Trade | Base | Expansion | Total | Status |
|-------|------|-----------|-------|--------|
| HVAC | 15 | 75 | 90 | ✅ Complete |
| Electrical | 16 | 150 | 166 | ✅ Complete |
| Plumbing | 16 | 55 | 71 | ✅ Complete |
| Roofing | 15 | 50 | 65 | ✅ Complete |
| Low Voltage | 15 | 106 | 121 | ✅ Complete |
| Fire & Safety | 16 | 60 | 76 | ✅ Complete |
| Solar/Energy | 19 | 50 | 69 | ✅ Complete |

### Workflow Coverage
| Trade | GTM Vertical | Installation Workflow | Service Plans | Automations | Templates |
|-------|--------------|----------------------|---------------|-------------|-----------|
| HVAC | ✅ | ✅ 7 phases | ✅ 8 plans | ✅ 5 rules | ✅ 10 |
| Electrical | ❌ | ❌ | ✅ 5 plans | ✅ 4 rules | ✅ 6 |
| Plumbing | ❌ | ❌ | ✅ 4 plans | ✅ 4 rules | ✅ 6 |
| Roofing | ✅ | ⚠️ Partial | ❌ TODO | ❌ TODO | ⚠️ 1 only |
| Low Voltage | ❌ | ❌ | ✅ 3 plans | ✅ 2 rules | ⚠️ 2 only |
| Fire & Safety | ❌ | ❌ | ✅ 6 plans | ✅ 5 rules | ✅ 5 |
| Solar | ✅ | ✅ 9 phases | ✅ 5 plans | ✅ 4 rules | ✅ 10 |

### Asset Infrastructure
| Component | Current | Target | Gap |
|-----------|---------|--------|-----|
| Equipment Types | 19 | 100+ | Need 81 more types |
| Demo Assets | 59 | 500+ | Need 441 more |
| Asset Properties | 8 fields | 25+ | Need trade-specific fields |

---

## Phase 1: HVAC Completion (H in MEP)

**Status:** 95% Ready
**Lead:** Mark Thompson
**Timeline:** 1 day

### 1.1 What's Already Done
- ✅ GTM Vertical: `hvac_mep.json`
- ✅ Installation Workflow: 7 phases (Lead → Complete)
- ✅ Service Plans: 3 residential + 5 commercial
- ✅ Automations: 5 rules (lead assignment, seasonal, refrigerant, no-heat, warranty)
- ✅ Templates: 10 YAML files
- ✅ Catalog: 90 items (equipment, materials, labor)

### 1.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Add commercial RTU workflow variant | Medium | 2 hrs |
| Create labor rate templates by skill level | Low | 1 hr |
| Add cross-trade scheduling optimization | Low | 2 hrs |

### 1.3 HVAC Asset Types (25 types)
```
Residential:
- Split System AC (1.5T-5T)
- Gas Furnace (40K-120K BTU)
- Heat Pump (2T-5T)
- Mini Split (9K-36K BTU)
- Thermostat (Smart/Programmable)
- Air Handler
- Ductless System

Resimercial:
- Package Unit (3T-7.5T)
- PTAC Unit
- Water Source Heat Pump
- VRF Indoor Unit

Commercial & Industrial:
- Rooftop Unit (7.5T-25T)
- Chiller (50T-200T)
- Cooling Tower
- Air Handling Unit
- VAV Box
- Fan Coil Unit
- Boiler (Hot Water/Steam)
- Pump (Chilled/Hot Water)

Industrial:
- Process Chiller (200T+)
- CRAH/CRAC Unit
- Clean Room AHU
- Industrial Exhaust Fan
- Make-Up Air Unit
```

### 1.4 HVAC Assets to Create (75 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 30 | 15 AC units, 10 furnaces, 5 heat pumps |
| Resimercial | 15 | 8 package units, 5 mini-splits, 2 VRF |
| C&I | 20 | 10 RTUs, 5 chillers, 5 AHUs |
| Industrial | 10 | 3 process chillers, 4 CRAH, 3 cooling towers |

---

## Phase 2: Electrical Completion (E in MEP)

**Status:** 60% Ready
**Lead:** David Kim
**Timeline:** 2 days

### 2.1 What's Already Done
- ✅ Service Plans: 5 plans (safety inspections, generator PM, UPS)
- ✅ Automations: 4 rules (25C tax credit, load calc, AFCI, EV permit)
- ✅ Templates: 6 YAML files
- ✅ Catalog: 166 items (most comprehensive)

### 2.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Create GTM Vertical: `electrical.json` | High | 3 hrs |
| Create installation workflow (lead → completion) | High | 4 hrs |
| Add permit application templates (city-specific) | Medium | 2 hrs |
| Add arc flash analysis automation | Medium | 2 hrs |
| Add load calculation engine | Low | 4 hrs |

### 2.3 Electrical Asset Types (20 types)
```
Residential:
- Main Panel (100A-200A)
- Sub Panel (60A-100A)
- Whole House Surge Protector
- Generator (Standby)
- EV Charger (Level 2)
- Smart Panel

Resimercial:
- Distribution Panel (225A-400A)
- Transformer (75kVA-150kVA)
- Generator (Commercial)
- UPS System (Small)

Commercial & Industrial:
- Switchboard (600A-1200A)
- Switchgear (1600A+)
- Motor Control Center
- VFD (5HP-100HP)
- Soft Starter
- Transformer (225kVA-500kVA)
- Generator (Parallel)

Industrial/Utility:
- Medium Voltage Switchgear
- Substation Transformer
- Battery Energy Storage
- Utility Interconnect
```

### 2.4 Electrical Assets to Create (70 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 25 | 15 panels, 5 generators, 5 EV chargers |
| Resimercial | 15 | 8 panels, 4 transformers, 3 UPS |
| C&I | 20 | 10 switchboards, 5 VFDs, 5 generators |
| Industrial | 10 | 4 switchgear, 3 MCCs, 3 substations |

---

## Phase 3: Plumbing Completion (P in MEP)

**Status:** 50% Ready
**Lead:** Carlos Rodriguez
**Timeline:** 2 days

### 3.1 What's Already Done
- ✅ Service Plans: 4 plans (home shield, backflow, grease, medical gas)
- ✅ Automations: 4 rules (backflow reminder, flush reminder, emergency, camera quote)
- ✅ Templates: 6 YAML files
- ✅ Catalog: 71 items

### 3.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Create GTM Vertical: `plumbing.json` | High | 3 hrs |
| Create installation workflow (lead → completion) | High | 4 hrs |
| Add commercial grease trap workflow | Medium | 2 hrs |
| Add fixture sizing calculator | Low | 3 hrs |
| Add water quality testing integration | Low | 2 hrs |

### 3.3 Plumbing Asset Types (18 types)
```
Residential:
- Tank Water Heater (40-75 gal)
- Tankless Water Heater
- Heat Pump Water Heater
- Sump Pump
- Backflow Preventer (PVB)
- Water Softener
- Recirculation Pump

Resimercial:
- Commercial Water Heater (75-100 gal)
- Grease Interceptor (Small)
- Backflow Preventer (DCVA)
- Booster Pump

Commercial & Industrial:
- Commercial Water Heater (100+ gal)
- Grease Interceptor (Large)
- Backflow Preventer (RPZ)
- Hot Water Boiler
- Steam Boiler
- Sewage Ejector Pump

Industrial:
- Process Water System
```

### 3.4 Plumbing Assets to Create (50 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 25 | 15 water heaters, 5 sump pumps, 5 backflows |
| Resimercial | 10 | 5 commercial WH, 3 grease traps, 2 backflows |
| C&I | 10 | 5 large WH, 3 boilers, 2 pumps |
| Industrial | 5 | 3 process systems, 2 steam boilers |

---

## Phase 4: Roofing Completion

**Status:** 70% Ready
**Lead:** James Miller
**Timeline:** 2 days

### 4.1 What's Already Done
- ✅ GTM Vertical: `roofing_contractor.json` (HIGHLY detailed)
- ⚠️ Workflow: 8 phases for residential, 11 for storm restoration
- ❌ Service Plans: TODO
- ❌ Automations: TODO
- ⚠️ Templates: Only 1 (roof inspection)

### 4.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Create service plans (O&M, warranty tracking) | High | 2 hrs |
| Create 10+ additional templates | High | 6 hrs |
| Add storm season lead capture automation | Medium | 2 hrs |
| Add Xactimate/supplement automation | Medium | 3 hrs |
| Add GAF/OC certification tracking | Low | 2 hrs |

### 4.3 Templates Needed
1. Residential Roof Inspection
2. Storm Damage Assessment
3. Commercial Roof Design
4. Warranty Registration
5. Safety Briefing
6. Daily Production Report
7. Customer Walkthrough
8. Insurance Supplement Documentation
9. Material Delivery Checklist
10. Quality Control Checklist

### 4.4 Roofing Asset Types (12 types)
```
Residential:
- Asphalt Shingle Roof
- Metal Roof (Residential)
- Tile Roof
- Gutter System
- Skylight

Resimercial:
- Architectural Shingle Roof
- Standing Seam Metal
- Modified Bitumen Roof

Commercial & Industrial:
- TPO Membrane Roof
- EPDM Membrane Roof
- PVC Membrane Roof
- Built-Up Roofing (BUR)
```

### 4.5 Roofing Assets to Create (40 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 20 | 12 shingle, 5 metal, 3 tile |
| Resimercial | 8 | 4 architectural, 2 standing seam, 2 mod bit |
| C&I | 10 | 4 TPO, 3 EPDM, 3 PVC |
| Industrial | 2 | 1 BUR, 1 large TPO |

---

## Phase 5: Low Voltage Completion

**Status:** 40% Ready
**Lead:** Alex Turner
**Timeline:** 3 days

### 5.1 What's Already Done
- ✅ Service Plans: 3 plans (security monitoring, camera health, access audit)
- ✅ Automations: 2 rules (camera health, access audit)
- ⚠️ Templates: Only 2 (point verification, energy dashboard)
- ✅ Catalog: 121 items

### 5.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Create GTM Vertical: `low_voltage.json` | High | 3 hrs |
| Create installation workflow | High | 4 hrs |
| Add access control system design template | High | 2 hrs |
| Add video management system templates | Medium | 2 hrs |
| Add structured cabling templates | Medium | 2 hrs |
| Add smart home automation templates | Medium | 3 hrs |
| Add network infrastructure templates | Low | 2 hrs |

### 5.3 Low Voltage Asset Types (20 types)
```
Residential:
- Security Panel
- Door/Window Sensor
- Motion Detector (PIR)
- IP Camera (Indoor)
- IP Camera (Outdoor)
- Video Doorbell
- Smart Lock
- Smart Thermostat
- Network Router

Resimercial:
- Commercial Security Panel
- NVR (8-16 Channel)
- Access Control Panel (4-8 Door)
- Card Reader
- PoE Switch (8-24 Port)

Commercial & Industrial:
- Enterprise NVR (32+ Channel)
- Access Control System (16+ Door)
- Intercom System
- Network Switch (48 Port)
- Structured Cabling System
- UPS (Network)
```

### 5.4 Low Voltage Assets to Create (60 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 25 | 10 security panels, 8 cameras, 7 smart devices |
| Resimercial | 15 | 5 NVRs, 5 access systems, 5 network |
| C&I | 15 | 8 enterprise systems, 4 intercoms, 3 network |
| Industrial | 5 | 3 large access systems, 2 enterprise NVR |

---

## Phase 6: Fire & Safety Completion

**Status:** 70% Ready
**Lead:** Patricia Williams
**Timeline:** 2 days

### 6.1 What's Already Done
- ✅ Service Plans: 6 commercial plans (NFPA 25, alarm, suppression, pump, standpipe, extinguisher)
- ✅ Automations: 5 rules (NFPA 25 scheduling, deficiency follow-up, AHJ report, annual reminder, audit)
- ✅ Templates: 5 YAML files
- ✅ Catalog: 76 items

### 6.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Create GTM Vertical: `fire_safety.json` | High | 3 hrs |
| Create residential fire safety service plan | High | 1 hr |
| Add residential templates | Medium | 2 hrs |
| Add NFPA 101 Life Safety automation | Medium | 2 hrs |
| Add emergency lighting inspection template | Low | 1 hr |
| Add evacuation plan documentation | Low | 1 hr |

### 6.3 Fire & Safety Asset Types (15 types)
```
Residential:
- Smoke Detector (Battery)
- Smoke Detector (Hardwired)
- CO Detector
- Fire Extinguisher (Residential)

Resimercial:
- Fire Alarm Panel (Conventional)
- Sprinkler System (Residential)
- Kitchen Hood Suppression

Commercial & Industrial:
- Fire Alarm Panel (Addressable)
- Sprinkler System (Commercial)
- Fire Pump
- Standpipe System
- Clean Agent Suppression
- Emergency Lighting
- Exit Signs
- Fire Extinguisher (Commercial)
```

### 6.4 Fire & Safety Assets to Create (55 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 15 | 8 smoke/CO, 5 extinguishers, 2 sprinkler |
| Resimercial | 15 | 5 alarm panels, 5 hood systems, 5 sprinkler |
| C&I | 20 | 8 addressable panels, 6 sprinkler, 4 pumps, 2 clean agent |
| Industrial | 5 | 2 large systems, 2 pumps, 1 standpipe |

---

## Phase 7: Solar/Energy Completion

**Status:** 95% Ready
**Lead:** Jennifer Lee
**Timeline:** 1 day

### 7.1 What's Already Done
- ✅ GTM Vertical: `solar_epc.json`
- ✅ Installation Workflow: 9 phases
- ✅ Service Plans: 5 plans
- ✅ Automations: 4 rules
- ✅ Templates: 10 YAML files
- ✅ Catalog: 69 items

### 7.2 Remaining Work
| Task | Priority | Effort |
|------|----------|--------|
| Add battery storage service plan | Medium | 1 hr |
| Add utility interconnection workflow | Medium | 2 hrs |
| Add NEM rules engine by state | Low | 3 hrs |

### 7.3 Solar Asset Types (15 types)
```
Residential:
- PV Array (Residential)
- String Inverter (Residential)
- Microinverter System
- Battery Storage (Residential)
- EV Charger (Level 2)
- Solar + Storage System

Resimercial:
- PV Array (Commercial)
- String Inverter (Commercial)
- Carport Solar System

Commercial & Industrial:
- PV Array (C&I)
- Central Inverter
- Battery Storage (Commercial)
- EV Charging Station (DC Fast)

Utility:
- Utility-Scale PV Array
- Battery Energy Storage System (Utility)
```

### 7.4 Solar Assets to Create (50 assets)
| Segment | Count | Examples |
|---------|-------|----------|
| Residential | 20 | 12 PV arrays, 5 batteries, 3 EV chargers |
| Resimercial | 10 | 5 commercial PV, 3 carport, 2 batteries |
| C&I | 12 | 6 large PV, 4 batteries, 2 DC fast |
| Utility | 8 | 5 utility-scale PV, 3 BESS |

---

## Asset Summary by Segment

### Total: 500 Assets

| Segment | HVAC | Elec | Plumb | Roof | LV | Fire | Solar | Total |
|---------|------|------|-------|------|-----|------|-------|-------|
| Residential | 30 | 25 | 25 | 20 | 25 | 15 | 20 | **160** |
| Resimercial | 15 | 15 | 10 | 8 | 15 | 15 | 10 | **88** |
| C&I | 20 | 20 | 10 | 10 | 15 | 20 | 12 | **107** |
| Industrial | 10 | 10 | 5 | 2 | 5 | 5 | 8 | **45** |
| **Total** | **75** | **70** | **50** | **40** | **60** | **55** | **50** | **500** |

---

## Equipment Types Expansion

### Current: 19 types → Target: 125 types

| Trade | Current | Adding | Total |
|-------|---------|--------|-------|
| HVAC | 11 | 14 | 25 |
| Electrical | 2 | 18 | 20 |
| Plumbing | 3 | 15 | 18 |
| Roofing | 0 | 12 | 12 |
| Low Voltage | 0 | 20 | 20 |
| Fire & Safety | 3 | 12 | 15 |
| Solar | 0 | 15 | 15 |
| **Total** | **19** | **106** | **125** |

---

## Implementation Order

### Week 1
1. ✅ **HVAC** (95% → 100%) - 1 day
2. **Electrical** (60% → 100%) - 2 days

### Week 2
3. **Plumbing** (50% → 100%) - 2 days
4. **Roofing** (70% → 100%) - 2 days

### Week 3
5. **Low Voltage** (40% → 100%) - 3 days
6. **Fire & Safety** (70% → 100%) - 2 days

### Week 4
7. **Solar** (95% → 100%) - 1 day
8. **Asset Seeding** - 500 assets - 3 days
9. **Testing & Verification** - 1 day

---

## Files to Create/Modify

### GTM Verticals (4 new)
- [ ] `config/gtm_verticals/electrical.json`
- [ ] `config/gtm_verticals/plumbing.json`
- [ ] `config/gtm_verticals/low_voltage.json`
- [ ] `config/gtm_verticals/fire_safety.json`

### Workflows (4 new)
- [ ] `config/project-workflows/electrical-installation-workflow.json`
- [ ] `config/project-workflows/plumbing-installation-workflow.json`
- [ ] `config/project-workflows/low-voltage-installation-workflow.json`
- [ ] `config/project-workflows/fire-safety-installation-workflow.json`

### Templates (20+ new)
- [ ] `templates/roofing/` (10 new templates)
- [ ] `templates/low-voltage/` (8 new templates)
- [ ] `templates/plumbing/` (2 new templates)

### Asset Data
- [ ] `scripts/data/assets/hvac-assets.json` (75 assets)
- [ ] `scripts/data/assets/electrical-assets.json` (70 assets)
- [ ] `scripts/data/assets/plumbing-assets.json` (50 assets)
- [ ] `scripts/data/assets/roofing-assets.json` (40 assets)
- [ ] `scripts/data/assets/low-voltage-assets.json` (60 assets)
- [ ] `scripts/data/assets/fire-safety-assets.json` (55 assets)
- [ ] `scripts/data/assets/solar-assets.json` (50 assets)
- [ ] `scripts/data/equipment-types.json` (125 types)

### API Enhancement
- [ ] Update `EQUIPMENT_TYPES` in assets route (19 → 125)
- [ ] Add bulk asset import endpoint
- [ ] Add asset filtering by trade/segment

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Catalog Items | 570 | 570 ✅ |
| Equipment Types | 19 | 125 |
| Demo Assets | 59 | 500+ |
| GTM Verticals | 4 | 8 |
| Installation Workflows | 3 | 7 |
| Service Plans | 50+ | 60+ |
| Templates | 45 | 75+ |
| Trade Coverage | 70% | 100% |

---

## Next Steps

1. **Approve this plan** - Review and confirm priorities
2. **Start HVAC completion** - Already 95% ready
3. **Move to Electrical** - Biggest gap to close
4. **Continue through trades** - Plumbing → Roofing → LV → Fire
5. **Seed 500+ assets** - After all trades complete
6. **Final verification** - RALPH audit of complete instance
