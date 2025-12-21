# Coperniq MEP Template Inventory

**Updated**: 2025-12-21
**Status**: 10-12 Hour Sprint Active

---

## Summary

| Metric | Count |
|--------|-------|
| YAML Specs Ready | 60 |
| Built in Coperniq | 52+ |
| Gap | ~24 |
| Target (Sprint) | 76 |

**Last Audit**: Dec 21, 2025 - Major progress made on Field Work Orders, Office Work Orders complete

---

## By Trade

| Trade | YAML Specs | Built in Coperniq | Gap | Priority |
|-------|------------|-------------------|-----|----------|
| HVAC | 10 | 1 | 9 | P0 |
| Solar | 10 | 0 | 10 | P1 |
| Plumbing | 6 | 0 | 6 | P1 |
| Electrical | 6 | 0 | 6 | P1 |
| Fire Protection | 5 | 0 | 5 | P2 |
| Controls | 5 | 0 | 5 | P2 |
| Service Plans | 4 | 0 | 4 | P1 |
| TUD Market | 8 | 0 | 8 | P2 |
| Low Voltage | 2 | 0 | 2 | P3 |
| Roofing | 1 | 0 | 1 | P3 |
| General Contractor | 1 | 0 | 1 | P3 |
| Work Orders | 2 | 0 | 2 | P0 |
| **TOTAL** | **60** | **~1** | **59** | - |

---

## By Type (Process Studio)

| Type | Built | Target | Remaining |
|------|-------|--------|-----------|
| Field Work Orders | 14 | 21 | 7 |
| Office Work Orders | 14 | 14 | 0 |
| Forms | 12 | 15 | 3 |
| Payment Structures | 8 | 8 | 0 |
| Project Workflows | 6 | 6 | 0 |
| Request Workflows | 5 | 5 | 0 |
| Automations | 2 | 12 | 10 |
| **TOTAL** | **61** | **81** | **20** |

### Field Work Orders Built (Dec 21)
1. HVAC Emergency Restart
2. Emergency Commercial Refrigeration
3. Emergency Medical Equipment Priority
4. Panel Surge Damage Assessment
5. Battery Backup Assessment
6. Transfer Switch Installation
7. Emergency Generator Fast-Track Installation
8. Emergency Generator Service During Power Outage
9. Electrical Panel Upgrade Work Order - 200A Service Upgrade
10. Ductwork Inspection and Leak Testing
11. Water Heater Installation Work Order
12. [MEP] Furnace Safety Check
13. AC Maintenance Visit
14. HVAC System Startup and Commissioning

---

## Sprint Checklist

### Hour 1-3: Field Work Orders (7 remaining)
- [x] Electrical Panel Upgrade (built: "Electrical Panel Upgrade Work Order - 200A Service Upgrade")
- [x] Generator Installation (built: "Emergency Generator Fast-Track Installation")
- [ ] EV Charger Install
- [ ] Ductless Mini-Split Install
- [x] Water Heater Replacement (built: "Water Heater Installation Work Order")
- [ ] Backflow Test & Cert
- [ ] Fire Sprinkler Inspection
- [ ] Grease Trap Service
- [ ] Roof Leak Repair
- [ ] Emergency Plumbing

### Hour 3-4: Emergency Forms (3)
- [ ] Outage Impact Assessment
- [ ] Generator Rental Agreement
- [ ] Post-Outage Safety Checklist

### Hour 4-6: Automations (10)
- [ ] Lead Assignment
- [ ] Quote to Job
- [ ] Job to Invoice
- [ ] Payment Update
- [ ] Permit to Install
- [ ] Emergency WO
- [ ] PM Ticket
- [ ] Portal Welcome
- [ ] Review Alert
- [ ] Renewal Reminder

### Hour 6-7: HVAC Templates (9)
- [ ] Furnace Safety Inspection
- [ ] Refrigerant Tracking Log
- [ ] Lead Intake Form
- [ ] Site Survey - Residential
- [ ] Equipment Proposal
- [ ] Job Planning Worksheet
- [ ] Duct Design Worksheet
- [ ] System Commissioning
- [ ] Maintenance Report

### Hour 7-8: Solar Templates (10)
- [ ] Solar Site Assessment
- [ ] Solar Proposal Builder
- [ ] Commercial Solar Audit
- [ ] Shade Analysis Report
- [ ] Battery Storage Installation
- [ ] System Commissioning
- [ ] Panel Installation Checklist
- [ ] Interconnection Request
- [ ] System Maintenance
- [ ] Roof Mount Assessment

### Hour 8-9: Plumbing (6) + Electrical (6)
**Plumbing:**
- [ ] Backflow Test Report
- [ ] Drain Camera Inspection
- [ ] Water Heater Inspection
- [ ] Gas Line Inspection
- [ ] New Construction Rough-In
- [ ] Service Call Template

**Electrical:**
- [ ] Panel Inspection Report
- [ ] Circuit Load Analysis
- [ ] EV Charger Installation
- [ ] Standby Generator Installation
- [ ] Grounding System Test
- [ ] Arc Flash Survey

### Hour 9-10: Fire Protection (5) + Controls (5)
**Fire Protection:**
- [ ] Sprinkler System Inspection
- [ ] Fire Extinguisher Inspection
- [ ] Alarm System Inspection
- [ ] Suppression System Inspection
- [ ] Emergency Egress Lighting

**Controls:**
- [ ] Point Verification Checklist
- [ ] Sequence of Operations
- [ ] Trend Data Analysis
- [ ] Alarm Management Review
- [ ] Energy Dashboard Setup

### Hour 10-11: Service Plans (4) + TUD Market (8)
**Service Plans:**
- [ ] HVAC Bronze Plan
- [ ] HVAC Silver Plan
- [ ] HVAC Gold Plan
- [ ] Plumbing Protect Plan

**TUD Market:**
- [ ] Residential Energy Audit
- [ ] Heat Pump Installation
- [ ] Weatherization Assessment
- [ ] Insulation Installation
- [ ] Window Replacement
- [ ] Duct Sealing
- [ ] Water Conservation Audit
- [ ] Residential EV Charger

### Hour 11-12: Cleanup
- [ ] Archive 22 duplicate templates
- [ ] Final audit count verification

---

## Compliance Requirements

### EPA 608 (HVAC)
- Refrigerant type, amount
- Technician cert number
- Leak rate calculations
- 3-year records

### NFPA 25 (Fire Protection)
- Quarterly inspections
- Annual drain flow test
- Inspector license

### NEC (Electrical)
- Voltage/amp measurements
- Ground fault testing
- Load calculations

### SREC (Solar)
| State | Rate | Duration |
|-------|------|----------|
| NJ | $85/SREC | 15 years |
| MD | $70-73/SREC | 15 years |
| DC | $400-480/SREC | 5 years |
| DE | $30→$10/SREC | 20 years |

---

## File Locations

**YAML Specs**: `/coperniq-mep-templates/templates/`
- `/templates/hvac/` (10 files)
- `/templates/solar/` (10 files)
- `/templates/plumbing/` (6 files)
- `/templates/electrical/` (6 files)
- `/templates/fire_protection/` (5 files)
- `/templates/controls/` (5 files)
- `/templates/service_plans/` (4 files)
- `/templates/tud_market/` (8 files)
- `/templates/low_voltage/` (2 files)
- `/templates/roofing/` (1 file)
- `/templates/general_contractor/` (1 file)
- `/templates/work_orders/` (2 files)

**Research Archive**:
- `bug-hive/MEP_TEMPLATE_SPEC.md` - 31KB detailed specs
- `bug-hive/COPERNIQ_SCHEMA.md` - GraphQL types
- `coperniq-mep-templates/docs/compliance/*.md` - State compliance
- `coperniq-mep-templates/docs/incentives/*.md` - Incentive programs
