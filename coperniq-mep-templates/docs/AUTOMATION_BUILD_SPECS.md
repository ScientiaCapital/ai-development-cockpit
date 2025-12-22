# MEP Automation Build Specifications

**Purpose**: Manual build specifications for 7 remaining MEP automations requiring email/SMS/webhook configuration.

**Created**: 2025-12-21

**Status**: 3 MEP automations built, 7 pending manual completion

---

## Current State (Phase 5)

### ✅ Completed Automations (3)

1. **[MEP] HVAC Lead Assignment**
   - Trigger: Request created
   - Action: Update property (assign to sales rep)
   - Status: ✅ WORKING

2. **[MEP] Quote to Job**
   - Trigger: Request phase started
   - Action: Create project
   - Status: ✅ WORKING

3. **[MEP] Job to Invoice**
   - Trigger: Work Order completed
   - Action: (Email configuration pending - see specs below)
   - Status: ⚠️ PARTIALLY BUILT

### ⏳ Incomplete Automations (2)

4. **[MEP] Payment Received**
   - Trigger: Work Order completed (needs webhook configuration)
   - Action: (No actions configured)
   - Status: ⚠️ STARTED - needs webhook trigger + actions

---

## Pending Automations (7) - Manual Build Required

### 1. [MEP] Job to Invoice (Complete Existing)

**Automation ID**: 5734

**Current State**:
- Name: [MEP] Job to Invoice
- Trigger: Work Order marked complete ✅
- From: No Reply - coperniqenergy@coperniq.io ✅
- To: customer@example.com (placeholder - needs merge field)
- Subject: (empty - needs configuration)
- Body: "Dear /Project name" (needs proper merge fields)

**Target Configuration**:

```yaml
Name: "[MEP] Job to Invoice"
Active: true
Trigger:
  Type: "Work Order marked complete"
  Work Order: (All work orders)
  Parent Record: (All projects)
Actions:
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Client > Primary Contact > Email"
    CC: []
    BCC: []
    Subject: "Invoice Ready - {{Project.name}}"
    Body: |
      Dear {{Contact.name}},

      Your project "{{Project.name}}" is complete!

      Invoice #{{Invoice.number}} for ${{Invoice.amount}} is now available.

      Please review and submit payment at your earliest convenience.

      Thank you for your business!

      {{Company.name}}
      {{Company.phone}}
    Attachments:
      - "Send forms added to work order as attachment": true
```

**Build Steps**:
1. Navigate to: https://app.coperniq.io/112/company/studio/automations/5734
2. Click "Edit" on "To" field
3. Select merge field: "Client > Primary Contact > Email"
4. Click "Edit" on "Subject" field
5. Type: "Invoice Ready - " then insert merge field "Project > Name"
6. Click "Edit" on "Body" field
7. Use rich text editor to create professional email template with merge fields
8. Enable "Send forms added to work order as attachment"
9. Click "Save"

---

### 2. [MEP] Payment Received (Fix Trigger + Add Actions)

**Automation ID**: 5735 (already created, needs completion)

**Current State**:
- Name: [MEP] Payment Received
- Trigger: Work Order completed (WRONG - should be webhook)
- Actions: None

**Target Configuration**:

```yaml
Name: "[MEP] Payment Received"
Active: true
Trigger:
  Type: "Webhook received"
  Note: "Requires payment processor webhook integration (Stripe, Square, etc.)"
  Fallback: "If webhook not available, use 'Invoice paid' trigger"
Actions:
  - Type: "Update property"
    Property: "Project > Payment Status"
    Value: "Paid"
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Client > Primary Contact > Email"
    Subject: "Payment Received - Thank You!"
    Body: |
      Dear {{Contact.name}},

      We have received your payment of ${{Invoice.amount}} for invoice #{{Invoice.number}}.

      Thank you for your prompt payment!

      If you have any questions, please contact us at {{Company.phone}}.

      {{Company.name}}
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Accounting Team > Email"
    Subject: "Payment Recorded - {{Project.name}}"
    Body: |
      Payment received for {{Project.name}}:

      Amount: ${{Invoice.amount}}
      Invoice: #{{Invoice.number}}
      Client: {{Client.name}}
      Date: {{Payment.date}}

      Payment has been recorded in the system.
```

**Build Steps**:
1. Navigate to: https://app.coperniq.io/112/company/studio/automations/5735
2. Edit trigger: Change from "Work Order completed" to "Invoice paid" (or webhook if available)
3. Add Action 1: "Update property" → Project > Payment Status → "Paid"
4. Add Action 2: "Send email" → Customer confirmation (use merge fields above)
5. Add Action 3: "Send email" → Accounting notification (use merge fields above)
6. Click "Save"

---

### 3. [MEP] Permit Approved → Install

**Target Configuration**:

```yaml
Name: "[MEP] Permit Approved → Install"
Active: true
Trigger:
  Type: "Project phase started"
  Phase: "Permit Approved" (or "Record Stage Updated" → "Permit Approved")
Actions:
  - Type: "Create Work Order"
    Template: "Installation" (or appropriate field WO template)
    Due Date: "+3 business days" (Dynamic Due Date feature - Jan 2025)
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Client > Primary Contact > Email"
    Subject: "Permit Approved - Installation Scheduled"
    Body: |
      Great news! Your permit has been approved.

      We will be scheduling your installation within the next 3 business days.

      Our installation team will contact you to confirm the date and time.

      {{Company.name}}
  - Type: "Send SMS"
    To:
      - Merge field: "Assigned Technician > Phone"
    Message: "New installation scheduled: {{Project.name}} - {{Site.address}}. Check your work orders."
```

**Build Steps**:
1. Click "Automation" button
2. Name: "[MEP] Permit Approved → Install"
3. Trigger: "Project phase started" or "Record Stage Updated" → Select "Permit Approved"
4. Action 1: "Create Work Order" → Template: "Installation" → Due Date: "+3 business days"
5. Action 2: "Send email" → Customer notification (merge fields above)
6. Action 3: "Send SMS" → Tech notification (merge fields above)
7. Click "Save"

---

### 4. [MEP] Emergency Dispatch

**Target Configuration**:

```yaml
Name: "[MEP] Emergency Dispatch"
Active: true
Trigger:
  Type: "Work Order created"
  Template: "Emergency Service Call" (or any WO with Priority = Emergency)
Actions:
  - Type: "Send SMS"
    To:
      - Merge field: "On-Call Technician > Phone"
    Message: "🚨 EMERGENCY: {{Client.name}} - {{Site.address}} - {{WorkOrder.title}}"
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Dispatch Manager > Email"
    Subject: "EMERGENCY WO Created - {{WorkOrder.title}}"
    Body: |
      Emergency work order created:

      Client: {{Client.name}}
      Site: {{Site.address}}
      Issue: {{WorkOrder.description}}
      Priority: Emergency
      Created: {{WorkOrder.createdAt}}

      Technician has been notified via SMS.
  - Type: "Create Reminder"
    For: "Dispatch Manager"
    Due: "+30 minutes"
    Message: "Check response status for emergency WO: {{WorkOrder.title}}"
  - Type: "Track SLA"
    Note: "Use 'Record Stage SLA Violation' trigger for follow-up if no response"
```

**Build Steps**:
1. Click "Automation" button
2. Name: "[MEP] Emergency Dispatch"
3. Trigger: "Work Order created" → Template: "Emergency Service Call"
4. Action 1: "Send SMS" → On-call tech (merge fields above)
5. Action 2: "Send email" → Dispatch manager (merge fields above)
6. Action 3: "Create Reminder" → Dispatch manager, +30 min
7. Click "Save"

---

### 5. [MEP] PM Due → Create Ticket

**Target Configuration**:

```yaml
Name: "[MEP] PM Due → Create Ticket"
Active: true
Trigger:
  Type: "Record Stage SLA Violation"
  Trigger: "PM schedule overdue" (or Service Plan Instance approaching due date)
Actions:
  - Type: "Create Work Order"
    Template: "Preventive Maintenance"
    Assigned To:
      - Merge field: "Service Plan > Assigned Technician"
    Due Date: "+7 days"
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Client > Primary Contact > Email"
    Subject: "Scheduled Maintenance Due - {{ServicePlan.name}}"
    Body: |
      Your scheduled maintenance visit is due:

      Service Plan: {{ServicePlan.name}}
      Site: {{Site.address}}

      We will contact you within 7 days to schedule this visit.

      {{Company.name}}
  - Type: "Send SMS"
    To:
      - Merge field: "Assigned Technician > Phone"
    Message: "PM visit needed: {{Client.name}} - {{ServicePlan.name}}. Check work orders."
```

**Build Steps**:
1. Click "Automation" button
2. Name: "[MEP] PM Due → Create Ticket"
3. Trigger: "Record Stage SLA Violation" → Select PM-related SLA
4. Action 1: "Create Work Order" → Template: "Preventive Maintenance" → Assign to service tech
5. Action 2: "Send email" → Customer (merge fields above)
6. Action 3: "Send SMS" → Technician (merge fields above)
7. Click "Save"

---

### 6. [MEP] New Customer Welcome

**Target Configuration**:

```yaml
Name: "[MEP] New Customer Welcome"
Active: true
Trigger:
  Type: "Request created"
  Workflow: "New Customer Onboarding" (or "Client created")
Actions:
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Client > Primary Contact > Email"
    Subject: "Welcome to {{Company.name}}!"
    Body: |
      Dear {{Contact.name}},

      Welcome to {{Company.name}}!

      We're excited to work with you. Here's what happens next:

      1. Your dedicated account manager will contact you within 24 hours
      2. We'll schedule your initial consultation
      3. You'll receive access to our customer portal at {{Portal.url}}

      Your portal login:
      Email: {{Contact.email}}
      Temporary Password: (sent separately)

      If you have any immediate questions, call us at {{Company.phone}}.

      Thank you for choosing {{Company.name}}!
  - Type: "Create Reminder"
    For: "Sales Manager"
    Due: "+3 days"
    Message: "Follow up with new customer: {{Client.name}}"
  - Type: "Send SMS"
    To:
      - Merge field: "Client > Primary Contact > Phone"
    Message: "Welcome to {{Company.name}}! Your portal login has been emailed. Questions? Call {{Company.phone}}"
```

**Build Steps**:
1. Click "Automation" button
2. Name: "[MEP] New Customer Welcome"
3. Trigger: "Request created" → Workflow: "New Customer Onboarding"
4. Action 1: "Send email" → Welcome email (merge fields above)
5. Action 2: "Create Reminder" → Sales manager, +3 days
6. Action 3: "Send SMS" → Customer (merge fields above)
7. Click "Save"

---

### 7. [MEP] Negative Review Alert

**Target Configuration**:

```yaml
Name: "[MEP] Negative Review Alert"
Active: true
Trigger:
  Type: "Webhook received"
  Note: "Requires review platform webhook (Google, Yelp, Facebook, etc.)"
  Condition: "Rating < 4 stars"
Actions:
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Operations Manager > Email"
    CC:
      - Merge field: "Customer Service Manager > Email"
    Subject: "⚠️ ALERT: Negative Review - {{Client.name}}"
    Body: |
      NEGATIVE REVIEW RECEIVED:

      Client: {{Client.name}}
      Rating: {{Review.rating}} stars
      Platform: {{Review.platform}}
      Comment: "{{Review.comment}}"
      Date: {{Review.date}}

      ACTION REQUIRED:
      - Respond to review within 24 hours
      - Contact customer to address concerns
      - Document resolution in CRM

      Review Link: {{Review.url}}
  - Type: "Create Reminder"
    For: "Customer Service Manager"
    Due: "+24 hours"
    Message: "Respond to negative review from {{Client.name}}"
  - Type: "Add Comment"
    To: "Project record"
    Comment: "Negative review received on {{Review.platform}} - {{Review.rating}} stars. Manager notified."
```

**Build Steps**:
1. Click "Automation" button
2. Name: "[MEP] Negative Review Alert"
3. Trigger: "Webhook received" (configure webhook URL from review platform)
4. Action 1: "Send email" → Manager alert (merge fields above)
5. Action 2: "Create Reminder" → Customer service manager, +24 hours
6. Action 3: "Add Comment" → Project record (tracking)
7. Click "Save"

**Note**: Webhook configuration requires review platform integration setup first.

---

### 8. [MEP] Contract Renewal

**Target Configuration**:

```yaml
Name: "[MEP] Contract Renewal"
Active: true
Trigger:
  Type: "Record Stage SLA Violation"
  Trigger: "30 days before contract expiration"
  Record Type: "Service Plan Instance"
Actions:
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Client > Primary Contact > Email"
    Subject: "Service Agreement Renewal - {{ServicePlan.name}}"
    Body: |
      Dear {{Contact.name}},

      Your service agreement expires soon:

      Service Plan: {{ServicePlan.name}}
      Expiration Date: {{ServicePlan.endDate}}
      Current Price: ${{ServicePlan.price}}/{{ServicePlan.billingPeriod}}

      We'd love to continue serving you! Your renewal benefits:
      ✓ Same great service
      ✓ Priority scheduling
      ✓ {{ServicePlan.discountPercent}}% renewal discount

      Reply to this email or call {{Company.phone}} to renew.

      {{Company.name}}
  - Type: "Send email"
    From: "No Reply - coperniqenergy@coperniq.io"
    To:
      - Merge field: "Sales Rep > Email"
    Subject: "Renewal Opportunity - {{Client.name}}"
    Body: |
      Service agreement renewal opportunity:

      Client: {{Client.name}}
      Service Plan: {{ServicePlan.name}}
      Current MRR: ${{ServicePlan.monthlyValue}}
      Expires: {{ServicePlan.endDate}}

      Reach out to client to discuss renewal.
  - Type: "Create Reminder"
    For: "Sales Rep"
    Due: "+7 days"
    Message: "Follow up on renewal with {{Client.name}} - {{ServicePlan.name}}"
```

**Build Steps**:
1. Click "Automation" button
2. Name: "[MEP] Contract Renewal"
3. Trigger: "Record Stage SLA Violation" → Select "30 days before expiration"
4. Action 1: "Send email" → Customer renewal offer (merge fields above)
5. Action 2: "Send email" → Sales rep opportunity alert (merge fields above)
6. Action 3: "Create Reminder" → Sales rep, +7 days
7. Click "Save"

---

## Merge Field Reference

### Common Merge Fields by Category

**Client Fields**:
- `{{Client.name}}`
- `{{Client.email}}`
- `{{Client.phone}}`
- `{{Client.status}}`

**Contact Fields**:
- `{{Contact.name}}`
- `{{Contact.email}}`
- `{{Contact.phone}}`
- `{{Contact.title}}`

**Site Fields**:
- `{{Site.address}}`
- `{{Site.fullAddress}}`
- `{{Site.city}}`
- `{{Site.state}}`
- `{{Site.zipcode}}`

**Project Fields**:
- `{{Project.name}}`
- `{{Project.status}}`
- `{{Project.value}}`
- `{{Project.startDate}}`
- `{{Project.endDate}}`

**Work Order Fields**:
- `{{WorkOrder.title}}`
- `{{WorkOrder.description}}`
- `{{WorkOrder.priority}}`
- `{{WorkOrder.status}}`
- `{{WorkOrder.dueDate}}`

**Invoice Fields**:
- `{{Invoice.number}}`
- `{{Invoice.amount}}`
- `{{Invoice.dueDate}}`
- `{{Invoice.status}}`

**Service Plan Fields**:
- `{{ServicePlan.name}}`
- `{{ServicePlan.price}}`
- `{{ServicePlan.startDate}}`
- `{{ServicePlan.endDate}}`
- `{{ServicePlan.status}}`

**Company Fields**:
- `{{Company.name}}`
- `{{Company.phone}}`
- `{{Company.email}}`
- `{{Company.address}}`

**User/Team Fields**:
- `{{AssignedTechnician.name}}`
- `{{AssignedTechnician.phone}}`
- `{{AssignedTechnician.email}}`
- `{{SalesRep.name}}`
- `{{Manager.email}}`

---

## Testing Checklist

After building each automation:

- [ ] Verify trigger configuration matches specification
- [ ] Verify all merge fields are correctly inserted (no broken placeholders)
- [ ] Test with sample data to ensure emails/SMS send correctly
- [ ] Verify email formatting is professional and readable
- [ ] Verify "Active" checkbox is checked
- [ ] Verify automation appears in automation list with correct trigger/action
- [ ] Document automation ID for reference

---

## Completion Tracking

| Automation | Status | ID | Build Time |
|------------|--------|----|----|
| [MEP] HVAC Lead Assignment | ✅ DONE | - | - |
| [MEP] Quote to Job | ✅ DONE | - | - |
| [MEP] Job to Invoice | ⚠️ PARTIAL | 5734 | - |
| [MEP] Payment Received | ⚠️ STARTED | 5735 | - |
| [MEP] Permit Approved → Install | ⏳ PENDING | - | - |
| [MEP] Emergency Dispatch | ⏳ PENDING | - | - |
| [MEP] PM Due → Create Ticket | ⏳ PENDING | - | - |
| [MEP] New Customer Welcome | ⏳ PENDING | - | - |
| [MEP] Negative Review Alert | ⏳ PENDING | - | - |
| [MEP] Contract Renewal | ⏳ PENDING | - | - |

**Progress**: 3/10 automations complete (30%)

---

## Related Documentation

- **COPERNIQ_CAPABILITIES.md** - Full list of automation triggers and actions
- **AUTOMATION_RESEARCH.md** - 25+ automation patterns
- **APP26_ARCHITECTURE.md** - Master build plan
- **AI_PROMPTS_BEST_PRACTICES.md** - Template creation prompts

---

**Last Updated**: 2025-12-21
**Next Steps**: Complete 7 pending automations manually using specifications above
