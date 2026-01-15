# Coperniq AI - Role-Based Workflow Guides

**Created**: 2025-12-21
**Purpose**: Show each persona how to use Coperniq's AI features for maximum efficiency

---

## Overview: AI Features by Role

| Persona | Primary AI Features | Time Savings | Key Workflows |
|---------|-------------------|--------------|---------------|
| **CSR/Receptionist** | Requests (✨), Quotes (✨) | 5-10x faster | Inbound call → Request → Quote |
| **Sales Rep** | Quotes (✨), Projects (✨) | 10x faster | Lead qualification → Proposal → Close |
| **Dispatcher** | Projects (✨), Work Orders (auto) | 10x faster | Project creation → WO auto-generation |
| **Field Tech** | Assets (✨), Forms (mobile) | 8x faster | Equipment survey → Asset creation |
| **Project Manager** | Projects (✨), Work Orders (auto) | 10x faster | Project kickoff → Phase tracking |
| **Accountant** | Invoices (✨) | 5x faster | Job completion → Invoice generation |
| **Service Manager** | Assets (✨), Forms (✨) | 8-30x faster | PM visits → Equipment tracking |
| **Executive** | (Insights from AI-created data) | N/A | Dashboard analytics |

---

## 1. CSR/Receptionist - AI Workflow

### Role: First point of contact for inbound leads

### AI Features Available:
- ✅ **Request Creation** (✨ Ask AI)
- ✅ **Quote Creation** (✨ Ask AI)

### Typical Day Workflow:

#### Morning: Process Overnight Web Leads
```
1. Phone rings: "My AC stopped working last night"
2. Navigate to: Sales → Request Portfolio → "+ REQUEST" → "✨ Ask AI"
3. Type while listening: "Emergency AC repair for John Smith at 123 Main St, Phoenix AZ. AC stopped cooling last night. Customer needs same-day service. Prefers afternoon appointment."
4. AI extracts:
   - ✅ Customer: John Smith
   - ✅ Location: Phoenix, AZ
   - ✅ Service Type: Emergency AC Repair
   - ✅ Urgency: Same-day
   - ✅ Requested Time: Afternoon
5. Select client from dropdown (or create new if first-time customer)
6. Click "Create" → Request created in 30 seconds
7. Dispatcher gets notified automatically
```

**Time Savings**: 5 minutes manual → 30 seconds AI = **10x faster**

#### Afternoon: Convert Requests to Quotes
```
1. Sales rep asks: "Can you send a quote to Mrs. Johnson for the AC tune-up?"
2. Navigate to: Sales → Request Portfolio → Find Mrs. Johnson's request
3. Click "+ QUOTE" → "✨ Ask AI"
4. Type: "Annual AC tune-up for Mrs. Johnson. Includes: filter replacement, refrigerant check, thermostat calibration, condenser coil cleaning, electrical connection inspection. Price: $150. Valid for 30 days."
5. AI extracts:
   - ✅ Line items with descriptions
   - ✅ Pricing: $150
   - ✅ Validity: 30 days
   - ✅ Professional description auto-generated
6. Review → Click "Send" → Quote emailed to customer
```

**Time Savings**: 10 minutes manual → 1 minute AI = **10x faster**

### Pro Tips:
- **Keep phone notes handy** - Copy/paste conversation summaries into AI prompts
- **Use templates for common requests** - "Emergency AC repair", "Annual PM", "New install quote"
- **Let AI expand descriptions** - Brief notes become professional proposals
- **Manual client selection required** - AI doesn't auto-match clients (yet), but Google Places autocompletes addresses

---

## 2. Sales Rep - AI Workflow

### Role: Lead qualification → Proposal → Close

### AI Features Available:
- ✅ **Quote Creation** (✨ Ask AI)
- ✅ **Project Creation** (✨ Ask AI)

### Typical Day Workflow:

#### Morning: Create Proposals from Site Visits
```
1. Just finished site survey at commercial building
2. Navigate to: Sales → Request Portfolio → "+ QUOTE" → "✨ Ask AI"
3. Paste site survey notes:
   "Replace 4x aging Carrier RTUs (15-ton each) at Downtown Office Tower, San Francisco. Building is 50,000 sq ft, 4-story office. Current units are 18 years old, frequent breakdowns. Quote includes: Equipment (4x Carrier 15-ton RTUs @ $8,500 each), Labor (Installation, rigging, ductwork modifications), Startup & commissioning, 1-year warranty. Total: $48,000. 50/50 payment terms (M1: Equipment delivery, M2: Final commissioning). Lead time: 6-8 weeks."
4. AI extracts:
   - ✅ Client: Downtown Office Tower LLC
   - ✅ Equipment details: 4x Carrier 15-ton RTUs
   - ✅ Line items with unit pricing
   - ✅ Payment terms: 50/50 split
   - ✅ Timeline: 6-8 weeks
5. Review → Adjust margins → Send to client
```

**Time Savings**: 45 minutes manual → 3 minutes AI = **15x faster**

#### Afternoon: Convert Won Quotes to Projects
```
1. Customer accepted quote! Time to create project.
2. Navigate to: Projects → "+ PROJECT" → "✨ Ask AI"
3. Paste quote details + add specifics:
   "Downtown Office Tower RTU replacement project. Client: Downtown Office Tower LLC, San Francisco. Replace 4x Carrier 15-ton RTUs. Contract value: $48,000 (50% deposit, 50% at commissioning). Workflow: HVAC Commercial Install. Project manager: Tim Kipper. Start date: January 15, 2025. Expected completion: March 1, 2025. Trades: HVAC. Includes rigging, ductwork, electrical, startup."
4. AI extracts:
   - ✅ Client: Downtown Office Tower LLC (auto-matched)
   - ✅ Site: San Francisco office building (auto-matched)
   - ✅ Trades: HVAC
   - ✅ Workflow: HVAC Commercial Install
   - ✅ Project value: $48,000
   - ✅ PM: Tim Kipper
   - ✅ Timeline: Jan 15 - Mar 1, 2025
5. Click "Create" → Project created
6. **Work Orders auto-generated**:
   - Site Survey (if not done)
   - Permitting
   - Equipment Procurement
   - Installation
   - Commissioning
   - Customer Handoff
```

**Time Savings**: 30 minutes manual → 2 minutes AI = **15x faster**

**BONUS**: Work orders automatically created from workflow = **Additional 1 hour saved**

### Pro Tips:
- **Paste site survey notes directly** - Photos, measurements, customer requests
- **Include contract terms** - Payment milestones, timelines, warranties
- **Let AI match existing clients** - No need to search dropdowns
- **Workflow selection is critical** - Correct workflow = correct work orders auto-generated

---

## 3. Dispatcher - AI Workflow

### Role: Schedule field techs, assign work orders

### AI Features Available:
- ✅ **Project Creation** (✨ Ask AI) → Auto-generates work orders
- ⚠️ **Work Orders** (Auto-generated from projects)

### Typical Day Workflow:

#### Morning: Emergency Service Dispatch
```
1. Emergency call: "AC not cooling at Retail Plaza"
2. Navigate to: Projects → "+ PROJECT" → "✨ Ask AI"
3. Type while on phone:
   "Emergency AC repair at Retail Plaza Management, Dallas TX. Customer reports AC Unit #3 (RTU-3, Carrier 10-ton) not cooling. Building temp 85°F. Requested same-day service. Dispatch priority tech."
4. AI extracts:
   - ✅ Client: Retail Plaza Management (auto-matched)
   - ✅ Site: Dallas TX shopping center (auto-matched)
   - ✅ Equipment: RTU-3, Carrier 10-ton
   - ✅ Issue: Not cooling
   - ✅ Urgency: Same-day
5. Select workflow: "Emergency Service Call"
6. Click "Create" → Project + Emergency WO auto-generated
7. Assign WO to available tech in "Today's Schedule" Hub view
8. Tech gets SMS notification automatically
```

**Time Savings**: 15 minutes manual → 1 minute AI = **15x faster**

#### Afternoon: PM Schedule Population
```
1. Service manager says: "Sarah Martinez is due for her annual PM"
2. Navigate to: Projects → "+ PROJECT" → "✨ Ask AI"
3. Type:
   "Annual HVAC PM visit for Sarah Martinez in Phoenix, AZ. Bronze service plan (1 visit/year). Inspect and service Trane XR14 3-ton AC unit, serial A12345678. Replace air filter, check refrigerant (R-410A), test thermostat. Schedule for next week."
4. AI extracts:
   - ✅ Client: Sarah Martinez (auto-matched)
   - ✅ Site: Phoenix, AZ (auto-matched)
   - ✅ Service plan: Bronze
   - ✅ Equipment: Trane XR14, 3-ton, serial A12345678
   - ✅ Tasks: Filter, refrigerant, thermostat
5. Select workflow: "HVAC Residential Service"
6. Click "Create" → PM work order auto-generated
7. Assign to tech with availability next week
```

**Time Savings**: 20 minutes manual → 2 minutes AI = **10x faster**

### Pro Tips:
- **Use AI for all project creation** - Even simple service calls = work orders auto-generated
- **Paste customer complaints verbatim** - AI extracts equipment details, urgency, symptoms
- **Workflow selection drives WO types** - Emergency workflow = different WOs than PM workflow
- **Hub views show unassigned WOs** - Filter by "Unassigned Work Orders" to see AI-created WOs needing assignment

---

## 4. Field Technician - AI Workflow

### Role: On-site service, equipment surveys, PM visits

### AI Features Available:
- ✅ **Asset Creation** (✨ Ask AI)
- ✅ **Form Completion** (Mobile-optimized)

### Typical Day Workflow:

#### On-Site: Equipment Survey
```
1. Arrive at new customer site (first PM visit)
2. Walk around building, take photos, note equipment details
3. Open Coperniq mobile app → Assets → "+ ASSET" → "✨ Ask AI"
4. Dictate or type equipment details:
   "Carrier 4-ton AC unit, model 24ACB4, installed 2018. Serial number 1234XYZ5678. Located on south-facing roof. R-410A refrigerant. Condensing unit + air handler. Last service sticker shows 2023. Unit appears well-maintained, no visible corrosion. Expected lifetime 15-20 years."
5. AI extracts:
   - ✅ Type: Air Conditioner
   - ✅ Manufacturer: Carrier
   - ✅ Model: 24ACB4
   - ✅ Serial: 1234XYZ5678
   - ✅ Size: 4 tons
   - ✅ Installation date: 2018
   - ✅ Expected lifetime: 15-20 years
   - ✅ Description: Auto-generated with all details
6. Take photo of nameplate → Attach to asset
7. Select client + site from dropdown → Click "Create"
8. Asset added to customer's equipment database
```

**Time Savings**: 10 minutes manual → 1 minute AI = **10x faster**

**BONUS**: Asset now linked for future PM scheduling, warranty tracking, parts ordering

#### PM Visit: Complete Inspection Form
```
1. Complete PM visit (filter change, refrigerant check, etc.)
2. Open Coperniq mobile → Forms → "HVAC PM Inspection"
3. Fill mobile-optimized form:
   - Technician: Auto-filled (your name)
   - Date: Auto-filled (today)
   - Client: Select from recent
   - Equipment: Select from customer's assets (created via AI earlier!)
   - Visual Inspection: Tap Pass/Fail buttons for belts, filters, leaks, connections
   - Temperature Readings: Enter supply/return/outdoor temps
   - Operational Tests: Tap Pass/Fail for compressor, fan, thermostat
   - Deficiencies: Type any issues found
   - Customer Signature: Capture on mobile screen
4. Click "Submit" → Form attached to project
5. Office automatically sees completed PM for invoicing
```

**Time Savings**: Paper forms + manual data entry (30 min) → Mobile form (5 min) = **6x faster**

### Pro Tips:
- **Create assets on FIRST visit** - Future PMs will auto-link equipment
- **Use voice dictation for AI prompts** - Speak equipment details while standing in front of unit
- **Take nameplate photos** - Attach to assets for warranty/parts lookup
- **Forms auto-link to projects** - No manual data entry for billing

---

## 5. Project Manager - AI Workflow

### Role: Oversee projects from kickoff to closeout

### AI Features Available:
- ✅ **Project Creation** (✨ Ask AI)
- ⚠️ **Work Orders** (Auto-generated from project workflow)

### Typical Day Workflow:

#### Project Kickoff
```
1. Sales handed off new commercial HVAC install project
2. Navigate to: Projects → "+ PROJECT" → "✨ Ask AI"
3. Paste sales notes + add PM details:
   "DataCenter Midwest LLC - Precision cooling upgrade. Tier III data center in Chicago. Replace aging Liebert units with new Vertiv precision cooling (N+1 redundancy). Contract: $250,000 (M1: 30% engineering, M2: 40% equipment/install, M3: 30% commissioning). Timeline: 90 days. Requires: Mechanical drawings, AHJ permit (Chicago), Hot/cold aisle verification, 24/7 monitoring integration. PM: Tim Kipper. Critical path: Long-lead Vertiv equipment (12 weeks)."
4. AI extracts:
   - ✅ Client: DataCenter Midwest LLC (auto-matched)
   - ✅ Site: Chicago data center (auto-matched)
   - ✅ Project value: $250,000
   - ✅ Payment milestones: 30/40/30
   - ✅ Timeline: 90 days
   - ✅ PM: Tim Kipper
   - ✅ Critical requirements extracted
5. Select workflow: "Mission-Critical HVAC Install"
6. Click "Create" → Project + work orders auto-generated:
   - Engineering (Mechanical drawings, load calcs)
   - Permitting (Chicago AHJ submittal)
   - Equipment Procurement (12-week Vertiv lead time)
   - Installation (Hot/cold aisle work)
   - Commissioning (24/7 monitoring, redundancy testing)
   - Customer Training
7. Each WO has due dates, phases, and can be assigned to team members
```

**Time Savings**: 2 hours manual project setup → 5 minutes AI = **24x faster**

#### Mid-Project: Track Progress
```
1. Check project status in "Active Projects" Hub view
2. See work orders organized by phase:
   - ✅ Engineering: Complete (drawings approved)
   - 🔄 Permitting: In progress (waiting on AHJ)
   - ⏳ Procurement: Pending (Vertiv ETA: 2 weeks)
   - ⏳ Installation: Blocked (waiting on equipment)
3. Update WO statuses as milestones complete
4. Customer sees real-time progress in Client Portal
```

### Pro Tips:
- **Include payment milestones in AI prompt** - M1/M2/M3 splits auto-populate
- **Mention critical path items** - Long-lead equipment, permit dependencies
- **Workflow selection drives WO structure** - Mission-critical workflows include redundancy testing, 24/7 monitoring
- **Work orders track actual vs. estimated** - Real-time budget vs. actuals visibility

---

## 6. Accountant - AI Workflow

### Role: Invoicing, AR/AP, financial reporting

### AI Features Available:
- ✅ **Invoice Creation** (✨ Ask AI)

### Typical Day Workflow:

#### Morning: Batch Invoice Creation from Completed Jobs
```
1. Dispatcher says: "3 PM visits completed yesterday, ready to invoice"
2. Navigate to: Invoices & Bills → "+ INVOICE" → "✨ Ask AI"
3. For each completed job, paste field tech notes:
   "Invoice Sarah Martinez for annual PM visit completed 12/20/2025. Technician replaced air filter, checked refrigerant levels (R-410A, within spec), tested thermostat calibration. All systems operating normally. Bronze service plan (annual visit included). Total: $150 (labor only, filter included in plan)."
4. AI extracts:
   - ✅ Client: Sarah Martinez
   - ✅ Service date: 12/20/2025
   - ✅ Description: Professional summary of services
   - ✅ Line items: PM Visit Labor @ $150
   - ✅ Total: $150
5. Select client from dropdown → Click "Create"
6. Invoice #228 generated, emailed to customer
7. Repeat for next 2 PM visits
```

**Time Savings per invoice**: 15 minutes manual → 2 minutes AI = **7.5x faster**

**Batch savings**: 45 minutes for 3 invoices → 6 minutes = **7.5x faster**

#### Afternoon: Invoice Commercial Project Milestone
```
1. PM says: "Downtown Office Tower M1 (equipment delivery) is complete"
2. Navigate to: Invoices & Bills → "+ INVOICE" → "✨ Ask AI"
3. Paste milestone details:
   "Invoice Downtown Office Tower LLC for Milestone 1: Equipment Delivery (50% of $48,000 contract). Delivered 4x Carrier 15-ton RTUs to San Francisco location. Equipment inspected and accepted by customer. Payment terms: Net 15 days. Due date: January 15, 2025."
4. AI extracts:
   - ✅ Client: Downtown Office Tower LLC
   - ✅ Milestone: M1 Equipment Delivery
   - ✅ Amount: $24,000 (50% of $48,000)
   - ✅ Payment terms: Net 15
   - ✅ Due date: 1/15/2025
5. Click "Create" → Invoice #229 sent
6. Customer gets payment link for online payment
```

**Time Savings**: 20 minutes manual → 3 minutes AI = **6.7x faster**

### Pro Tips:
- **Paste field tech notes verbatim** - AI turns technician notes into professional invoices
- **Include payment terms** - Net 15, Net 30, Due on receipt = AI calculates due dates
- **Service plans auto-apply discounts** - AI recognizes "included in plan" items
- **Batch invoicing is fastest** - Queue up 5-10 completed jobs, AI-create all at once

---

## 7. Service Manager - AI Workflow

### Role: Manage service plans, PM schedules, renewals

### AI Features Available:
- ✅ **Asset Creation** (✨ Ask AI)
- ✅ **Form Creation** (✨ Ask AI)
- ✅ **Project Creation** (✨ Ask AI) for PM scheduling

### Typical Day Workflow:

#### Morning: PM Schedule for This Month
```
1. Review "PM Visits Due" Hub view
2. See 15 customers due for quarterly PM (Gold plan)
3. For each customer, navigate to: Projects → "+ PROJECT" → "✨ Ask AI"
4. Bulk create PM visits:
   "Quarterly PM visit for Jennifer Williams in Atlanta, GA. Gold service plan (quarterly visits). Inspect Lennox heat pump, model EL16XP1-036-230-06, 3-ton. Replace filter, check refrigerant, test defrost cycle, inspect heat strips. Schedule for week of December 23rd."
5. AI creates project + PM work order
6. Repeat for all 15 customers (or use batch mode)
7. Assign all PM WOs to available techs
```

**Time Savings per PM**: 10 minutes manual → 1 minute AI = **10x faster**

**Monthly savings**: 150 minutes for 15 PMs → 15 minutes = **10x faster**

#### Afternoon: Create New Service Plan Inspection Form
```
1. Sales wants new "Electrical Panel Safety Inspection" form for new service plan
2. Navigate to: Process Studio → Forms → "+ TEMPLATE" → "✨ Ask AI"
3. Describe form requirements:
   "Create electrical panel safety inspection form per NFPA 70. Include: Inspector name, date, client, panel location, panel rating (amps), number of circuits, visual inspection (corrosion, overheating, loose connections, labeling), thermal imaging (hot spots), torque testing, load calculations, deficiencies found, corrective actions, customer signature, next inspection due date."
4. AI generates form with:
   - 6 sections (Inspector Info, Panel Details, Visual Inspection, Testing, Findings, Sign-off)
   - 18 fields (text, numeric, pass/fail checklists, signature capture)
   - Mobile-optimized for field tech use
5. Review → Click "Save" → Form ready for field techs
```

**Time Savings**: 45 minutes manual form building → 2 minutes AI = **22.5x faster**

### Pro Tips:
- **Batch PM scheduling** - Create all monthly PMs in one sitting using AI
- **AI-generated forms are mobile-ready** - Immediate field tech deployment
- **Asset database drives PM scheduling** - Equipment age/service history auto-tracked
- **Service plan renewals** - AI can generate renewal quotes 30 days before expiration

---

## 8. Executive / Owner - AI-Powered Insights

### Role: Business oversight, strategic decisions

### AI Features Indirectly Benefit:
- **Dashboard Analytics** powered by AI-created data
- **Real-time insights** from standardized AI data entry
- **Accurate forecasting** because data is consistent

### Typical Day Workflow:

#### Morning: Business Health Review
```
1. Open "Executive Dashboard" Hub
2. See KPIs populated from AI-created data:
   - Revenue MTD: $124,500 (from AI-created invoices)
   - Gross margin: 38% (from AI-created projects with accurate costs)
   - Sales pipeline: 12 active quotes (from AI-created quotes)
   - Jobs in progress: 8 (from AI-created projects)
   - AR aging: $45,000 current, $12,000 30-day (from AI-created invoices)
3. All data is accurate because AI enforces consistency:
   - Proper client matching (no duplicates)
   - Standardized service descriptions
   - Correct equipment specifications
   - Professional invoice formatting
```

**Business Impact**: Accurate, real-time dashboards = better decisions

#### Afternoon: Strategic Planning
```
1. Review "Service Plan Revenue" in Service Manager Hub
2. See MRR (Monthly Recurring Revenue) trends:
   - Bronze: 45 customers @ $30/month = $1,350 MRR
   - Silver: 28 customers @ $50/month = $1,400 MRR
   - Gold: 12 customers @ $100/month = $1,200 MRR
   - Platinum: 5 customers @ $200/month = $1,000 MRR
   - Total MRR: $4,950
3. Identify upsell opportunities:
   - 15 Bronze customers eligible for Silver upgrade
   - 8 Silver customers with 2+ emergency calls (upgrade to Gold)
4. Sales team gets targeted upsell list
```

**Business Impact**: Data-driven upsells = 20-30% MRR growth

### Pro Tips for Executives:
- **Insist on AI usage** - Consistent data = accurate dashboards
- **Monitor AI adoption by role** - Track which teams use AI features most
- **Review AI-created quotes** - Ensure pricing is competitive and profitable
- **Use dashboards for goal-setting** - Real-time data enables weekly goal tracking

---

## Cross-Role AI Efficiency Patterns

### Pattern 1: Sales → Dispatch → Field → Accounting Loop
```
1. CSR (AI-creates Request): Customer inquiry → 30 seconds
2. Sales Rep (AI-creates Quote): Proposal → 3 minutes
3. Sales Rep (AI-creates Project): Won deal → 2 minutes
   ↓ (Work orders auto-generated)
4. Dispatcher: Assigns WOs to techs → 1 minute
5. Field Tech (AI-creates Assets): Equipment survey → 1 minute per unit
6. Field Tech: Completes mobile forms → 5 minutes
7. Accountant (AI-creates Invoice): Completed job → 2 minutes
```

**Total time**: 14.5 minutes for full customer lifecycle

**Without AI**: 3-4 hours for same lifecycle

**Improvement**: **12-16x faster**

---

### Pattern 2: Service Plan Enrollment → PM Scheduling → Renewal
```
1. Sales Rep (AI-creates Project): New service plan enrollment → 2 minutes
2. Service Manager (AI-creates Assets): Equipment inventory → 5 minutes (5 units)
3. Service Manager (AI-creates PM Projects): Quarterly PMs scheduled → 4 minutes (4 visits/year)
4. Field Techs: Complete PM visits with mobile forms → 20 minutes/visit
5. Accountant (AI-creates Invoices): Monthly billing → 2 minutes
6. Service Manager: Renewal quote (AI-create Quote) → 3 minutes
```

**Recurring value**: Customer stays for 5+ years with AI-powered service

**Without AI**: Manual tracking = missed PMs, lost renewals

**Improvement**: **90% customer retention** (vs 60% industry average)

---

## Training Recommendations

### New Employee Onboarding (Day 1)
1. **CSRs**: Train on Request creation (✨ Ask AI) first
2. **Sales Reps**: Train on Quote → Project workflow
3. **Dispatchers**: Train on Project creation → WO auto-generation
4. **Field Techs**: Train on Asset creation + mobile forms
5. **Accountants**: Train on Invoice creation last (after field work complete)

### Ongoing Training (Monthly)
- Share "AI Power User" examples from top performers
- Show time savings metrics per role
- Highlight AI-created records with best practices
- Cross-train roles on AI features (CSR learns Invoicing, Accountant learns Quotes)

### Metrics to Track
- **AI adoption rate** by role (% of records created via AI)
- **Time savings** per role (manual avg time vs. AI avg time)
- **Data quality** (duplicate clients, missing fields, incomplete descriptions)
- **Customer satisfaction** (faster response times, professional documentation)

---

## Conclusion: AI-First Culture

**Goal**: Make AI-assisted creation the DEFAULT, manual entry the EXCEPTION.

**Why This Matters**:
- **10x faster data entry** across all roles
- **Consistent, professional documentation** for customers
- **Real-time insights** for executives (accurate dashboards)
- **Scalable operations** (handle 2x workload without adding headcount)

**Next Steps**:
1. Train all employees on AI features for their role (1 hour each)
2. Set AI adoption targets (80% of new records via AI within 30 days)
3. Monitor metrics and celebrate wins
4. Continuously improve prompts based on team feedback

---

**Last Updated**: 2025-12-21
**Status**: Production-ready training guide for all 8 personas
