# Client Delivery Playbook - MEP Template Services

**Version:** 1.0
**Created:** 2025-12-20
**Author:** Scientia Capital / I Know AI, LLC

---

## Executive Summary

This playbook defines how we deliver MEP template packages to field service management platforms and their customers. Our first client is **Coperniq**, where Tim Kipper serves as Sr. BDR with GTM aspirations.

---

## Business Model

### What We Sell

| Product | Description | Price Range |
|---------|-------------|-------------|
| **MEP Template Package** | 30+ inspection forms, work orders, service plans | $8,000-15,000 |
| **Single Trade Package** | HVAC, Plumbing, Electrical, or Fire Protection | $2,500-5,000 |
| **Platform Integration** | Automated seeding scripts for any FSM platform | $10,000-20,000 |
| **White-Label License** | Platform can resell to their customers | $25,000 + royalties |

### Who We Sell To

```
┌─────────────────────────────────────────────────────────────────┐
│                    TARGET CUSTOMER SEGMENTS                      │
└─────────────────────────────────────────────────────────────────┘

SEGMENT A: FSM Platforms (B2B2B)
├── Coperniq (current - solar + MEP expansion)
├── ServiceTitan (residential services)
├── Housecall Pro (home services)
├── FieldEdge (HVAC/Plumbing)
├── Jobber (field services)
└── Value: White-label templates they offer to THEIR customers

SEGMENT B: Large MEP Contractors (B2B)
├── Companies with 50+ technicians
├── Multi-location operations
├── Compliance-heavy (EPA, NFPA, backflow)
└── Value: Standardized SOPs across all techs

SEGMENT C: MEP Franchise Groups
├── One Hour Heating & Air
├── Benjamin Franklin Plumbing
├── Mister Sparky Electric
└── Value: Corporate template rollout to franchisees
```

---

## Delivery Process (Any Client)

### Phase 0: Discovery & Scoping

**Duration:** 1-2 days
**Deliverables:** Scope document, pricing proposal

```
DISCOVERY CHECKLIST:
□ What platform do they use? (Coperniq, ServiceTitan, custom, etc.)
□ Which trades? (HVAC, Plumbing, Electrical, Fire, General)
□ What forms exist today? (audit current state)
□ Compliance requirements? (EPA 608, NFPA 25, backflow certs)
□ Integration needs? (QuickBooks, payroll, inventory)
□ User count? (affects licensing)
□ Timeline? (EOY rush, Q1 rollout, etc.)
```

**Output:** Proposal with:
- Scope of work
- Template list
- Pricing
- Timeline
- Payment terms

---

### Phase 1: Platform Access & Discovery

**Duration:** 1 day
**Deliverables:** Platform discovery document

```
ACCESS REQUIREMENTS:
□ Admin login credentials (or sandbox account)
□ API documentation (if available)
□ Existing template examples
□ Brand guidelines (if white-labeling)

TECHNICAL DISCOVERY:
□ Form builder capabilities (field types, validation)
□ Work order structure
□ Workflow automation options
□ Mobile app constraints
□ Export/import capabilities
□ API write access (for automation)
```

**Output:** `PLATFORM_DISCOVERY.md` documenting:
- Available field types
- UI patterns
- Integration points
- Automation opportunities

---

### Phase 2: Template Specification

**Duration:** 3-5 days
**Deliverables:** YAML spec files for all templates

```
TEMPLATE SPEC STRUCTURE:
coperniq-mep-templates/
├── templates/
│   ├── hvac/
│   │   ├── ac_system_inspection.yaml
│   │   ├── furnace_safety_inspection.yaml
│   │   └── refrigerant_tracking_log.yaml
│   ├── plumbing/
│   │   ├── backflow_test_report.yaml
│   │   ├── camera_inspection.yaml
│   │   └── water_heater_inspection.yaml
│   ├── electrical/
│   │   ├── panel_inspection.yaml
│   │   └── circuit_load_analysis.yaml
│   └── fire_protection/
│       ├── sprinkler_inspection.yaml
│       └── fire_extinguisher_inspection.yaml
├── work_orders/
│   ├── hvac_service_call.yaml
│   └── hvac_pm_visit.yaml
├── service_plans/
│   ├── hvac_bronze.yaml
│   ├── hvac_silver.yaml
│   └── hvac_gold.yaml
└── documentation/
    ├── PLATFORM_DISCOVERY.md
    ├── FIELD_MAPPING.md
    └── IMPLEMENTATION_GUIDE.md
```

**Output:** Complete YAML specs ready for implementation

---

### Phase 3: Client Review Gate (CRITICAL)

**Duration:** 2-3 days
**Deliverables:** Approved specs with sign-off

```
REVIEW GATE PROCESS:

1. SEND SPECS TO CLIENT
   - Share YAML files (GitHub, Google Drive, email)
   - Include summary document
   - Schedule review call

2. REVIEW CALL (1-2 hours)
   - Walk through each template
   - Verify MEP terminology
   - Confirm field requirements
   - Note corrections needed

3. REVISION CYCLE
   - Make requested changes
   - Re-send for approval
   - Iterate until approved

4. SIGN-OFF
   - Client signs approval document
   - Triggers Phase 4 and invoicing
```

**Approval Document Template:**
```
MEP TEMPLATE PACKAGE APPROVAL

Client: ____________________
Date: ____________________

I approve the following template specifications for implementation:

HVAC Templates:
□ AC System Inspection - APPROVED / CHANGES NEEDED
□ Furnace Safety Inspection - APPROVED / CHANGES NEEDED
□ Refrigerant Tracking Log - APPROVED / CHANGES NEEDED

[Additional trades...]

Signature: ____________________
Title: ____________________
Date: ____________________
```

---

### Phase 4: Implementation

**Duration:** 3-7 days
**Deliverables:** Live templates in platform

```
IMPLEMENTATION OPTIONS:

OPTION A: Client Self-Service
├── We deliver: YAML specs + implementation guide
├── Client creates: Templates in their platform
├── Our role: Support via email/call
├── Price: Lower (specs only)
└── Timeline: Client-dependent

OPTION B: Guided Implementation
├── We deliver: YAML specs + screen-share sessions
├── We guide: Client through creation process
├── Our role: Live coaching
├── Price: Medium
└── Timeline: 1 week

OPTION C: Full Implementation (RECOMMENDED)
├── We deliver: Fully created templates in platform
├── We create: All templates directly in client's system
├── Our role: Complete implementation
├── Price: Higher (full service)
└── Timeline: 3-5 days

OPTION D: Automated Seeding
├── We deliver: Playwright/API scripts
├── Script creates: All templates automatically
├── Our role: One-click deployment
├── Price: Highest (includes automation IP)
└── Timeline: 1 day after script built
```

---

### Phase 5: Testing & QA

**Duration:** 1-2 days
**Deliverables:** Test results, bug fixes

```
TESTING CHECKLIST:

FORM TESTING:
□ All fields display correctly
□ Required fields enforce validation
□ Dropdowns have correct options
□ File uploads work
□ Mobile rendering correct

WORKFLOW TESTING:
□ Forms link to work orders
□ Automations trigger correctly
□ Data flows to reports

USER ACCEPTANCE:
□ Technician tests on mobile
□ Office staff tests on desktop
□ Manager reviews reports
```

---

### Phase 6: Training & Handoff

**Duration:** 1 day
**Deliverables:** Training session, documentation

```
TRAINING SESSION AGENDA (2-4 hours):

1. OVERVIEW (30 min)
   - Template structure
   - Navigation
   - Best practices

2. HANDS-ON (1-2 hours)
   - Create a test project
   - Fill out forms
   - Complete workflow

3. ADMIN TRAINING (30 min)
   - How to edit templates
   - How to add fields
   - How to create new templates

4. Q&A (30 min)
   - Open questions
   - Edge cases
   - Future requests
```

**Documentation Deliverables:**
- User guide (PDF)
- Admin guide (PDF)
- Video walkthrough (optional, +$500)

---

### Phase 7: Invoice & Close

**Duration:** Immediate after acceptance
**Deliverables:** Invoice, support agreement

```
INVOICING MILESTONES:

MILESTONE 1: Specs Approved (Phase 3 complete)
└── Invoice: 50% of project total

MILESTONE 2: Implementation Complete (Phase 5 complete)
└── Invoice: 40% of project total

MILESTONE 3: Training Delivered (Phase 6 complete)
└── Invoice: 10% of project total

PAYMENT TERMS:
- Net 15 for companies <$10K
- Net 30 for companies >$10K
- 50% deposit for new clients (optional)
```

---

## Coperniq-Specific Playbook

### Context

- **Client:** Coperniq (Company ID: 112)
- **Platform:** Coperniq FSM (app.coperniq.io)
- **Internal Champion:** Tim Kipper (Sr. BDR → GTM aspirant)
- **Current State:** Solar-focused, expanding to MEP
- **Opportunity:** First MEP template package + white-label potential

### Coperniq GTM Strategy (Tim's Play)

```
TIM'S PATH TO GTM LEAD:

PHASE 1: Prove Value (Now - EOY)
├── Deliver MEP template package internally
├── Show it working with real Coperniq customers
├── Document ROI (time saved, compliance improved)
└── Build internal case study

PHASE 2: Productize (Q1 2026)
├── Package templates as "Coperniq MEP Starter Kit"
├── Create pricing tier for MEP customers
├── Build sales collateral
└── Train sales team

PHASE 3: Go-To-Market (Q1-Q2 2026)
├── Launch MEP vertical officially
├── Target 50 MEP contractors
├── Revenue target: $XXX ARR
└── Tim leads GTM as product owner

SUCCESS METRICS:
- # of MEP customers onboarded
- Template adoption rate
- NPS from MEP users
- Revenue from MEP vertical
```

### Coperniq Delivery Timeline

```
WEEK 1 (Dec 16-20): Discovery & HVAC Specs ✅
├── [x] Platform discovery complete
├── [x] Form builder documented
├── [x] HVAC templates specified (3 templates)
└── [ ] HVAC specs reviewed by Tim

WEEK 2 (Dec 23-27): Remaining Specs
├── [ ] Plumbing templates (3 templates)
├── [ ] Electrical templates (2 templates)
├── [ ] Fire Protection templates (2 templates)
└── [ ] All specs reviewed

WEEK 3 (Dec 30 - Jan 3): Implementation
├── [ ] Create templates in Coperniq
├── [ ] Link to work orders
├── [ ] Test on mobile
└── [ ] QA complete

WEEK 4 (Jan 6-10): Launch
├── [ ] Training session
├── [ ] Documentation delivered
├── [ ] Go-live with first MEP customer
└── [ ] Invoice sent
```

### Coperniq Pricing (Internal/Discounted)

Since Tim is internal champion and this is a proof-of-concept:

| Item | Standard Price | Coperniq Price | Notes |
|------|---------------|----------------|-------|
| MEP Template Package | $12,000 | $6,000 | 50% internal discount |
| Automation Script | $15,000 | $7,500 | For multi-customer seeding |
| Training | $1,500 | $0 | Included for champion |
| **Total** | **$28,500** | **$13,500** | First client deal |

**Future Royalty (if white-labeled):**
- $500/customer when Coperniq sells to their MEP clients
- OR 10% of MEP vertical revenue (negotiate)

---

## Artifacts to Deliver

### For Any Client

```
STANDARD DELIVERABLES:

/client-name-mep-templates/
├── templates/                    # YAML spec files
├── documentation/
│   ├── PLATFORM_DISCOVERY.md    # Platform capabilities
│   ├── IMPLEMENTATION_GUIDE.md  # How to create templates
│   ├── USER_GUIDE.pdf           # End-user documentation
│   └── ADMIN_GUIDE.pdf          # Admin documentation
├── scripts/                      # Automation (if purchased)
│   └── seed_templates.py        # Playwright seeding script
├── CLIENT_DELIVERY_PLAYBOOK.md  # This document
└── APPROVAL_SIGNOFF.md          # Client approval tracker
```

### For Coperniq Specifically

```
/coperniq-mep-templates/
├── templates/
│   ├── hvac/                    # ✅ Complete
│   ├── plumbing/                # ⏳ In progress
│   ├── electrical/              # ⏳ Pending
│   └── fire_protection/         # ⏳ Pending
├── COPERNIQ_FORM_BUILDER_DISCOVERY.md  # ✅ Complete
├── MEP_TEMPLATE_SPEC.md         # ✅ Complete
├── CLIENT_DELIVERY_PLAYBOOK.md  # ✅ This file
└── screenshots/
    └── coperniq-form-builder-discovery.png  # ✅ Captured
```

---

## Sales Collateral Needed

To sell this to other clients, we need:

| Asset | Status | Owner |
|-------|--------|-------|
| One-pager (PDF) | ❌ Needed | Marketing |
| Case study (Coperniq) | ⏳ After delivery | Tim + Us |
| Demo video | ❌ Needed | Us |
| ROI calculator | ⏳ In coperniq-forge | Tim |
| Proposal template | ❌ Needed | Us |
| Contract template | ❌ Needed | Legal |

---

## Next Steps

1. **Immediate:** Tim reviews HVAC specs for MEP accuracy
2. **This week:** Complete Plumbing, Electrical, Fire specs
3. **Next week:** Create templates in Coperniq (Option C)
4. **EOY:** First MEP customer using templates
5. **Q1 2026:** Tim pitches MEP vertical to Coperniq leadership

---

*This playbook is proprietary to Scientia Capital / I Know AI, LLC*
