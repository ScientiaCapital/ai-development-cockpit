# Coperniq ACTUAL Capabilities - What We Can Build NOW

**Updated**: 2025-12-21
**Source**: https://coperniq.canny.io/changelog
**Purpose**: Build REAL automations using ACTUAL Coperniq features

---

## Feature Availability Matrix

### AVAILABLE NOW (Use These!)

| Feature | Release Date | How to Use |
|---------|-------------|------------|
| **AI-Assisted Invoicing** | Dec 15, 2025 | Auto-generate invoices from work orders |
| **Payment Links + Invoice Emailing** | Dec 11, 2025 | Send payment links, attach invoice PDFs |
| **AI-Assisted Workflow Creation** | Dec 11, 2025 | Use AI to build workflows faster |
| **Manual Workflow Ordering** | Dec 11, 2025 | Reorder workflows to match operations |
| **Backdate Invoices** | Dec 11, 2025 | Set invoice dates retroactively |
| **Timesheets on Mobile** | Dec 11, 2025 | Technicians log time in field |
| **AI-Assisted Text Input** | Dec 11, 2025 | AI helps write descriptions, notes |
| **Phone Call Mute** | Dec 11, 2025 | Mute during calls in Coperniq |
| **Form Folders** | Oct 7, 2025 | Organize form photos by folder |
| **Work List 2.0 (Unified)** | Oct 7, 2025 | WOs, forms, reminders, action items in one view |
| **Sales Handoff → WO** | Oct 7, 2025 | One-click: Request → Project/Service WO |
| **Coperniq AI Copilot** | Oct 7, 2025 | AI understands client/request/project records |
| **Dynamic WO Due Dates** | Jan 27, 2025 | Set deadlines relative to creation (e.g., "+3 days") |
| **Enhanced Automation Triggers** | Jan 27, 2025 | Trigger on workflow creation, template used |
| **Template-Specific Triggers** | Jan 27, 2025 | Trigger when specific WO template used |
| **Geolocation Notifications** | Nov 2024 | Location-based alerts |
| **Task Dependencies** | Nov 2024 | Workflow progression logic |
| **Configurable Visit Reminders** | Nov 2024 | Custom notification timing |

---

## Automation Triggers Available

Based on Coperniq's automation system:

### Record-Based Triggers
- **Record Stage Updated** - When a project/request moves to a new stage
- **Record Stage SLA Violation** - When SLA is breached
- **Work Order Status Updated** - When WO status changes
- **Project/Request Created with Workflow** - When created using specific workflow
- **Work Order Created with Template** - When created using specific template

### Actions Available
- **Send Email** - With tokens for dynamic content
- **Send SMS** - Customer notifications
- **Call Webhook** - External integrations
- **Create Comment** - Add notes to records
- **Create Reminder** - Schedule follow-ups
- **Update Status** - Change WO/project status

---

## 10 REAL Automations to Build in Coperniq

### 1. Lead Assignment Automation
**Trigger**: Request Created with Workflow = "Inbound Lead"
**Action**:
- Send Email to sales rep (assigned by territory)
- Create Reminder: "Follow up in 2 hours"
- SMS to customer: "Thanks for your inquiry! We'll call you within 2 hours."

### 2. Quote Approved → Create Job
**Trigger**: Record Stage Updated = "Quote Approved"
**Action**:
- Create Project (via webhook to internal API)
- Send Email to customer: "Quote approved! Scheduling your installation."
- Send Email to operations: "New job ready for scheduling"
- Create Reminder: "Schedule installation within 48 hours"

### 3. Job Complete → Send Invoice
**Trigger**: Work Order Status Updated = "Complete"
**Action**:
- **Use AI-Assisted Invoicing** (new Dec 2025 feature!)
- Email invoice with payment link (new Dec 2025 feature!)
- Create Reminder: "Follow up if unpaid in 7 days"

### 4. Payment Received → Update Status
**Trigger**: (via webhook from payment processor)
**Action**:
- Update project status to "Paid"
- Send Email to customer: "Payment received! Thank you."
- Send Email to accounting: "Payment recorded"

### 5. Permit Approved → Schedule Install
**Trigger**: Record Stage Updated = "Permit Approved"
**Action**:
- Create Work Order with template = "Installation"
- Set Dynamic Due Date = "+3 business days" (Jan 2025 feature!)
- Send Email to customer: "Permit approved! Scheduling your install."
- SMS to assigned tech: "New installation scheduled"

### 6. Emergency Work Order Dispatch
**Trigger**: Work Order Created with Template = "Emergency"
**Action**:
- SMS to on-call technician: "EMERGENCY: [Customer Name] - [Issue]"
- Send Email to dispatch manager: "Emergency WO created"
- Create Reminder: "Check response in 30 minutes"
- **Set SLA timer** (track with Record Stage SLA Violation trigger)

### 7. PM Due → Create Service Ticket
**Trigger**: Record Stage SLA Violation (PM schedule overdue)
**Action**:
- Create Work Order with template = "Preventive Maintenance"
- Send Email to customer: "Your scheduled maintenance is due"
- SMS to assigned tech: "PM visit needed"

### 8. Customer Portal Welcome
**Trigger**: Record Created with Workflow = "New Customer Onboarding"
**Action**:
- Send Email: "Welcome to [Company]! Here's your portal access."
- Create Reminder: "Call customer in 3 days for check-in"
- Send SMS: "Welcome! Your portal login has been emailed."

### 9. Review Alert (Negative Feedback)
**Trigger**: (via webhook from review platform)
**Action**:
- Send Email to manager: "ALERT: Negative review from [Customer]"
- Create Reminder: "Respond to review within 24 hours"
- Add Comment to project record: "Negative review received"

### 10. Contract Renewal Reminder
**Trigger**: Record Stage SLA Violation (30 days before contract expires)
**Action**:
- Send Email to customer: "Your service agreement expires soon"
- Send Email to sales rep: "Renewal opportunity"
- Create Reminder: "Follow up on renewal in 7 days"

---

## Using the NEW AI Features (Dec 2025)

### AI-Assisted Invoicing
1. Complete the work order
2. Click "Create Invoice"
3. AI pre-fills line items from WO tasks, materials, labor
4. Review and send with payment link

### AI-Assisted Workflow Creation
1. Go to Process Studio
2. Click "Create Workflow"
3. Describe what you want: "HVAC installation workflow with permit tracking"
4. AI generates stages, tasks, and transitions
5. Review and customize

### AI Copilot for Records
1. Open any client, request, or project
2. Ask questions: "What's the status of this customer's pending quotes?"
3. AI analyzes record history and communications
4. Get answers with citations to source data

### AI-Assisted Text Input
1. In any rich text field (notes, descriptions)
2. Start typing or click AI assist
3. AI helps complete sentences, fix grammar, suggest wording

---

## Sales Handoff Workflow (Oct 2025 Feature)

**One-Click Request → Project/Service WO**

Perfect for MEP contractors:
1. Sales qualifies lead in Request
2. Clicks "Create Project" or "Create Service WO"
3. All customer info, site details, notes transfer automatically
4. No re-entry, no lost information

**Use Case**: Solar quote approved → Instantly create installation project with all site survey data

---

## Dynamic Due Dates (Jan 2025 Feature)

Instead of hardcoding dates, set relative deadlines:

| Scenario | Dynamic Due Date |
|----------|------------------|
| Emergency | Created + 2 hours |
| High Priority | Created + 4 hours |
| Standard Service | Created + 24 hours |
| PM Visit | Created + 48 hours |
| Installation | Permit Approved + 3 business days |

---

## Form Folders for MEP Compliance (Oct 2025 Feature)

Organize form photos by type for easy compliance retrieval:

| Folder | Contents |
|--------|----------|
| `/Before Photos` | Pre-work documentation |
| `/Equipment Labels` | Serial numbers, model plates |
| `/Completed Work` | After photos |
| `/Permits` | Permit cards, inspection stickers |
| `/Safety` | Safety equipment, PPE verification |
| `/Compliance` | EPA 608 certs, NFPA docs |

---

## Work List 2.0 - Unified View

Single view for technicians:
- Work Orders
- Forms to complete
- Reminders
- Action Items

**MEP Use Case**: Technician sees all tasks for the day in one place:
- "Complete AC Maintenance" (WO)
- "Submit Refrigerant Tracking Form" (Form)
- "Follow up on quote" (Reminder)
- "Order replacement filter" (Action Item)

---

## Integration Points (Webhooks)

Coperniq can call webhooks for external integrations:

| Trigger | Webhook Target | Purpose |
|---------|----------------|---------|
| Quote Approved | Accounting system | Create invoice draft |
| WO Complete | Inventory system | Deduct parts used |
| Payment Received | CRM | Update customer status |
| New Customer | Email marketing | Add to welcome sequence |
| Negative Review | Slack | Alert management |
| SLA Violation | PagerDuty | Escalate to on-call |

---

## Building the 10 Automations in Coperniq

### Step-by-Step Process

1. **Navigate to**: Workspace Settings → Automations
2. **Click**: Create Automation
3. **Select Trigger**: Choose from available triggers
4. **Configure Conditions**: Filter by workflow, template, stage, etc.
5. **Add Actions**: Email, SMS, Webhook, Comment, Reminder
6. **Use Tokens**: Hit "/" to insert dynamic data (customer name, WO number, etc.)
7. **Test**: Run on test record
8. **Activate**: Enable for production

### Token Examples (Use "/" to insert)
- `{{customer.name}}` - Customer's name
- `{{project.title}}` - Project title
- `{{workOrder.number}}` - WO number
- `{{workOrder.dueDate}}` - Due date
- `{{site.address}}` - Site address
- `{{assignee.name}}` - Assigned technician

---

## Coperniq vs Competitors - REAL Comparison

| Feature | Coperniq | ServiceTitan | Housecall Pro |
|---------|----------|--------------|---------------|
| AI-Assisted Invoicing | ✅ Dec 2025 | ✅ | ❌ |
| Payment Links in Email | ✅ Dec 2025 | ✅ | ✅ |
| AI Workflow Creation | ✅ Dec 2025 | ❌ | ❌ |
| Dynamic Due Dates | ✅ Jan 2025 | ❌ | ❌ |
| Template-Based Triggers | ✅ Jan 2025 | ✅ | ❌ |
| Sales → WO Handoff | ✅ Oct 2025 | ✅ | ❌ |
| AI Record Copilot | ✅ Oct 2025 | ✅ (Atlas) | ❌ |
| Multi-Trade Native | ✅ | ❌ | ❌ |
| Solar/Energy Focus | ✅ | ❌ | ❌ |
| Incentive Tracking | ✅ | ❌ | ❌ |
| SREC Compliance | ✅ | ❌ | ❌ |

---

## Next Steps

1. **Build 10 automations** using triggers + actions above
2. **Use AI-Assisted Workflow** to speed up Process Studio work
3. **Configure Form Folders** for compliance documentation
4. **Set Dynamic Due Dates** for SLA enforcement
5. **Enable Payment Links** for faster collections
6. **Create Demo Workflow** showing all these features to prospects

---

**Source**: https://coperniq.canny.io/changelog
**Last Updated**: 2025-12-21
