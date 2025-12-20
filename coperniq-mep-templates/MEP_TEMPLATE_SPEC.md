# MEP Template Specification for Coperniq

**Date:** 2025-12-20
**Author:** ai-development-cockpit
**Target Platform:** Coperniq (CompanyId: 112)

---

## Executive Summary

This document specifies MEP (Mechanical, Electrical, Plumbing) templates to be built directly INTO Coperniq. Based on deep reverse-engineering of Coperniq's GraphQL schema and UI, we now have complete understanding of how to seed industry-specific templates.

**Key Discovery:** Coperniq's GraphQL API is read-only via introspection, but mutations work through the UI. Templates must be created via the Process Studio interface or by replicating the exact API calls the frontend makes.

---

## Coperniq Architecture Summary

### API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `https://coperniq.dev/project-service/graphql` | Main GraphQL (POST) |
| `https://coperniq.dev/project-service/graphql-read` | Read-only queries |
| `https://coperniq.dev/user-service/companies?companyId=112` | Company info |
| `https://coperniq.dev/user-service/roles/rules?companyId=112` | Permissions |

### Authentication
```javascript
// JWT stored in localStorage as JSON object
const tokenData = JSON.parse(localStorage.getItem('token'));
const jwt = tokenData.accessToken.token;
// Use in header: Authorization: Bearer ${jwt}
```

### Company Settings Structure (Process Studio)
```
/112/company/
├── general                    # Company info
├── roles                      # Role permissions
├── users                      # Team members
├── teams                      # Team groups
├── notifications              # Notification settings
├── emails-and-phones          # Communication channels
├── properties/
│   ├── client                 # Client custom fields
│   ├── request                # Request custom fields
│   └── project                # Project custom fields (100+ available)
├── studio/
│   ├── workflows/
│   │   ├── project-workflows  # Project stage workflows
│   │   └── request-workflows  # Request stage workflows
│   └── templates/
│       ├── field-wo-templates     # Field Work Order templates
│       ├── office-wo-templates    # Office Work Order templates
│       ├── form-templates         # Form/Checklist templates ★
│       ├── payment-structure-templates
│       └── document-request-templates
├── labels                     # Tag taxonomy
├── catalog                    # Product/service catalog
├── service-plans              # PM agreement templates ★
├── systems                    # Monitored systems
├── geolocation                # Territory settings
├── integrations               # Third-party connections
└── portal                     # Customer portal settings
```

### Form Builder Field Types
| Type | Description | Use Case |
|------|-------------|----------|
| Text | Free-form text input | Notes, descriptions |
| Numeric | Number input | Measurements, counts |
| Single select | Radio/dropdown | Status, type selection |
| Multiple select | Checkboxes | Multi-option checklists |
| File | File upload | Photos, documents |
| Group | Field grouping | Organize related fields |

### Naming Conventions (Observed)
- `[BP]` prefix = Blueprint/Template
- `(Coperniq)` suffix = Company-specific
- Emoji prefixes for visual categorization:
  - 📞 = Calls/Communication
  - 🏢 = Permitting/AHJ
  - 🛠️ = Service/Field work
  - 🔍 = Quality Control
  - 🌞 = Installation/Solar

---

## MEP Template Package

### Phase 1: HVAC Templates

#### 1.1 Form Templates (Inspection Checklists)

**[MEP] AC System Inspection Checklist**
```yaml
name: "[MEP] 🌡️ AC System Inspection"
fields:
  - group: "Equipment Information"
    fields:
      - name: "Unit Make/Model"
        type: Text
        required: true
      - name: "Serial Number"
        type: Text
        required: true
      - name: "Tonnage/BTU"
        type: Numeric
      - name: "Refrigerant Type"
        type: Single select
        options: ["R-410A", "R-22", "R-32", "R-134a", "Other"]

  - group: "Electrical Checks"
    fields:
      - name: "Voltage Reading (V)"
        type: Numeric
      - name: "Amp Draw - Compressor"
        type: Numeric
      - name: "Amp Draw - Fan Motor"
        type: Numeric
      - name: "Capacitor Test"
        type: Single select
        options: ["Pass", "Fail", "N/A"]
      - name: "Contactor Condition"
        type: Single select
        options: ["Good", "Worn", "Replace"]

  - group: "Refrigerant System"
    fields:
      - name: "Suction Pressure (PSI)"
        type: Numeric
      - name: "Head Pressure (PSI)"
        type: Numeric
      - name: "Subcooling (°F)"
        type: Numeric
      - name: "Superheat (°F)"
        type: Numeric
      - name: "Refrigerant Added (oz)"
        type: Numeric
      - name: "Leak Found"
        type: Single select
        options: ["No Leak", "Minor Leak", "Major Leak"]

  - group: "Airflow & Filtration"
    fields:
      - name: "Filter Size"
        type: Text
      - name: "Filter Condition"
        type: Single select
        options: ["Clean", "Dirty", "Very Dirty", "Replaced"]
      - name: "Supply Temp (°F)"
        type: Numeric
      - name: "Return Temp (°F)"
        type: Numeric
      - name: "Delta T (°F)"
        type: Numeric

  - group: "Coils & Drain"
    fields:
      - name: "Evaporator Coil Condition"
        type: Single select
        options: ["Clean", "Dirty", "Cleaned"]
      - name: "Condenser Coil Condition"
        type: Single select
        options: ["Clean", "Dirty", "Cleaned"]
      - name: "Drain Line Clear"
        type: Single select
        options: ["Yes", "No - Treated", "No - Needs Service"]

  - group: "Documentation"
    fields:
      - name: "Before Photos"
        type: File
      - name: "After Photos"
        type: File
      - name: "Technician Notes"
        type: Text
      - name: "Recommendations"
        type: Text
      - name: "Customer Signature"
        type: File
```

**[MEP] Furnace Safety Inspection**
```yaml
name: "[MEP] 🔥 Furnace Safety Inspection"
fields:
  - group: "Equipment Information"
    fields:
      - name: "Unit Make/Model"
        type: Text
        required: true
      - name: "Serial Number"
        type: Text
        required: true
      - name: "BTU Input"
        type: Numeric
      - name: "Fuel Type"
        type: Single select
        options: ["Natural Gas", "Propane", "Oil", "Electric"]
      - name: "Age (Years)"
        type: Numeric

  - group: "Safety Checks"
    fields:
      - name: "CO Reading (PPM)"
        type: Numeric
        required: true
      - name: "Gas Leak Test"
        type: Single select
        options: ["Pass", "Fail - Repaired", "Fail - Condemned"]
        required: true
      - name: "Heat Exchanger Visual"
        type: Single select
        options: ["Good", "Crack Suspected", "Crack Confirmed"]
        required: true
      - name: "Flame Rollout Check"
        type: Single select
        options: ["Pass", "Fail"]
      - name: "Limit Switch Test"
        type: Single select
        options: ["Pass", "Fail", "Replaced"]

  - group: "Ignition System"
    fields:
      - name: "Ignition Type"
        type: Single select
        options: ["Hot Surface", "Spark", "Pilot"]
      - name: "Ignitor Condition"
        type: Single select
        options: ["Good", "Cracked", "Replaced"]
      - name: "Flame Sensor Reading (μA)"
        type: Numeric
      - name: "Flame Sensor Status"
        type: Single select
        options: ["Good", "Cleaned", "Replaced"]

  - group: "Combustion Analysis"
    fields:
      - name: "Stack Temp (°F)"
        type: Numeric
      - name: "O2 (%)"
        type: Numeric
      - name: "CO2 (%)"
        type: Numeric
      - name: "Efficiency (%)"
        type: Numeric
      - name: "Draft Reading"
        type: Numeric

  - group: "Blower & Electrical"
    fields:
      - name: "Blower Motor Amps"
        type: Numeric
      - name: "Blower Wheel Clean"
        type: Single select
        options: ["Yes", "No - Cleaned", "No - Needs Cleaning"]
      - name: "Capacitor Test"
        type: Single select
        options: ["Good", "Weak", "Replaced"]
      - name: "All Wiring Secure"
        type: Single select
        options: ["Yes", "No - Repaired"]

  - group: "Documentation"
    fields:
      - name: "Photos"
        type: File
      - name: "Combustion Analyzer Reading Photo"
        type: File
      - name: "Recommendations"
        type: Text
      - name: "Customer Signature"
        type: File
```

**[MEP] Refrigerant Tracking Log (EPA 608)**
```yaml
name: "[MEP] ❄️ Refrigerant Tracking Log"
fields:
  - group: "Equipment Identification"
    fields:
      - name: "Equipment Tag/ID"
        type: Text
        required: true
      - name: "Equipment Type"
        type: Single select
        options: ["Split System", "Package Unit", "Chiller", "Reach-In", "Walk-In", "Other"]
      - name: "Refrigerant Type"
        type: Single select
        options: ["R-410A", "R-22", "R-404A", "R-134a", "R-407C", "R-32", "Other"]
        required: true
      - name: "Factory Charge (lbs)"
        type: Numeric

  - group: "Service Details"
    fields:
      - name: "Service Date"
        type: Text
      - name: "Technician Name"
        type: Text
        required: true
      - name: "EPA Certification #"
        type: Text
        required: true
      - name: "Service Type"
        type: Single select
        options: ["Installation", "Service", "Repair", "Recovery", "Retrofit", "Disposal"]

  - group: "Refrigerant Transaction"
    fields:
      - name: "Refrigerant Added (lbs)"
        type: Numeric
      - name: "Refrigerant Recovered (lbs)"
        type: Numeric
      - name: "Cylinder ID"
        type: Text
      - name: "Running Total Charge (lbs)"
        type: Numeric

  - group: "Leak Information"
    fields:
      - name: "Leak Found"
        type: Single select
        options: ["No", "Yes - Repaired", "Yes - Scheduled Repair"]
      - name: "Leak Location"
        type: Text
      - name: "Leak Rate Calculation"
        type: Numeric
      - name: "Exceeds EPA Threshold"
        type: Single select
        options: ["No", "Yes"]

  - group: "Documentation"
    fields:
      - name: "Technician Signature"
        type: File
      - name: "Notes"
        type: Text
```

#### 1.2 Task Templates (Work Orders)

**[MEP] 🛠️ HVAC Service Call**
```yaml
name: "[MEP] 🛠️ HVAC Service Call"
isField: true  # Field work order
fields:
  - "Customer complaint"
  - "Equipment type"
  - "Diagnosis"
  - "Parts used"
  - "Labor hours"
  - "Before/after photos"
  - "Customer signature"
linkedForms:
  - "[MEP] 🌡️ AC System Inspection"
  - "[MEP] 🔥 Furnace Safety Inspection"
```

**[MEP] 📋 HVAC PM Visit**
```yaml
name: "[MEP] 📋 HVAC PM Visit"
isField: true
description: "Preventive maintenance visit for HVAC systems"
fields:
  - "Equipment list"
  - "Season (Heating/Cooling)"
  - "Checklist completion"
  - "Filter replacement"
  - "Recommendations"
  - "Next visit scheduling"
linkedForms:
  - "[MEP] 🌡️ AC System Inspection"
  - "[MEP] 🔥 Furnace Safety Inspection"
```

---

### Phase 2: Plumbing Templates

#### 2.1 Form Templates

**[MEP] 🚿 Backflow Test Report**
```yaml
name: "[MEP] 🚿 Backflow Test Report"
fields:
  - group: "Device Information"
    fields:
      - name: "Serial Number"
        type: Text
        required: true
      - name: "Device Type"
        type: Single select
        options: ["DCVA", "RPBA", "PVB", "SVBA", "AVB"]
        required: true
      - name: "Manufacturer"
        type: Text
      - name: "Size (inches)"
        type: Single select
        options: ["3/4", "1", "1-1/4", "1-1/2", "2", "2-1/2", "3", "4", "6", "8"]
      - name: "Location"
        type: Text
      - name: "Hazard Level"
        type: Single select
        options: ["High", "Low"]

  - group: "Check Valve #1 Test"
    fields:
      - name: "CV1 Opened At (PSI)"
        type: Numeric
      - name: "CV1 Held Tight"
        type: Single select
        options: ["Yes", "No"]
      - name: "CV1 Pass/Fail"
        type: Single select
        options: ["Pass", "Fail"]

  - group: "Check Valve #2 Test"
    fields:
      - name: "CV2 Opened At (PSI)"
        type: Numeric
      - name: "CV2 Held Tight"
        type: Single select
        options: ["Yes", "No"]
      - name: "CV2 Pass/Fail"
        type: Single select
        options: ["Pass", "Fail"]

  - group: "Relief Valve Test (RPBA only)"
    fields:
      - name: "RV Opened At (PSI)"
        type: Numeric
      - name: "RV Did Not Open"
        type: Single select
        options: ["Opened Properly", "Did Not Open"]
      - name: "RV Pass/Fail"
        type: Single select
        options: ["Pass", "Fail", "N/A"]

  - group: "Certification"
    fields:
      - name: "Overall Result"
        type: Single select
        options: ["Pass", "Fail - Repaired & Passed", "Fail - Replace Recommended"]
        required: true
      - name: "Tester Name"
        type: Text
        required: true
      - name: "Certification Number"
        type: Text
        required: true
      - name: "Test Gauge Serial"
        type: Text
      - name: "Tester Signature"
        type: File
```

**[MEP] 📹 Camera Inspection Report**
```yaml
name: "[MEP] 📹 Drain Camera Inspection"
fields:
  - group: "Job Information"
    fields:
      - name: "Line Type"
        type: Single select
        options: ["Main Sewer", "Kitchen", "Bathroom", "Floor Drain", "Storm", "Other"]
      - name: "Pipe Material"
        type: Single select
        options: ["Cast Iron", "PVC", "ABS", "Clay", "Orangeburg", "Concrete", "Unknown"]
      - name: "Pipe Size (inches)"
        type: Text
      - name: "Access Point"
        type: Text

  - group: "Inspection Findings"
    fields:
      - name: "Line Condition"
        type: Single select
        options: ["Good", "Fair", "Poor", "Failed"]
      - name: "Root Intrusion"
        type: Single select
        options: ["None", "Minor", "Moderate", "Severe"]
      - name: "Bellies/Sags"
        type: Single select
        options: ["None", "Minor", "Major"]
      - name: "Cracks/Breaks"
        type: Single select
        options: ["None", "Hairline", "Cracked", "Broken/Collapsed"]
      - name: "Buildup/Blockage"
        type: Single select
        options: ["None", "Grease", "Scale", "Debris", "Foreign Object"]
      - name: "Offset Joints"
        type: Single select
        options: ["None", "Minor", "Major"]

  - group: "Measurements"
    fields:
      - name: "Total Length Inspected (ft)"
        type: Numeric
      - name: "Problem Location 1 (ft from access)"
        type: Numeric
      - name: "Problem 1 Description"
        type: Text
      - name: "Problem Location 2 (ft from access)"
        type: Numeric
      - name: "Problem 2 Description"
        type: Text

  - group: "Documentation"
    fields:
      - name: "Video File"
        type: File
      - name: "Screenshot - Problem Areas"
        type: File
      - name: "Recommendations"
        type: Single select
        options: ["No Action Needed", "Maintenance Recommended", "Repair Required", "Replacement Required"]
      - name: "Detailed Recommendations"
        type: Text
      - name: "Customer Signature"
        type: File
```

**[MEP] 🔧 Water Heater Inspection**
```yaml
name: "[MEP] 🔧 Water Heater Inspection"
fields:
  - group: "Equipment Information"
    fields:
      - name: "Type"
        type: Single select
        options: ["Tank - Gas", "Tank - Electric", "Tankless - Gas", "Tankless - Electric", "Heat Pump"]
      - name: "Make/Model"
        type: Text
      - name: "Serial Number"
        type: Text
      - name: "Capacity (Gallons)"
        type: Numeric
      - name: "Age (Years)"
        type: Numeric
      - name: "Location"
        type: Text

  - group: "Safety Checks"
    fields:
      - name: "T&P Valve Condition"
        type: Single select
        options: ["Good", "Leaking", "Corroded", "Missing", "Replaced"]
        required: true
      - name: "T&P Discharge Pipe"
        type: Single select
        options: ["Proper", "Improper", "Missing", "Corrected"]
      - name: "Expansion Tank (if req'd)"
        type: Single select
        options: ["Good", "Waterlogged", "Missing", "N/A"]
      - name: "Gas Leak Test (gas units)"
        type: Single select
        options: ["Pass", "Fail", "N/A"]
      - name: "Venting Condition (gas units)"
        type: Single select
        options: ["Good", "Needs Repair", "N/A"]

  - group: "Performance"
    fields:
      - name: "Inlet Temp (°F)"
        type: Numeric
      - name: "Outlet Temp (°F)"
        type: Numeric
      - name: "Thermostat Setting"
        type: Numeric
      - name: "Recovery Time Adequate"
        type: Single select
        options: ["Yes", "No"]

  - group: "Maintenance"
    fields:
      - name: "Anode Rod Condition"
        type: Single select
        options: ["Good (50%+)", "Fair (25-50%)", "Replace (<25%)", "Replaced", "N/A"]
      - name: "Sediment Level"
        type: Single select
        options: ["None", "Light", "Moderate", "Heavy - Flushed"]
      - name: "Burner/Elements Condition"
        type: Single select
        options: ["Good", "Dirty - Cleaned", "Needs Service"]

  - group: "Documentation"
    fields:
      - name: "Photos"
        type: File
      - name: "Recommendations"
        type: Text
      - name: "Estimated Remaining Life (Years)"
        type: Numeric
```

---

### Phase 3: Electrical Templates

#### 3.1 Form Templates

**[MEP] ⚡ Panel Inspection Report**
```yaml
name: "[MEP] ⚡ Panel Inspection Report"
fields:
  - group: "Panel Information"
    fields:
      - name: "Panel Location"
        type: Text
      - name: "Manufacturer"
        type: Text
      - name: "Panel Type"
        type: Single select
        options: ["Main", "Sub-Panel", "Load Center", "Distribution"]
      - name: "Amperage Rating"
        type: Single select
        options: ["100A", "125A", "150A", "200A", "225A", "400A", "600A", "Other"]
      - name: "Voltage"
        type: Single select
        options: ["120/240V Single Phase", "120/208V Three Phase", "277/480V Three Phase"]
      - name: "Number of Spaces"
        type: Numeric
      - name: "Spaces Used"
        type: Numeric

  - group: "Visual Inspection"
    fields:
      - name: "Panel Cover Condition"
        type: Single select
        options: ["Good", "Damaged", "Missing Knockouts", "Rust"]
      - name: "Wiring Condition"
        type: Single select
        options: ["Good", "Overcrowded", "Damaged Insulation", "Improper Splices"]
      - name: "Labeling"
        type: Single select
        options: ["Complete", "Partial", "None/Incorrect"]
      - name: "Signs of Overheating"
        type: Single select
        options: ["None", "Discoloration", "Melted Components"]
      - name: "Evidence of Moisture"
        type: Single select
        options: ["None", "Condensation", "Water Intrusion"]

  - group: "Electrical Measurements"
    fields:
      - name: "Voltage L1-N"
        type: Numeric
      - name: "Voltage L2-N"
        type: Numeric
      - name: "Voltage L1-L2"
        type: Numeric
      - name: "Main Breaker Amps (L1)"
        type: Numeric
      - name: "Main Breaker Amps (L2)"
        type: Numeric
      - name: "Neutral-Ground Bond"
        type: Single select
        options: ["Present (Main Panel)", "Absent (Sub-Panel)", "Incorrect"]

  - group: "Grounding & Bonding"
    fields:
      - name: "Grounding Electrode Conductor"
        type: Single select
        options: ["Present & Proper", "Undersized", "Missing"]
      - name: "Bonding Jumpers"
        type: Single select
        options: ["Proper", "Missing", "N/A"]
      - name: "Ground Rod/UFER Present"
        type: Single select
        options: ["Yes", "No", "Unknown"]

  - group: "Thermal Scan (if performed)"
    fields:
      - name: "Thermal Scan Performed"
        type: Single select
        options: ["Yes", "No"]
      - name: "Hot Spots Found"
        type: Single select
        options: ["None", "Minor (<10°F rise)", "Moderate (10-25°F)", "Severe (>25°F)"]
      - name: "Thermal Image"
        type: File

  - group: "Code Violations"
    fields:
      - name: "Double-Tapped Breakers"
        type: Single select
        options: ["None", "Found - List Below"]
      - name: "Improper Breaker Types"
        type: Single select
        options: ["None", "Found - List Below"]
      - name: "Missing AFCIs (where req'd)"
        type: Single select
        options: ["Compliant", "Non-Compliant", "N/A"]
      - name: "Missing GFCIs (where req'd)"
        type: Single select
        options: ["Compliant", "Non-Compliant"]
      - name: "Violation Details"
        type: Text

  - group: "Documentation"
    fields:
      - name: "Panel Photos"
        type: File
      - name: "Recommendations"
        type: Text
      - name: "Priority Level"
        type: Single select
        options: ["Routine", "Soon", "Urgent", "Immediate"]
```

**[MEP] 🔌 Circuit Load Analysis**
```yaml
name: "[MEP] 🔌 Circuit Load Analysis"
fields:
  - group: "Service Information"
    fields:
      - name: "Service Size (Amps)"
        type: Numeric
        required: true
      - name: "Panel Amperage"
        type: Numeric
      - name: "Voltage System"
        type: Single select
        options: ["120/240V", "120/208V", "277/480V"]

  - group: "Load Calculation"
    fields:
      - name: "General Lighting Load (VA)"
        type: Numeric
      - name: "Small Appliance Circuits (VA)"
        type: Numeric
      - name: "Laundry Circuit (VA)"
        type: Numeric
      - name: "Fixed Appliances (VA)"
        type: Numeric
      - name: "HVAC Load (VA)"
        type: Numeric
      - name: "Electric Heat (VA)"
        type: Numeric
      - name: "Other Loads (VA)"
        type: Numeric
      - name: "Total Connected Load (VA)"
        type: Numeric
      - name: "Demand Load (VA)"
        type: Numeric
      - name: "Available Capacity (Amps)"
        type: Numeric

  - group: "Analysis"
    fields:
      - name: "Current Utilization (%)"
        type: Numeric
      - name: "Adequate for Proposed Load"
        type: Single select
        options: ["Yes", "No - Upgrade Required"]
      - name: "Recommendations"
        type: Text
```

---

### Phase 4: Fire Protection Templates

#### 4.1 Form Templates

**[MEP] 🔥 Sprinkler Inspection (NFPA 25)**
```yaml
name: "[MEP] 🔥 Sprinkler System Inspection"
fields:
  - group: "System Information"
    fields:
      - name: "System Type"
        type: Single select
        options: ["Wet", "Dry", "Pre-Action", "Deluge", "Standpipe"]
      - name: "Riser Location"
        type: Text
      - name: "Coverage Area (sq ft)"
        type: Numeric
      - name: "Number of Sprinkler Heads"
        type: Numeric
      - name: "Last Inspection Date"
        type: Text

  - group: "Visual Inspection"
    fields:
      - name: "Sprinkler Heads Condition"
        type: Single select
        options: ["Good", "Paint/Corrosion Found", "Damaged Heads", "Missing Heads"]
      - name: "Proper Clearance (18\" min)"
        type: Single select
        options: ["Yes", "No - Obstruction Found"]
      - name: "Escutcheons/Cover Plates"
        type: Single select
        options: ["Good", "Missing", "Damaged"]
      - name: "Spare Heads Available"
        type: Single select
        options: ["Yes (6+ heads)", "No or Insufficient"]
      - name: "Spare Head Wrench Present"
        type: Single select
        options: ["Yes", "No"]

  - group: "Control Valves"
    fields:
      - name: "Main Control Valve"
        type: Single select
        options: ["Open", "Closed", "Sealed Open"]
      - name: "Valve Supervisory Switch"
        type: Single select
        options: ["Functional", "Non-Functional", "N/A"]
      - name: "OS&Y Valve Threads"
        type: Single select
        options: ["Visible", "Not Visible"]
      - name: "Valve Signage Present"
        type: Single select
        options: ["Yes", "No"]

  - group: "Gauges & Devices"
    fields:
      - name: "System Pressure (PSI)"
        type: Numeric
      - name: "Pressure Gauge Condition"
        type: Single select
        options: ["Good", "Replace"]
      - name: "Waterflow Switch"
        type: Single select
        options: ["Tested OK", "Failed", "N/A"]
      - name: "Tamper Switch"
        type: Single select
        options: ["Tested OK", "Failed", "N/A"]

  - group: "Fire Dept Connection"
    fields:
      - name: "FDC Accessible"
        type: Single select
        options: ["Yes", "No - Obstructed"]
      - name: "FDC Caps Present"
        type: Single select
        options: ["Yes", "No/Damaged"]
      - name: "FDC Signage"
        type: Single select
        options: ["Present", "Missing/Damaged"]
      - name: "Clapper Valves"
        type: Single select
        options: ["Good", "Stuck", "Missing"]

  - group: "Certification"
    fields:
      - name: "System Status"
        type: Single select
        options: ["Pass", "Pass with Deficiencies", "Fail"]
        required: true
      - name: "Deficiencies Found"
        type: Text
      - name: "Inspector Name"
        type: Text
        required: true
      - name: "License Number"
        type: Text
      - name: "Inspector Signature"
        type: File
      - name: "Next Inspection Due"
        type: Text
```

**[MEP] 🧯 Fire Extinguisher Inspection**
```yaml
name: "[MEP] 🧯 Fire Extinguisher Inspection"
fields:
  - group: "Extinguisher Information"
    fields:
      - name: "Location/ID Tag"
        type: Text
        required: true
      - name: "Type"
        type: Single select
        options: ["ABC Dry Chemical", "BC Dry Chemical", "CO2", "Class K", "Water", "Clean Agent"]
      - name: "Size (lbs)"
        type: Single select
        options: ["2.5", "5", "10", "20", "Other"]
      - name: "Manufacturer"
        type: Text
      - name: "Manufacturing Date"
        type: Text

  - group: "Visual Inspection"
    fields:
      - name: "Pressure Gauge"
        type: Single select
        options: ["In Green", "Overcharged", "Undercharged"]
      - name: "Pin & Seal"
        type: Single select
        options: ["Intact", "Missing Pin", "Broken Seal"]
      - name: "Hose & Nozzle"
        type: Single select
        options: ["Good", "Cracked", "Clogged", "Missing"]
      - name: "Handle/Lever"
        type: Single select
        options: ["Good", "Damaged"]
      - name: "Label Legible"
        type: Single select
        options: ["Yes", "No"]
      - name: "Mounting"
        type: Single select
        options: ["Proper Height", "Too High", "Too Low", "Not Mounted"]
      - name: "Cabinet Condition (if applicable)"
        type: Single select
        options: ["Good", "Damaged", "Missing", "N/A"]
      - name: "Signage Visible"
        type: Single select
        options: ["Yes", "No"]

  - group: "Physical Inspection"
    fields:
      - name: "Cylinder Condition"
        type: Single select
        options: ["Good", "Dented", "Corroded", "Damaged"]
      - name: "Weight Check"
        type: Single select
        options: ["Full", "Light - Needs Recharge"]
      - name: "Hydrostatic Test Due"
        type: Single select
        options: ["Current", "Due This Year", "Overdue"]

  - group: "Certification"
    fields:
      - name: "Status"
        type: Single select
        options: ["Pass", "Fail - Replaced", "Fail - Needs Service"]
        required: true
      - name: "Tag Updated"
        type: Single select
        options: ["Yes", "No"]
      - name: "Inspector Initials"
        type: Text
      - name: "Notes"
        type: Text
```

---

### Phase 5: Service Plans (PM Agreements)

**[MEP] HVAC Maintenance Plans**
```yaml
plans:
  - name: "HVAC Bronze Plan"
    description: "Annual tune-up for residential HVAC systems"
    durationMonths: 12
    totalPrice: 199
    invoicingFrequency: "ONE_TIME"
    servicePlanItems:
      - frequency: "ANNUAL"
        interval: 1
        description: "Seasonal tune-up (AC or Heat)"

  - name: "HVAC Silver Plan"
    description: "Bi-annual tune-ups with priority service"
    durationMonths: 12
    totalPrice: 349
    invoicingFrequency: "ANNUAL"
    servicePlanItems:
      - frequency: "BI_ANNUAL"
        interval: 1
        description: "Spring AC tune-up"
      - frequency: "BI_ANNUAL"
        interval: 1
        description: "Fall heating tune-up"

  - name: "HVAC Gold Plan"
    description: "Quarterly inspections with all parts & labor included"
    durationMonths: 12
    totalPrice: 599
    invoicingFrequency: "QUARTERLY"
    servicePlanItems:
      - frequency: "QUARTERLY"
        interval: 1
        description: "Quarterly system inspection"
```

**[MEP] Plumbing Maintenance Plans**
```yaml
plans:
  - name: "Plumbing Protect Plan"
    description: "Annual water heater flush and plumbing inspection"
    durationMonths: 12
    totalPrice: 149
    invoicingFrequency: "ONE_TIME"
    servicePlanItems:
      - frequency: "ANNUAL"
        interval: 1
        description: "Water heater maintenance"
      - frequency: "ANNUAL"
        interval: 1
        description: "Whole-home plumbing inspection"
```

---

## Implementation Approach

### Option A: Manual UI Creation ($5-10K)
- Create each template manually via Coperniq's Process Studio
- 2-3 days of work per trade (8-12 templates each)
- Best for immediate use without engineering work
- Includes training session for Tim's team

### Option B: Automated Seeding Script ($15-25K)
- Develop script that replicates frontend API calls
- Capture exact mutation payloads from network requests
- Automate template creation across multiple companies
- Reusable for other MEP contractors

### Option C: Full Integration Package ($25-50K)
- All templates created and configured
- Custom project properties for each trade
- Workflow automation setup
- Labels and categorization
- Service plans configured
- Staff training (4 hours)
- 30 days support

---

## Files Created

| File | Purpose |
|------|---------|
| `COPERNIQ_SCHEMA.md` | GraphQL schema documentation |
| `COPERNIQ_GAP_ANALYSIS.md` | Feature gap analysis |
| `BUILD_SPECS.md` | Technical build specifications |
| `TEMPLATE_PACKAGE.md` | Template package overview |
| `MEP_TEMPLATE_SPEC.md` | This file - detailed template specs |

---

## Revenue Model

| Service | Price | Margin |
|---------|-------|--------|
| Template Creation (per trade) | $2,500-5,000 | 80% |
| Full MEP Package (4 trades) | $8,000-15,000 | 75% |
| Automation Script Development | $10,000-20,000 | 70% |
| Ongoing Template Updates | $500/month | 90% |
| Training & Onboarding | $1,500/session | 85% |

**Total Coperniq Opportunity:** $25,000-50,000 initial + $6,000/year maintenance

---

## Next Steps

1. **Immediate:** Tim reviews templates for accuracy (MEP vocabulary)
2. **Week 1:** Create 5 pilot templates manually via UI
3. **Week 2:** Test with real jobs, gather feedback
4. **Week 3:** Finalize all 30+ templates
5. **Week 4:** Package for other MEP contractors

---

*Generated by BugHive + ai-development-cockpit*
*Model: Claude Opus 4.5 + Playwright MCP for schema discovery*
