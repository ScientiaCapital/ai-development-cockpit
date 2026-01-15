# Coperniq AI - Efficiency Patterns & Best Practices

**Created**: 2025-12-21
**Purpose**: Tactical prompts and patterns for maximum AI efficiency across all Coperniq features

---

## Core Principle: Natural Language → Structured Data

Coperniq's AI transforms conversational text into structured database records. The better your prompt, the better the AI output.

---

## Pattern Library by Entity Type

### ✅ Pattern 1: Request Creation (Sales Funnel Top)

**Feature**: Sales → Request Portfolio → "+ REQUEST" → "✨ Ask AI"

**Speed**: 5-10x faster than manual

**Best Practice Prompts**:

```
Emergency AC repair for John Smith at 123 Main St, Phoenix AZ. AC stopped cooling last night. Customer needs same-day service. Prefers afternoon appointment.
```

**AI Extracts**:
- Customer: John Smith
- Location: Phoenix, AZ
- Service Type: Emergency AC Repair
- Urgency: Same-day
- Requested Time: Afternoon

**Pattern Components**:
1. **Service type** (Emergency, Routine, Quote)
2. **Customer name** + **Location**
3. **Problem description** (stopped cooling, leaking, making noise)
4. **Urgency** (same-day, this week, next month)
5. **Preferences** (morning, afternoon, specific date)

**Pro Tip**: Paste verbatim customer phone notes - AI extracts structure from conversation flow

---

### ✅ Pattern 2: Quote/Proposal Creation

**Feature**: Sales → Request Portfolio → "+ QUOTE" → "✨ Ask AI"

**Speed**: 5-10x faster than manual

**Best Practice Prompts**:

```
Annual AC tune-up for Mrs. Johnson. Includes: filter replacement, refrigerant check, thermostat calibration, condenser coil cleaning, electrical connection inspection. Price: $150. Valid for 30 days.
```

**AI Extracts**:
- Line items with descriptions
- Pricing: $150
- Validity: 30 days
- Professional description auto-generated

**Pattern Components**:
1. **Service name** (Annual tune-up, System replacement, Emergency repair)
2. **Itemized scope** (what's included, separated by commas)
3. **Pricing** (total or per-item)
4. **Terms** (payment schedule, validity, warranty)

**Pro Tip**: Use bullets or commas to separate line items - AI will create individual quote lines

---

### ✅ Pattern 3: Invoice Creation (Billing)

**Feature**: Invoices & Bills → "+ INVOICE" → "✨ Ask AI"

**Speed**: 5x faster than manual

**Best Practice Prompts**:

```
Invoice Sarah Martinez for annual PM visit completed 12/20/2025. Technician replaced air filter, checked refrigerant levels (R-410A, within spec), tested thermostat calibration. All systems operating normally. Bronze service plan (annual visit included). Total: $150.
```

**AI Extracts**:
- Client: Sarah Martinez
- Service date: 12/20/2025
- Professional summary of services rendered
- Line items: PM Visit Labor @ $150
- Total: $150

**Pattern Components**:
1. **Client name** (first + last)
2. **Service completion date**
3. **Work performed** (specific tasks completed)
4. **Technical details** (refrigerant type, measurements, model numbers)
5. **Pricing** (labor, parts, total)
6. **Payment terms** (Net 30, Due on receipt)

**Pro Tip**: Paste field tech notes verbatim - AI turns shorthand into professional invoices

**Advanced Pattern - Milestone Invoicing**:

```
Invoice Downtown Office Tower LLC for Milestone 1: Equipment Delivery (50% of $48,000 contract). Delivered 4x Carrier 15-ton RTUs to San Francisco location. Equipment inspected and accepted by customer. Payment terms: Net 15 days. Due date: January 15, 2025.
```

**AI Extracts**:
- Milestone tracking (M1, M2, M3)
- Percentage-based billing (50% of $48,000)
- Due date calculations (Net 15 → Jan 15, 2025)

---

### ✅ Pattern 4: Project Creation (Full Lifecycle)

**Feature**: Projects → "+ PROJECT" → "✨ Ask AI"

**Speed**: 10x faster than manual

**Best Practice Prompts**:

```
Downtown Office Tower RTU replacement project. Client: Downtown Office Tower LLC, San Francisco. Replace 4x Carrier 15-ton RTUs. Contract value: $48,000 (50% deposit, 50% at commissioning). Workflow: HVAC Commercial Install. Project manager: Tim Kipper. Start date: January 15, 2025. Expected completion: March 1, 2025. Trades: HVAC. Includes rigging, ductwork, electrical, startup.
```

**AI Extracts**:
- Client: Downtown Office Tower LLC (auto-matched)
- Site: San Francisco (auto-matched)
- Trades: HVAC
- Workflow: HVAC Commercial Install
- Project value: $48,000
- PM: Tim Kipper
- Timeline: Jan 15 - Mar 1, 2025
- Scope details: rigging, ductwork, electrical, startup

**BONUS**: Work orders auto-generated based on selected workflow:
- Site Survey
- Permitting
- Equipment Procurement
- Installation
- Commissioning
- Customer Handoff

**Pattern Components**:
1. **Project name** (descriptive, client + scope)
2. **Client name** + **Location**
3. **Scope summary** (equipment, quantities, specifics)
4. **Contract value** (total + milestone breakdown)
5. **Workflow** (critical! drives work order generation)
6. **PM assignment**
7. **Timeline** (start + end dates)
8. **Trades** (HVAC, Plumbing, Electrical, etc.)

**Pro Tip**: Mention workflow explicitly - correct workflow = correct work orders auto-generated

---

### ✅ Pattern 5: Asset Creation (Equipment Database)

**Feature**: Assets & Systems → "+ ASSET" → "✨ Ask AI"

**Speed**: 8x faster than manual

**Best Practice Prompts**:

```
Trane 3-ton AC unit, model XR14, 15 years old. Serial number: A12345678. Installed in 2010 at Sarah Martinez's home in Phoenix, AZ. R-410A refrigerant. Expected lifetime 20 years. Currently active, serviced regularly under Bronze service plan.
```

**AI Extracts**:
- Type: Air Conditioner
- Status: Active
- Manufacturer: Trane
- Model: XR14
- Serial Number: A12345678
- Size: 3 tons
- Expected Lifetime: 20 years
- Installation Date: 01/01/2010
- Description: Auto-generated comprehensive summary

**Pattern Components**:
1. **Equipment type** (AC unit, furnace, heat pump, boiler, RTU, chiller)
2. **Manufacturer** + **Model**
3. **Size/Capacity** (tons for AC, BTU for furnace, HP for motors)
4. **Serial number** (critical for warranty lookups)
5. **Age/Install date** (AI calculates from "15 years old" or "installed 2010")
6. **Technical specs** (refrigerant type, voltage, phase)
7. **Expected lifetime** (warranty period, typical lifespan)
8. **Service history** (last service date, service plan)

**Pro Tip**: Use voice dictation while standing in front of equipment - speak nameplate details directly into AI prompt

**Advanced Pattern - Multiple Assets**:

```
Equipment survey at Retail Plaza, Dallas TX. Found 10 RTUs on roof:
- RTU-1: Carrier 10-ton, model 50TCA10, serial XYZ123, installed 2015
- RTU-2: Carrier 10-ton, model 50TCA10, serial XYZ124, installed 2015
- RTU-3: Carrier 10-ton, model 50TCA10, serial XYZ125, installed 2016 (this one had compressor replaced in 2023)
All units use R-410A refrigerant. Expected lifetime 15 years.
```

**AI Extracts**: 3 separate asset records with individual serial numbers, installation dates, and service notes

---

### ✅ Pattern 6: Form Template Creation (Inspection Checklists)

**Feature**: Process Studio → Forms → "+ TEMPLATE" → "✨ Ask AI"

**Speed**: 30x faster than manual (!)

**Best Practice Prompts**:

```
Create a commercial building monthly PM inspection form for HVAC systems. Include fields for: technician name, date, client name, building address, equipment type (RTU, chiller, boiler, air handler), serial number, visual inspection checklist (belts, filters, refrigerant leaks, electrical connections), temperature readings (supply air, return air, outdoor air), operational tests (compressor startup, fan operation, thermostat calibration), deficiencies found, corrective actions taken, parts replaced, labor hours, customer signature, and next PM due date.
```

**AI Generates**:
- Form Name: "Commercial Building Monthly PM Inspection - HVAC"
- 7 sections with 20+ fields
- Intelligent field types (Text, Numeric, Single select, Date, File)
- Pass/Fail checklists
- Signature capture
- Mobile-optimized layout

**Pattern Components**:
1. **Form purpose** (PM inspection, site survey, compliance checklist)
2. **Target equipment** (HVAC, plumbing, electrical, fire protection)
3. **Field list** (comma-separated or bulleted)
4. **Field types implicitly** (numbers → Numeric, Pass/Fail → Single select, signature → File)
5. **Compliance standards** (NFPA 25, EPA 608, NEC, ASHRAE)

**Pro Tip**: List ALL fields you want - AI will organize them into logical sections automatically

**Advanced Pattern - Compliance Forms**:

```
Create fire sprinkler quarterly inspection form per NFPA 25. Include: inspector certification number, facility name, system type (wet, dry, pre-action), valve inspection (tamper switches, control valves, OS&Y position), gauge readings (static, residual, flow), alarm testing (water flow, supervisory, tamper), visual inspection (pipe hangers, sprinkler heads, obstructions), deficiencies (with photos), corrective actions, AHJ notification requirements, inspector signature, next inspection due date.
```

**AI Generates**: NFPA 25-compliant form with regulatory field requirements built-in

---

## Advanced Efficiency Patterns

### Pattern 7: Batch Operations

**Use Case**: Create 10 PM visits for quarterly customers

**Approach**:
1. Create first PM visit with AI (includes all details)
2. Copy AI-generated project description
3. For next 9 customers: Paste same prompt, change customer name only
4. AI reuses structure, changes client-specific details

**Time Savings**: 10 minutes per PM × 10 customers = 100 minutes manual
**AI Time**: 2 minutes first prompt + 1 minute each repeat = 11 minutes
**Improvement**: 9x faster for batch operations

---

### Pattern 8: Template Reuse

**Use Case**: Same type of work for multiple customers

**Best Practice**:
1. Create perfect AI prompt for first instance
2. Save prompt as template in note-taking app
3. Replace variables for each new instance:
   - `[CUSTOMER_NAME]`
   - `[LOCATION]`
   - `[EQUIPMENT_MODEL]`
   - `[SERIAL_NUMBER]`
   - `[PRICE]`

**Example Template**:
```
Invoice [CUSTOMER_NAME] for compressor replacement completed [DATE]. Replaced failed compressor on [EQUIPMENT_MODEL]. Total cost: [PRICE]. Payment terms: Net 30 days.
```

**Time Savings**: No need to retype prompts - just fill in variables

---

### Pattern 9: Voice Dictation (Field Techs)

**Use Case**: On-site equipment surveys

**Approach**:
1. Open Coperniq mobile app → Assets → "+ ASSET" → "✨ Ask AI"
2. Enable voice dictation (microphone icon)
3. Speak while standing in front of equipment:
   "Carrier four ton AC unit, model 24ACB4, serial number one two three four XYZ five six seven eight. Installed 2018. Located on south-facing roof. R-410A refrigerant. Unit appears well-maintained, no visible corrosion."
4. AI transcribes + extracts structured data
5. Review, attach nameplate photo, click create

**Time Savings**: No typing on mobile device - speak faster than type

---

### Pattern 10: Copy/Paste from Emails

**Use Case**: Customer emails with project details

**Approach**:
1. Customer emails: "We need 4 new RTUs on our office building at 123 Main St. Budget is $50k. Need it done before summer."
2. Copy email content
3. Navigate to: Projects → "+ PROJECT" → "✨ Ask AI"
4. Paste email + add missing details:
   ```
   [PASTE EMAIL]

   Additional details:
   Client: Downtown Office Tower LLC
   Location: San Francisco, CA
   Equipment: 4x Carrier 15-ton RTUs (replacing existing units)
   Timeline: Complete before June 1, 2025
   Workflow: HVAC Commercial Install
   ```
5. AI merges email content + your additions → complete project

**Time Savings**: No manual transcription - AI extracts customer intent from email prose

---

## Common AI Extraction Patterns

### What AI Excels At:

✅ **Names & Locations**
- "John Smith in Phoenix, AZ" → Client: John Smith, Location: Phoenix, AZ
- Auto-matches existing clients/sites from database

✅ **Dates & Timelines**
- "Net 30 days" → Calculates due date from today
- "15 years old" + "installed 2010" → Installation Date: 01/01/2010
- "Complete before June 1" → Due date: 06/01/2025

✅ **Equipment Specifications**
- "Carrier 4-ton AC unit" → Manufacturer: Carrier, Size: 4 tons, Type: Air Conditioner
- "R-410A refrigerant" → Captured in technical specs
- Serial numbers, model numbers, capacities

✅ **Pricing & Payment Terms**
- "Total: $2,400" → Amount: 2,400.00
- "50% deposit, 50% at completion" → M1: 50%, M2: 50%
- "Net 15 days" → Payment terms + due date calculation

✅ **Professional Descriptions**
- Brief notes → Comprehensive descriptions
- Technician shorthand → Customer-facing language
- "Replaced compressor cap" → "Comprehensive replacement of the failed compressor capacitor..."

---

### What Requires Manual Selection:

⚠️ **Client Assignment**
- AI suggests matches, but you must select from dropdown
- Future improvement: Auto-match with higher confidence

⚠️ **Site Selection**
- AI recognizes location, but you must pick specific site
- Multiple sites per client require manual selection

⚠️ **Workflow Selection (Projects)**
- AI can't guess workflow - you must specify or select
- Critical because workflow drives work order generation

---

## Prompt Writing Best Practices

### DO:
✅ Include all relevant details (who, what, where, when, how much)
✅ Use conversational language (natural sentences)
✅ Mention technical specs (model numbers, refrigerant types, capacities)
✅ Specify workflow for projects ("Workflow: HVAC Commercial Install")
✅ Include payment terms ("Net 30", "50/50 split", "Due on completion")
✅ Paste verbatim from customer emails, field tech notes, phone conversations
✅ Use voice dictation for mobile asset creation
✅ Save successful prompts as templates for reuse

### DON'T:
❌ Use abbreviations AI might misinterpret ("comp" = compressor or compressor capacitor?)
❌ Omit client name (AI needs this to match database)
❌ Forget workflow for projects (no workflow = no auto-generated work orders)
❌ Skip equipment details for assets (model, serial, size needed for warranty/parts)
❌ Use all caps or poor grammar (AI handles it, but clean input = better output)
❌ Retype same prompts (save templates, change variables only)

---

## Training Exercises for New Users

### Exercise 1: Invoice Creation (5 min)
**Scenario**: Field tech completed AC tune-up for residential customer

**Prompt to try**:
```
Invoice [pick any customer] for annual AC tune-up completed today. Technician replaced air filter, checked refrigerant levels (R-410A, within spec), tested thermostat calibration. All systems operating normally. Total: $150.
```

**Expected AI Output**:
- Professional invoice description
- Line item: AC Tune-Up @ $150
- Today's date as service date
- Subtotal + total calculated

**Success Criteria**: Invoice created in under 2 minutes

---

### Exercise 2: Asset Creation (5 min)
**Scenario**: Field tech discovered new equipment during site visit

**Prompt to try**:
```
Carrier 4-ton AC unit, model 24ACB4, installed 2018. Serial number: ABC123XYZ. Located on roof. R-410A refrigerant. Expected lifetime 15-20 years. Currently active.
```

**Expected AI Output**:
- Type: Air Conditioner
- Manufacturer: Carrier
- Model: 24ACB4
- Serial: ABC123XYZ
- Size: 4 tons
- Installation date: 2018
- Lifetime: 15-20 years

**Success Criteria**: Asset created in under 1 minute

---

### Exercise 3: Form Template Creation (10 min)
**Scenario**: Need new HVAC PM inspection form

**Prompt to try**:
```
Create HVAC preventive maintenance inspection form. Include: technician name, date, client, equipment type, serial number, filter condition (clean/dirty/replaced), refrigerant level (add/OK), electrical connections (tight/loose), thermostat test (pass/fail), deficiencies found, corrective actions, customer signature.
```

**Expected AI Output**:
- Multi-section form
- 12+ fields with appropriate types
- Pass/Fail checkboxes
- Signature capture field
- Mobile-optimized

**Success Criteria**: Production-ready form in under 2 minutes (vs. 30+ min manual)

---

## Metrics to Track

### Individual Performance
- **AI Adoption Rate**: % of records created via AI vs. manual
- **Time per record**: Avg time to create invoice/project/asset (AI vs. manual)
- **Data quality**: % of records with complete fields (AI enforces completeness)

### Team Performance
- **Total time saved**: (Manual time - AI time) × # of records created
- **Records per day**: How many more invoices/projects/assets created with AI
- **Customer satisfaction**: Faster response times, professional documentation

### Business Impact
- **Scalability**: Handle 2x workload without adding headcount
- **Dashboard accuracy**: Real-time insights from consistent AI data
- **Revenue per employee**: More billable work, less admin time

---

## Conclusion: The 10x Contractor

Coperniq's AI features enable a **10x improvement** in operational efficiency:

- **10x faster** data entry (natural language → structured records)
- **10x more consistent** (AI enforces data quality)
- **10x more scalable** (same team handles 10x more customers)

**Goal**: Make every employee a "10x" performer through AI-powered workflows.

**Implementation Timeline**:
- **Week 1**: Train all employees on AI features (1 hour per role)
- **Week 2**: Set AI adoption targets (80% of new records via AI)
- **Week 3**: Monitor metrics, celebrate early wins
- **Week 4**: Refine prompts, share best practices
- **Month 2+**: AI becomes default, manual entry is exception

---

**Last Updated**: 2025-12-21
**Status**: Production-ready training guide with exercises and metrics
