# Quick Build Reference - Coperniq Process Studio

**Updated**: 2025-12-21
**Purpose**: Fast manual template building while Playwright is locked

---

## Remaining Field Work Orders (7)

### 1. EV Charger Install
**YAML**: `templates/electrical/ev_charger_install.yaml`
**Work Order Type**: [MEP] Electrical Service Call
**Compliance**: NEC Article 625

| Group | Fields |
|-------|--------|
| Charger Information | Charger Type (L1/L2/DC Fast), Manufacturer, Model, Serial, Power Rating, Amperage |
| Site Assessment | Location, Distance to Panel, Conduit Path |
| Electrical Requirements | Service Size, Panel Capacity, Breaker Size, Wire Size, GFCI Protection |
| Commissioning | Voltage Test, Ground Continuity, GFCI Test, Full Load Test |
| Documentation | Photos, Customer Training, Warranty Reg, Notes |

---

### 2. Ductless Mini-Split Install
**Work Order Type**: [MEP] HVAC Service Call
**Compliance**: EPA 608

| Group | Fields |
|-------|--------|
| Equipment Info | Brand, Model, BTU Rating, Indoor Units (#), Outdoor Units (#) |
| Mounting | Indoor Unit Height, Wall Type, Line Set Length |
| Electrical | Breaker Size, Wire Gauge, Disconnect Type |
| Refrigerant | Charge (lbs/oz), Type (R-410A), Pressures (High/Low) |
| Commissioning | Temp In/Out, Airflow (CFM), Amp Draw |
| Documentation | Photos, Manual Left, Warranty Registered |

---

### 3. Backflow Test & Cert
**YAML**: `templates/plumbing/backflow_test_report.yaml`
**Work Order Type**: [MEP] Plumbing Service Call
**Compliance**: State regulations

| Group | Fields |
|-------|--------|
| Device Info | Serial #, Type (DCVA/RPBA/PVB), Manufacturer, Size, Location, Hazard Level |
| CV1 Test | Opened At (PSI), Held Tight (Y/N), Pass/Fail |
| CV2 Test | Opened At (PSI), Held Tight (Y/N), Pass/Fail |
| Relief Valve | Opened At (PSI), Did Not Open (Y/N), Pass/Fail |
| Certification | Overall Result, Tester Name, Cert #, Gauge Serial, Signature |

---

### 4. Fire Sprinkler Inspection
**YAML**: `templates/fire_protection/sprinkler_inspection.yaml`
**Work Order Type**: [MEP] Fire Protection Service Call
**Compliance**: NFPA 25

| Group | Fields |
|-------|--------|
| System Info | Building/Location, Type (Wet/Dry/Pre-Action), Manufacturer, Coverage Area, Head Count, Last Inspection |
| Visual Inspection | Heads Condition, 18" Clearance, Spare Heads, Wrench, Escutcheons |
| Control Valves | Main Valve (Open/Sealed), Supervisory Switch, OS&Y Threads, Signage |
| Gauges & Devices | System Pressure (PSI), Gauge Condition, Waterflow Switch, Tamper Switch |
| Fire Dept Connection | FDC Accessible, Caps Present, Signage, Clapper Valves |
| Certification | Status (Pass/Fail), Deficiencies, Inspector Name, License #, Signature, Next Due |

---

### 5. Grease Trap Service
**Work Order Type**: [MEP] Plumbing Service Call
**Compliance**: Health department regulations

| Group | Fields |
|-------|--------|
| Trap Info | Size (gallons), Location, Type (Indoor/Outdoor), Last Service Date |
| Inspection | Grease Level (%), Condition, Inlet Clear, Outlet Clear |
| Service Performed | Pumped (Y/N), Cleaned (Y/N), Waste Hauled (gallons), Manifest # |
| Compliance | FOG Level (pass <25%), Baffle Condition, T-Bar Condition |
| Certification | Tech Name, License #, Next Service Date, Photos |

---

### 6. Roof Leak Repair
**Work Order Type**: [MEP] General Service Call

| Group | Fields |
|-------|--------|
| Leak Info | Location (Roof Area), Severity (Minor/Major/Emergency), First Noticed |
| Assessment | Roof Type (Shingle/Tile/Flat/Metal), Age (years), Previous Repairs (Y/N) |
| Diagnosis | Cause (Flashing/Vent Boot/Shingle Damage/Debris/Ponding), Access Method |
| Repair | Material Used, Repair Type (Patch/Replace Section/Sealant), Area (sq ft) |
| Documentation | Before Photos, After Photos, Warranty (days), Notes |

---

### 7. Emergency Plumbing
**Work Order Type**: [MEP] Emergency Plumbing Call
**Priority**: Emergency/24-7

| Group | Fields |
|-------|--------|
| Emergency Info | Issue Type (Burst Pipe/Flood/No Water/Sewage), Severity (1-5), Water Shut Off (Y/N) |
| Initial Assessment | Arrival Time, Water Damage Present, Mitigation Started |
| Repair | Parts Used, Labor (hours), Temporary Fix (Y/N), Permanent Fix Needed |
| Documentation | Before Photos, After Photos, Customer Signature, Follow-up Needed |

---

## Emergency Response Forms (3)

### 1. Outage Impact Assessment
| Group | Fields |
|-------|--------|
| Situation | Outage Type (Power/Gas/Water), Duration (hours), Customer Count Affected |
| Impact | Equipment at Risk, Perishables, Medical Equipment, Business Loss ($) |
| Priority | Priority Level (1-5), Response Type (Emergency/Standard), ETA |

### 2. Generator Rental Agreement
| Group | Fields |
|-------|--------|
| Equipment | Generator Size (kW), Fuel Type, Daily Rate, Deposit |
| Terms | Start Date, End Date, Fuel Responsibility, Maintenance Included |
| Customer | Name, Address, Contact, Payment Method, Signature |

### 3. Post-Outage Safety Checklist
| Group | Fields |
|-------|--------|
| Electrical | Panel Checked, Surge Damage, Appliances Tested |
| HVAC | System Restart, Refrigerant Check, Thermostat Set |
| Plumbing | Water Pressure, Leaks Checked, Water Heater Reset |
| Documentation | All Clear (Y/N), Recommendations, Customer Signature |

---

## Automations (10)

| # | Automation | Trigger | Action |
|---|------------|---------|--------|
| 1 | Lead Assignment | New Lead Created | Assign to Sales Rep by Territory |
| 2 | Quote to Job | Quote Approved | Create Job + Schedule Install |
| 3 | Job to Invoice | Job Marked Complete | Generate Invoice + Send to Customer |
| 4 | Payment Update | Invoice Paid | Update Job Status + Send Receipt |
| 5 | Permit to Install | Permit Approved | Schedule Installation Date |
| 6 | Emergency WO | Equipment Failure Detected | Create Emergency Work Order |
| 7 | PM Ticket | PM Due Date Reached | Create PM Service Ticket |
| 8 | Portal Welcome | New Customer Signup | Send Welcome Email + Setup Guide |
| 9 | Review Alert | Negative Review (<3 stars) | Alert Manager + Create Follow-up Task |
| 10 | Renewal Reminder | Contract 30 Days to Expire | Send Renewal Email + Create Task |

---

## Compliance Quick Reference

### EPA 608 (Refrigerant - HVAC)
- Refrigerant type (R-410A, R-22, etc.)
- Amount added/recovered (lbs/oz)
- Technician EPA cert number
- Leak rate calculations
- 3-year record retention

### NFPA 25 (Fire Protection)
- Quarterly visual inspections
- Annual main drain flow test
- 5-year internal pipe inspection
- Inspector state license number

### NEC Article 625 (EV Chargers)
- GFCI protection required
- Dedicated circuit
- Proper wire sizing (AWG)
- 240V ±5% at charger

### State Backflow Requirements
- Annual testing required
- Certified tester only
- Report to water authority within 10 days
- Test gauge calibration current

---

## Field Types in Coperniq Form Builder

| Type | Icon | Use Case |
|------|------|----------|
| Text | `Aa` | Names, notes, serial numbers |
| Numeric | `123` | Measurements, readings, PSI |
| Single select | `○` | Yes/No, status, Pass/Fail |
| Multiple select | `☑` | Multiple deficiencies |
| File | `📎` | Photos, signatures, documents |
| Group | `⊞` | Section headers |

---

## Process Studio URLs

- **Field Work Orders**: https://app.coperniq.io/112/company/studio/templates/field-wo-templates
- **Office Work Orders**: https://app.coperniq.io/112/company/studio/templates/office-wo-templates
- **Forms**: https://app.coperniq.io/112/company/studio/templates/form-templates
- **Automations**: https://app.coperniq.io/112/company/studio/automation

---

*Use this reference for fast manual building in Coperniq Process Studio*
