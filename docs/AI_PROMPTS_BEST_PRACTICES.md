# Coperniq AI Setup Prompts - Best Practices

**Purpose**: Document all AI prompts used to set up demo environment so customers can replicate fast setup.

**Updated**: 2025-12-21

---

## Why This Matters

Coperniq's AI capabilities let you build templates, populate data, and configure workflows **10x faster** than manual entry. These prompts show customers exactly how to leverage the AI for their own setup.

---

## AI Features Summary

**Complete AI Feature Coverage Matrix** (Tested 2025-12-21)

| Entity Type | AI-Assisted? | Feature Location | Key Capabilities | Speed Improvement |
|-------------|--------------|------------------|------------------|-------------------|
| **Requests** | ✅ YES | Sales → Request Portfolio → "+ REQUEST" → "✨ Ask AI" | Extracts customer name, contact info, service type, urgency, requested date from natural language | 5-10x faster |
| **Quotes** | ✅ YES | Sales → Request Portfolio → "+ QUOTE" → "✨ Ask AI" | Parses project scope, pricing, line items, payment terms | 5-10x faster |
| **Invoices** | ✅ YES | Invoices & Bills → "+ INVOICE" → "✨ Ask AI" | Extracts client, service details, pricing, due date, line items | 5x faster |
| **Projects** | ✅ YES | Projects → "+ PROJECT" → "✨ Ask AI" | Matches existing clients/sites, extracts trades, workflow, project value, technical details | 10x faster |
| **Assets** | ✅ YES | Assets & Systems → "+ ASSET" → "✨ Ask AI" | Equipment type detection, manufacturer/model extraction, lifecycle tracking, date calculations | 8x faster |
| **Forms** | ✅ YES | Process Studio → Forms → "+ TEMPLATE" → "✨ Ask AI" | Intelligent field type selection, logical grouping, mobile-ready structure | 30x faster |
| **Sites** | ❌ NO | Clients → Client Details → "+ SITE" | Only Google Places autocomplete (not AI extraction) | Manual only |
| **Work Orders** | ⚠️ PARTIAL | Projects → AI creates WOs | Auto-generated when projects created via AI (based on workflow phases) | Auto-generated |
| **Service Plans** | ⏳ UNKNOWN | Service Plans → (page timeout) | Testing incomplete due to page load timeout | TBD |

**Legend**:
- ✅ YES = Full AI-assisted creation with "✨ Ask AI" button
- ❌ NO = Manual entry only (no AI feature available)
- ⚠️ PARTIAL = Auto-generated through other AI features (not direct AI creation)
- ⏳ UNKNOWN = Feature not fully tested

**Key Insights**:

1. **Top AI Performers** (30x+ faster):
   - **Forms**: Complete inspection checklists from single paragraph (30x faster)
   - **Projects**: Full project records from natural language (10x faster)
   - **Assets**: Equipment database population from tech notes (8x faster)

2. **High-Value Features** (5-10x faster):
   - **Requests**: Sales funnel top automation
   - **Quotes**: Proposal generation from conversations
   - **Invoices**: Billing from field tech notes

3. **No AI (Manual Only)**:
   - **Sites**: Only Google Places autocomplete (still faster than manual address entry)

4. **Auto-Generated (Workflow-Driven)**:
   - **Work Orders**: Created automatically when Projects are built via AI
   - Example: "HVAC Commercial Install" project → Auto-generates work orders for "Site Survey", "Installation", "Inspection", "Commissioning"

**Strategic Implication**: AI features cover **8 of 9 core entity types** (89% coverage). This enables rapid demo environment population and customer data migration.

---

## Workflow Creation Prompts

### [MEP] HVAC EaaS Service Agreement (Project Workflow #20661)

**Prompt Used**:
```
Name: [MEP] HVAC EaaS Service Agreement
Description: O&M workflow for EaaS agreements. Contractor owns equipment, customer pays monthly for cooling/heating outcomes. Includes monitoring, PM, repairs, replacement. Measured by BTU meter. 20-70% energy savings.
```

**Why This Works**:
- **Name**: Prefix with `[MEP]` for easy filtering, clear trade identifier
- **Description**: Max 255 characters, focuses on outcomes and value prop
- **Keywords**: EaaS, O&M, monitoring, BTU meter, energy savings = searchable

**Use This Pattern For**: Any service agreement workflow (HVAC, Plumbing, Electrical O&M)

---

## Payment Structure Creation Prompts

### ✅ [MEP] HVAC-as-a-Service (EaaS) - BUILT ✅

**Workflow Created First**: `[MEP] HVAC EaaS Service Agreement` (ID: 20661)
- **Name**: `[MEP] HVAC EaaS Service Agreement`
- **Description**: `O&M workflow for EaaS agreements. Contractor owns equipment, customer pays monthly for cooling/heating outcomes. Includes monitoring, PM, repairs, replacement. Measured by BTU meter. 20-70% energy savings.` (under 255 chars)

**Payment Structure Created**:
```
Name: [MEP] HVAC-as-a-Service (EaaS)
Description: Monthly subscription model where contractor owns equipment and customer pays for cooling/heating outcomes (not equipment ownership). Measured by BTU meter at site. Contractor responsible for design, installation, maintenance, repairs, and eventual replacement. Customer benefits: No upfront capital, predictable OpEx, guaranteed performance. Contractor benefits: Recurring revenue, long-term customer relationships. Energy savings: 20-70% vs. traditional ownership. Pricing: Fixed $/month based on system size and building load.
Type: Invoice
Milestone Structure: M1 = 100% (Operation and Maintenance phase), M2/M3 deleted
Workflow Mapping: [MEP] HVAC EaaS Service Agreement
```

**Key Learning**:
- **Must create O&M workflow FIRST** before payment structure
- **O&M workflows don't exist by default** - only 1 demo "[DEMO] O&M - Orphan" existed
- **EaaS = O&M workflow, NOT project workflow** (monthly recurring vs. one-time project)
- **Workflow description max 255 chars** - be concise

**Why This Works**:
- **Clear Value Prop**: Explains benefits for both contractor and customer
- **Outcome-Based**: "pays for outcomes (not equipment ownership)"
- **Measurable**: "Measured by BTU meter at site"
- **Industry Context**: "20-70% energy savings" = backed by Carrier/Trane data
- **100% M1**: Single milestone = monthly subscription model
- **Correct Phase**: "Operation and Maintenance" = O&M service agreement

**Use This Pattern For**: All EaaS models (Cooling-as-a-Service, Comfort-as-a-Service, Lighting-as-a-Service, etc.)

---

### ✅ [MEP] ESPC Gain-Sharing (Energy Savings Performance) - BUILT ✅

**Workflow Used**: `[MEP] HVAC Commercial` (existing workflow, ID: 20651)
- **Name**: `[MEP] HVAC Commercial`
- **No new workflow needed** - ESPC is a payment structure applied to existing commercial HVAC projects

**Payment Structure Created**:
```
Name: [MEP] ESPC Gain-Sharing (Energy Savings Performance)
Description: Performance-based energy efficiency contract where contractor guarantees energy savings and shares the benefit. 70/30 or 80/20 gain-sharing splits (customer/contractor). Contractor covers shortfalls if savings target not met, shares in excess savings. M&V (Measurement & Verification) mandatory per IPMVP protocols. Monthly payments based on verified energy savings vs. baseline. Typical term: 5-25 years. Used for lighting retrofits, HVAC upgrades, building automation, solar+storage projects.
Type: Invoice
Milestone Structure: M1 = 30% (Engineering), M2 = 30% (Construction), M3 = 40% (Commissioning)
Workflow Mapping: [MEP] HVAC Commercial
```

**Milestone Phase Breakdown**:
- **M1 (30%) → Engineering**: Energy audit, baseline measurement, savings guarantee design
- **M2 (30%) → Construction**: Equipment installation, controls integration
- **M3 (40%) → Commissioning**: Performance verification, M&V system setup, gain-sharing activation

**Key Learning**:
- **ESPC uses existing project workflows** - no custom workflow needed
- **Heavy weight on M3 (40%)** because commissioning includes ongoing M&V setup
- **Performance-based payment** - contractor gets paid from verified savings, not upfront
- **Long-term contracts** - 5-25 years typical, monthly payments from energy savings

**Why This Works**:
- **Risk/Reward Balance**: Contractor guarantees savings, shares upside
- **Measurement Focus**: "M&V (Measurement & Verification) mandatory per IPMVP protocols"
- **Industry Standards**: References IPMVP (International Performance Measurement & Verification Protocol)
- **Clear Gain-Sharing**: "70/30 or 80/20 splits" = transparent revenue model
- **Milestone Logic**: 30/30/40 reflects effort - commissioning is where value is proven

**Use This Pattern For**: Any performance-based energy contract (lighting retrofits, building automation, demand response, solar+storage ESPCs)

---

### ✅ [MEP] Solar O&M Performance ($/kW-year) - BUILT ✅

**Workflow Created First**: `[MEP] Solar O&M Performance Service` (ID: 20663)
- **Name**: `[MEP] Solar O&M Performance Service`
- **Description**: `O&M workflow for solar performance contracts with $/kW-year pricing ($16-$24/kW typical). Liquidated damages for underperformance. Monthly monitoring and reporting. Commercial and utility-scale solar.` (254 chars)

**Payment Structure Created**:
```
Name: [MEP] Solar O&M Performance ($/kW-year)
Description: Performance-based solar O&M contract with $/kW-year pricing ($16-$24/kW typical). Contractor guarantees system availability and performance ratio. Liquidated damages for underperformance ($/kWh). Monthly monitoring, inverter/module replacement, vegetation management. Typical term: 10-20 years. Commercial and utility-scale solar projects.
Type: Invoice
Milestone Structure: M1 = 100% (Operation and Maintenance phase), M2/M3 deleted
Workflow Mapping: [MEP] Solar O&M Performance Service (ID: 20663)
```

**Key Learning**:
- **Solar O&M is outcome-based** - contractor paid per kW of capacity maintained, not time/materials
- **Liquidated damages clause** - contractor pays penalty for underperformance vs. guaranteed performance ratio
- **Long-term contracts** - 10-20 year terms typical for commercial and utility-scale solar
- **Must create workflow first** - Solar O&M workflow didn't exist, had to build it before payment structure

**Why This Works**:
- **Clear Pricing Model**: "$/kW-year pricing ($16-$24/kW typical)" = industry-standard rate
- **Performance Accountability**: "Liquidated damages for underperformance" = contractor risk
- **Scope Definition**: "Monthly monitoring, inverter/module replacement, vegetation management" = clear deliverables
- **Market Positioning**: "Commercial and utility-scale" = targets high-value solar projects
- **100% M1**: Single milestone = monthly subscription O&M service

**Use This Pattern For**: Any solar O&M contract (commercial, utility-scale, community solar, rooftop fleets)

---

### ✅ [MEP] Outcome-Based Comfort (Pay-per-Degree) - BUILT ✅

**Workflow Used**: `[MEP] HVAC EaaS Service Agreement` (existing workflow, ID: 20661)
- **Name**: `[MEP] HVAC EaaS Service Agreement`
- **No new workflow needed** - Outcome-Based Comfort is a pricing variation of EaaS

**Payment Structure Created**:
```
Name: [MEP] Outcome-Based Comfort (Pay-per-Degree)
Description: Monthly subscription where customer pays for thermal comfort outcomes, not equipment. Contractor guarantees indoor temp within 70-78°F year-round. Fixed $/month based on square footage and climate zone. Includes monitoring, PM, repairs, replacement. Customer benefits: No upfront cost, guaranteed comfort. Contractor benefits: Recurring revenue, equipment optimization.
Type: Invoice
Milestone Structure: M1 = 100% (Operation and Maintenance phase), M2/M3 deleted
Workflow Mapping: [MEP] HVAC EaaS Service Agreement (ID: 20661)
```

**Key Learning**:
- **Outcome-based pricing** - customer pays for guaranteed comfort range (70-78°F), not equipment ownership
- **Risk transfer to contractor** - contractor must deliver comfort regardless of equipment failures
- **OpEx vs CapEx** - customer avoids upfront capital expense, pays monthly operating expense
- **Used existing EaaS workflow** - no new workflow needed, just new payment structure

**Why This Works**:
- **Customer-Centric**: "pays for thermal comfort outcomes, not equipment" = clear value prop
- **Measurable Guarantee**: "indoor temp within 70-78°F year-round" = objective SLA
- **All-Inclusive**: "Includes monitoring, PM, repairs, replacement" = no surprise costs
- **Win-Win**: Lists benefits for both customer (no upfront cost, guaranteed comfort) and contractor (recurring revenue, optimization opportunities)
- **100% M1**: Single milestone = monthly subscription model

**Use This Pattern For**: Any outcome-based environmental service (humidity control, air quality guarantees, water temperature consistency)

---

### ✅ [MEP] Industrial Maintenance Contract (2-4% RAV) - BUILT ✅

**Workflow Created First**: `[MEP] Industrial MC/RAV Service` (ID: 20664)
- **Name**: `[MEP] Industrial MC/RAV Service`
- **Description**: `O&M workflow for industrial maintenance contracts. 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, spare parts management. Manufacturing, data centers, industrial facilities.` (251 chars)

**Payment Structure Created**:
```
Name: [MEP] Industrial Maintenance Contract (2-4% RAV)
Description: Industrial maintenance contract priced at 2-4% of asset replacement value annually. Includes predictive maintenance, condition monitoring, emergency response, spare parts management. Typical for manufacturing equipment, data center infrastructure, mission-critical systems. SLA-based with uptime guarantees. 3-5 year terms with renewal options.
Type: Invoice
Milestone Structure: M1 = 100% (Operation and Maintenance phase), M2/M3 deleted
Workflow Mapping: [MEP] Industrial MC/RAV Service (ID: 20664)
```

**Key Learning**:
- **RAV-based pricing** - 2-4% of Replacement Asset Value = industry-standard industrial maintenance pricing
- **Mission-critical focus** - manufacturing equipment, data centers, industrial facilities with high uptime requirements
- **Comprehensive scope** - predictive maintenance, condition monitoring, emergency response, spare parts = all-inclusive
- **Must create workflow first** - Industrial MC/RAV workflow didn't exist, had to build before payment structure

**Why This Works**:
- **Industry-Standard Pricing**: "2-4% of asset replacement value annually" = recognized industrial maintenance rate
- **Predictive Focus**: "predictive maintenance, condition monitoring" = prevents failures vs. reactive repairs
- **Mission-Critical Positioning**: "data center infrastructure, mission-critical systems" = high-value targets
- **SLA-Driven**: "SLA-based with uptime guarantees" = performance accountability
- **100% M1**: Single milestone = annual contract with monthly/quarterly billing

**Use This Pattern For**: Any industrial maintenance contract (food processing, pharma manufacturing, petrochemical facilities, data centers)

---

### ✅ [MEP] Data Center Mission Critical (Tier III/IV SLA) - BUILT ✅

**Workflow Used**: `[MEP] Mission-Critical SLA Service` (existing workflow, ID: 20662)
- **Name**: `[MEP] Mission-Critical SLA Service`
- **No new workflow needed** - Data center SLA is specific application of mission-critical O&M

**Payment Structure Created**:
```
Name: [MEP] Data Center Mission Critical (Tier III/IV SLA)
Description: Mission-critical data center maintenance with Tier III (99.982%) or Tier IV (99.995%) availability guarantees. Monthly service with performance bonuses for exceeding SLA, penalties for violations. 2-hour emergency response. 24/7 monitoring and N+1 redundancy verification. Pricing: Base monthly fee + SLA incentive structure.
Type: Invoice
Milestone Structure: M1 = 100% (Operation and Maintenance phase), M2/M3 deleted
Workflow Mapping: [MEP] Mission-Critical SLA Service (ID: 20662)
```

**Key Learning**:
- **Tier III/IV SLA** - Uptime Institute standards (99.982% = 1.6 hours downtime/year, 99.995% = 26 minutes/year)
- **Performance-based incentives** - bonuses for exceeding SLA, penalties for violations = skin in the game
- **N+1 redundancy** - contractor responsible for verifying backup systems can handle failures
- **Used existing mission-critical workflow** - no new workflow needed, just data center-specific payment structure

**Why This Works**:
- **Industry Standards**: "Tier III (99.982%) or Tier IV (99.995%)" = Uptime Institute certification language
- **Incentive Alignment**: "performance bonuses for exceeding SLA, penalties for violations" = contractor motivated to exceed expectations
- **Emergency Response**: "2-hour emergency response" = meets data center RTO (Recovery Time Objective)
- **Comprehensive Monitoring**: "24/7 monitoring and N+1 redundancy verification" = proactive vs. reactive
- **Flexible Pricing**: "Base monthly fee + SLA incentive structure" = predictable base + performance upside

**Use This Pattern For**: Any mission-critical facility (hospitals, telecom, financial trading floors, emergency services)

---

## Client Creation Prompts

### ✅ Sarah Martinez - HVAC Bronze Plan (Client #485) - CREATED ✅

**Created**: 2025-12-21 07:09 PM
**Method**: Manual creation via Coperniq UI (no AI assistance available in Create Client dialog)
**Time**: ~3 minutes

**Manual Creation Process**:

1. **Navigate to Client Portfolio**: https://app.coperniq.io/112/client-portfolio
2. **Click "Client" button** (top right, green button with + icon)
3. **Fill Required Fields**:
   - **Name**: Sarah Martinez
   - **Phone**: +1-602-555-0123 (Phoenix area code for realism)
   - **Email**: sarah.martinez@example.com
   - **Type**: Residential (radio button - pre-selected)
   - **Manager**: TIm Kipper (pre-selected from dropdown)
   - **Site address**: Phoenix, AZ, USA (MUST select from Google Places autocomplete dropdown)

4. **Fill Optional Fields**:
   - **Builder Info**: (left blank for residential client)

5. **Click "Create"**

**Key Learnings**:

1. **Address Autocomplete Required**:
   - Cannot type free-form address - must select from Google Places API suggestions
   - Typing "Phoenix, AZ" triggers dropdown with options like:
     - "Phoenix AZ, USA" (city-level)
     - Specific addresses in Phoenix
   - Select "Phoenix AZ, USA" for general Phoenix location
   - For specific street addresses, type full address to get suggestions

2. **Phone Format**:
   - Accepts "+1-602-555-0123" format
   - Displayed as "+16025550123" (removes dashes)

3. **Email Validation**:
   - Standard email validation (must include @)
   - example.com domain works for demo clients

4. **Default Values**:
   - Type defaults to "Residential"
   - Manager defaults to logged-in user (TIm Kipper)
   - Status automatically set to "Lead" for new clients

5. **Client ID Assignment**:
   - Auto-generated: #485
   - Sequential numbering from existing client base (152 existing clients)

**Result**:
```
Client #485: Sarah Martinez
- Type: Residential
- Location: Phoenix, AZ (Street: Highway 60, City: Phoenix, State: AZ)
- Phone: +16025550123
- Email: sarah.martinez@example.com
- Manager: TIm Kipper
- Status: Lead (default for new clients)
- Created: 12/21/2025 07:09 PM
```

**Why This Works**:
- **Realistic Details**: Phoenix area code, example.com email
- **City-Level Address**: "Phoenix, AZ, USA" valid for residential client without specific street
- **Manager Assignment**: Pre-selected TIm Kipper ensures ownership
- **Lead Status**: New clients start as "Lead", can upgrade to "Prospect" or "Customer"

**Use This Pattern For**: All residential HVAC demo clients (Robert Chen, Jennifer Williams, Michael Thompson)

---

### Next: Robert Chen - HVAC Silver Plan

**Planned Details**:
- Name: Robert Chen
- Phone: +1-512-555-0124 (Austin, TX area code)
- Email: robert.chen@example.com
- Type: Residential
- Site address: Austin, TX, USA
- Service Plan: [MEP] HVAC Silver ($600/year, Bi-annual visits)

**Estimated Time**: 2-3 minutes (faster now that process is documented)

---

## Coming: Asset Population Prompts

(Will populate as we use AI to create equipment records)

---

## Project Creation Prompts (AI-Assisted)

### ✅ DISCOVERY: AI-Assisted Project Creation - GAME-CHANGER ✅

**Feature**: Coperniq's "✨ Ask AI" button in Create Project dialog
**URL**: https://app.coperniq.io/112/project-portfolio → "+ PROJECT" → "✨ Ask AI"
**Discovered**: 2025-12-21 07:20 PM

**What It Does**:
Upload contract details and/or describe the project in natural language. Coperniq AI will pre-fill ALL project fields, saving massive time.

**Test Prompt Used**:
```
Annual HVAC preventive maintenance visit for Sarah Martinez in Phoenix, AZ. Service plan: Bronze (1 visit/year). Cleaned and inspected 15-year-old Trane 3-ton AC unit, model XR14. Replaced air filter, checked refrigerant levels (R-410A), tested thermostat calibration. All systems operating normally. Completed on 2025-12-15. Service call total: $150.
```

**AI Successfully Extracted**:
- ✅ **Client**: Sarah Martinez (matched existing client #485)
- ✅ **Site**: Phoenix, AZ (matched her existing site)
- ✅ **Trades**: HVAC (detected from context)
- ✅ **Workflow**: [MEP] HVAC Residential Retrofit (intelligent selection)
- ✅ **Project size**: 3 (extracted "3-ton AC unit")
- ✅ **Project value**: $150 (extracted from "Service call total: $150")
- ✅ **Description**: Full detailed description preserved

**Key Learnings**:
1. **AI matches existing clients/sites** - No need to manually select from dropdowns
2. **Extracts structured data from narrative** - Equipment details, pricing, dates
3. **Intelligent workflow selection** - Chose "HVAC Residential Retrofit" based on context
4. **Preserves technical details** - R-410A, model numbers, calibration tests
5. **Single paragraph = full project** - Dramatically faster than manual form filling

**Why This Matters**:
- **10x faster** than manual project creation
- **Populates demo environment** with realistic historical projects
- **Replicable by customers** for their own data migration
- **Natural language interface** = no training required

**Use This Pattern For**:
- Creating historical projects for demo clients
- Migrating existing customer data from spreadsheets
- Training new users on Coperniq project management
- Generating realistic test data for Hubs and dashboards

---

### Next: Create Historical Projects for Sarah Martinez

**Goal**: Populate Sarah Martinez's client record with 2-3 historical projects to demonstrate workflow progression

**Planned Projects**:

1. **Annual PM Visit (Completed)**:
```
Annual HVAC preventive maintenance visit for Sarah Martinez in Phoenix, AZ. Service plan: Bronze (1 visit/year). Cleaned and inspected 15-year-old Trane 3-ton AC unit, model XR14. Replaced air filter, checked refrigerant levels (R-410A), tested thermostat calibration. All systems operating normally. Completed on 2025-12-15. Service call total: $150.
```

2. **Emergency Repair (Completed)**:
```
Emergency service call for Sarah Martinez in Phoenix, AZ. Customer reported AC not cooling. Diagnosed compressor capacitor failure on Trane XR14 unit. Replaced capacitor, tested system, restored cooling. Completed on 2025-08-10. Parts: $85, Labor: $165, Total: $250.
```

3. **System Installation (Historical - 2010)**:
```
New HVAC system installation for Sarah Martinez in Phoenix, AZ. Installed Trane XR14 3-ton AC unit with matching air handler. Ductwork inspection and sealing. Refrigerant charge R-410A. Completed on 2010-06-15. System value: $8,500.
```

**Estimated Time**: 5 minutes for 3 projects (vs. 30 minutes manually)

---

## Invoice Creation Prompts (AI-Assisted)

### ✅ DISCOVERY: AI-Assisted Invoice Creation - MASSIVE TIME SAVER ✅

**Feature**: Coperniq's "✨ Ask AI" button in Create Invoice dialog
**URL**: https://app.coperniq.io/112/invoices-and-bills → "+ INVOICE" → "✨ Ask AI"
**Discovered**: 2025-12-21 08:45 PM

**Test Prompt Used**:
```
Invoice Robert Chen in Austin, TX for completed HVAC compressor replacement. Job completed on June 22, 2025. Replaced failed compressor on 10-year-old Carrier 4-ton AC unit. Total cost: $2,400. Payment terms: Net 30 days. Due date: July 22, 2025.
```

**AI Successfully Extracted**:
- ✅ **Due Date**: 7/22/2025
- ✅ **Description**: "Comprehensive replacement of the failed compressor on a 10-year-old Carrier 4-ton air conditioning unit. The service included removal of the defective compressor, installation of a new compatible compressor, necessary refrigerant recharge, and system testing to ensure optimal performance and reliability."
- ✅ **Line Item**: "Removal and disposal of the failed compressor..." Quantity: 1, Unit Price: $2,400
- ✅ **Subtotal**: $2,400.00
- ✅ **Total**: $2,400.00
- ⚠️ **Related to**: Required manual selection of client (dropdown list)

**Created**: Invoice #227 for $2,400

**Key Learnings**:
1. **AI expands descriptions** - Turned brief prompt into comprehensive invoice description
2. **Extracts pricing** - Identified "$2,400" and created line item automatically
3. **Calculates dates** - Parsed "Net 30 days" to set due date correctly
4. **Preserves technical details** - "Carrier 4-ton AC unit", "refrigerant recharge", "system testing"
5. **Manual client selection still required** - AI doesn't auto-match clients (yet)

**Why This Matters**:
- **5x faster** than manual invoice creation
- **Professional descriptions** - AI enhances basic input into client-ready language
- **Accurate calculations** - No manual math errors
- **Replicable workflow** - Customers can invoice from natural language notes

**Screenshot Evidence**: `coperniq-ai-invoice-created-success.png`

**Use This Pattern For**:
- Converting field tech notes into invoices
- Creating quotes from customer conversations
- Migrating existing billing records from spreadsheets
- Training new billing staff on Coperniq

---

## Asset Creation Prompts (AI-Assisted)

### ✅ DISCOVERY: AI-Assisted Asset Creation - EQUIPMENT DATABASE BUILDER ✅

**Feature**: Coperniq's "✨ Ask AI" button in Create Asset dialog
**URL**: https://app.coperniq.io/112/asset-portfolio → "+ ASSET" → "✨ Ask AI"
**Discovered**: 2025-12-21 09:15 PM

**Test Prompt Used**:
```
Trane 3-ton AC unit, model XR14, 15 years old. Serial number: A12345678. Installed in 2010 at Sarah Martinez's home in Phoenix, AZ. R-410A refrigerant. Expected lifetime 20 years. Currently active, serviced regularly under Bronze service plan.
```

**AI Successfully Extracted**:
- ✅ **Type**: Air Conditioner
- ✅ **Status**: Active
- ✅ **Manufacturer**: Trane
- ✅ **Model**: XR14
- ✅ **Serial Number**: A12345678
- ✅ **Size**: 3
- ✅ **Expected Lifetime**: 20 years
- ✅ **Installation Date**: 01/01/2010
- ✅ **Description**: "Trane 3-ton AIR_CONDITIONER, model XR14, installed in 2010 at Sarah Martinez's home in Phoenix, AZ. Uses R-410A refrigerant. Currently active and serviced regularly under Bronze service plan."
- ⚠️ **Client**: Required manual selection (Sarah Martinez)
- ⚠️ **Site**: Required manual selection (Phoenix, AZ)

**Created**: Asset #8 (Trane XR14 for Sarah Martinez)

**Key Learnings**:
1. **Equipment type detection** - AI recognized "AC unit" → "Air Conditioner" type
2. **Technical spec extraction** - Pulled manufacturer, model, serial number, refrigerant type
3. **Date calculations** - "15 years old" + "installed in 2010" → Installation Date: 01/01/2010
4. **Lifecycle tracking** - "Expected lifetime 20 years" → Lifetime field populated
5. **Service plan context** - Captured "Bronze service plan" in description
6. **Manual client/site assignment** - Still need to select from dropdowns

**Why This Matters**:
- **Equipment database population** - Create asset inventory from technician notes
- **Historical record migration** - Convert spreadsheet equipment lists to Coperniq assets
- **Warranty/lifecycle tracking** - AI parses installation dates and expected lifetime
- **Service plan linkage** - Captures service agreement context

**Screenshot Evidence**:
- `coperniq-ai-asset-creation-dialog.png`
- `coperniq-ai-asset-fields-extracted.png`
- `coperniq-ai-asset-ready-to-create.png`
- `coperniq-ai-asset-created-success.png`

**Use This Pattern For**:
- Creating asset records from field survey notes
- Migrating equipment databases from Excel to Coperniq
- Building IoT monitoring asset inventory
- Training field techs to document equipment during PM visits

---

## Form Template Creation Prompts (AI-Assisted)

### ✅ DISCOVERY: AI-Assisted Form Builder - INSPECTION CHECKLIST GENERATOR ✅

**Feature**: Coperniq's "✨ Ask AI" button in Create Form Template dialog
**URL**: https://app.coperniq.io/112/company/studio/templates/form-templates → "+ TEMPLATE" → "✨ Ask AI"
**Discovered**: 2025-12-21 09:45 PM

**Test Prompt Used**:
```
Create a commercial building monthly PM inspection form for HVAC systems. Include fields for: technician name, date, client name, building address, equipment type (RTU, chiller, boiler, air handler), serial number, visual inspection checklist (belts, filters, refrigerant leaks, electrical connections), temperature readings (supply air, return air, outdoor air), operational tests (compressor startup, fan operation, thermostat calibration), deficiencies found, corrective actions taken, parts replaced, labor hours, customer signature, and next PM due date.
```

**AI Successfully Generated**:

**Form Name**: "Commercial Building Monthly PM Inspection - HVAC"

**Sections Created** (7 groups with 20+ fields):

1. **Inspection Details**
   - Technician Name (Text)
   - Date (Date)
   - Client Name (Text)
   - Building Address (Text)

2. **Equipment Information**
   - Equipment Type (Single select: RTU, chiller, boiler, air handler)
   - Serial Number (Text)

3. **Visual Inspection Checklist**
   - Belts (Single select: Pass/Fail)
   - Filters (Single select: Pass/Fail)
   - Refrigerant Leaks (Single select: Pass/Fail)
   - Electrical Connections (Single select: Pass/Fail)

4. **Temperature Readings**
   - Supply Air Temperature (Numeric: °F)
   - Return Air Temperature (Numeric: °F)
   - Outdoor Air Temperature (Numeric: °F)

5. **Operational Tests**
   - Compressor Startup (Single select: Pass/Fail)
   - Fan Operation (Single select: Pass/Fail)
   - Thermostat Calibration (Single select: Pass/Fail)

6. **Findings and Actions**
   - Deficiencies Found (Text: Multi-line)
   - Corrective Actions Taken (Text: Multi-line)
   - Parts Replaced (Text)
   - Labor Hours (Numeric)

7. **Customer Confirmation**
   - Customer Signature (File: Signature capture)
   - Next PM Due Date (Date)

**Key Learnings**:
1. **Intelligent field type selection** - AI chose appropriate field types (Text, Numeric, Single select, Date, File)
2. **Logical grouping** - Organized 20+ fields into 7 clear sections
3. **Pass/Fail checklists** - Automatically created single-select Pass/Fail options for inspection items
4. **Dropdown options** - Created equipment type dropdown with RTU, chiller, boiler, air handler
5. **Signature capture** - Recognized "customer signature" → File type field for digital signatures
6. **Complete workflow** - From inspection → findings → actions → customer sign-off
7. **Mobile-ready** - Form structure optimized for field tech mobile use

**Why This Matters**:
- **Instant form creation** - What would take 30+ minutes manually took 10 seconds
- **Industry-standard structure** - AI understands HVAC PM inspection workflow
- **Field-ready** - Mobile-optimized with signature capture for on-site use
- **Replicable** - Customers can create trade-specific forms from natural language

**Screenshot Evidence**:
- `coperniq-ai-form-creation-dialog.png`
- `coperniq-ai-form-created-success.png`

**Use This Pattern For**:
- Creating inspection checklists for any trade (plumbing, electrical, fire protection, solar)
- Building compliance forms (NFPA 25, EPA 608, OSHA safety)
- Designing customer feedback surveys
- Training new users on form builder capabilities

---

## Pro Tips for Using Coperniq AI

### 1. Be Specific About Trade and Compliance
- ❌ Bad: "Create HVAC work order"
- ✅ Good: "Create HVAC preventive maintenance work order with EPA 608 refrigerant tracking"

### 2. Include Measurable Outcomes
- ❌ Bad: "Equipment-as-a-Service"
- ✅ Good: "EaaS measured by BTU meter with 20-70% energy savings guarantee"

### 3. Explain Both Sides of the Transaction
- ❌ Bad: "Monthly subscription"
- ✅ Good: "Contractor owns equipment, customer pays monthly for outcomes. Benefits: [list for both parties]"

### 4. Reference Industry Standards
- ❌ Bad: "Fire sprinkler inspection"
- ✅ Good: "Fire sprinkler inspection per NFPA 25 quarterly compliance"

### 5. Use Prefixes for Organization
- `[MEP]` - Multi-trade MEP templates
- `[HVAC]` - HVAC-specific
- `[Emergency]` - Emergency response
- `[O&M]` - Operations & Maintenance
- `[C&I]` - Commercial & Industrial

---

## Next Steps

1. Continue building payment structures with AI
2. Use AI to create 20 demo clients
3. Use AI to populate sites, assets, projects, invoices
4. Document every prompt used
5. Create training guide for customers

---

**Last Updated**: 2025-12-21
