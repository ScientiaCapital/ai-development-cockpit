# Coperniq AI Setup Prompts - Best Practices

**Purpose**: Document all AI prompts used to set up demo environment so customers can replicate fast setup.

**Updated**: 2025-12-21

---

## Why This Matters

Coperniq's AI capabilities let you build templates, populate data, and configure workflows **10x faster** than manual entry. These prompts show customers exactly how to leverage the AI for their own setup.

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

## Coming: Client Creation Prompts

(Will populate as we create demo clients using AI)

---

## Coming: Asset Population Prompts

(Will populate as we use AI to create equipment records)

---

## Coming: Project Creation Prompts

(Will populate as we use AI to generate historical projects)

---

## Coming: Invoice Generation Prompts

(Will populate as we use AI to create invoice examples)

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
