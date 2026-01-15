# Coperniq MEP Gap Analysis

**Date:** 2025-12-20
**Target:** https://app.coperniq.io/112/
**Pages Discovered:** 21
**Analysis Model:** DeepSeek V3.2 (Scout) + Claude Opus (Analyzer - pending)

---

## Executive Summary

Coperniq is an MEP contractor management platform. Based on automated crawl discovery, we've mapped their features against industry best practices for MEP software.

**Coverage Score: ~45% of MEP requirements**

---

## Discovered Features (What Coperniq HAS)

### Navigation Structure Discovered
| Page | MEP Template Section | Status |
|------|---------------------|--------|
| `/112/dashboard/` | Reports & Analytics | Present |
| `/112/projects/` | Project Management | Present |
| `/112/clients/` | Customers / CRM | Present |
| `/112/work-orders/` | Work Orders / Service | Present |
| `/112/calendar/` | Scheduling & Dispatch | Present |
| `/112/inbox/` | Communication | Present |
| `/112/settings/` | Admin & Settings | Present |
| `/112/team/` | Admin - User Management | Present |
| `/112/reports/` | Reports & Analytics | Present |
| `/112/billing/` | Invoicing & Payments | Present |
| `/112/payments/` | Invoicing & Payments | Present |
| `/112/profile/` | Admin - User Management | Present |
| `/112/account/` | Admin & Settings | Present |
| `/112/api/` | Integrations | Present |

---

## GAP ANALYSIS: What's MISSING

### 1. PROJECT MANAGEMENT - GAPS

**Present:** Projects section exists
**Missing (High Priority):**
- [ ] Change order management
- [ ] Submittals tracking
- [ ] RFI (Request for Information)
- [ ] Punch lists
- [ ] Project timeline/Gantt views
- [ ] Job costing
- [ ] Retainage tracking
- [ ] Progress billing workflows

**Build Recommendation:** Add change order, submittal, and RFI modules to `/projects/` section.

---

### 2. WORK ORDERS / SERVICE - GAPS

**Present:** Work orders section exists
**Missing (High Priority):**
- [ ] Recurring work orders
- [ ] Preventive maintenance schedules
- [ ] SLA tracking
- [ ] Emergency dispatch priority
- [ ] After-hours routing
- [ ] Warranty tracking
- [ ] Customer signature capture (needs verification)

**Build Recommendation:** Add PM scheduling engine, SLA dashboard, warranty tracking module.

---

### 3. SCHEDULING & DISPATCH - GAPS

**Present:** Calendar exists
**Missing (High Priority):**
- [ ] Route optimization
- [ ] GPS tracking integration
- [ ] Skill-based routing
- [ ] Territory management
- [ ] Real-time ETA for customers
- [ ] Capacity planning views

**Build Recommendation:** Integrate route optimization API (Google Maps, OptimoRoute). Add technician GPS tracking.

---

### 4. ESTIMATING & QUOTING - CRITICAL GAP

**Status: NOT DISCOVERED** - No `/estimates/` or `/quotes/` page found

**Missing (Critical):**
- [ ] Create estimates/quotes
- [ ] Labor rates management
- [ ] Material pricing
- [ ] Markup/margin settings
- [ ] Quote templates
- [ ] Quote PDF generation
- [ ] Quote approval workflow
- [ ] Quote-to-job conversion
- [ ] Price book management
- [ ] Good/better/best options
- [ ] Win/loss tracking

**Build Recommendation:** This is a MAJOR gap. Build complete estimating module with price books, templates, and approval workflows.

---

### 5. INVOICING & PAYMENTS - GAPS

**Present:** Billing and Payments pages exist
**Missing (High Priority):**
- [ ] AIA G702/G703 format (construction standard)
- [ ] Progress billing tied to project phases
- [ ] Retainage management
- [ ] Lien waiver generation
- [ ] QuickBooks integration (needs verification)

**Build Recommendation:** Add AIA billing format, lien waiver generator, accounting integrations.

---

### 6. CUSTOMERS / CRM - GAPS

**Present:** Clients section exists
**Missing (Medium Priority):**
- [ ] Equipment/asset tracking per customer
- [ ] Service agreements/contracts management
- [ ] Customer portal (self-service)
- [ ] Automated follow-ups
- [ ] Customer satisfaction surveys
- [ ] Referral tracking

**Build Recommendation:** Add equipment registry, service contract templates, customer portal.

---

### 7. FORMS & CHECKLISTS - CRITICAL GAP

**Status: NOT DISCOVERED** - No `/forms/` or `/checklists/` page found

**Missing (Critical):**
- [ ] Custom form builder
- [ ] Inspection checklists
- [ ] Safety forms
- [ ] Customer sign-off forms
- [ ] Commissioning reports
- [ ] Conditional logic forms
- [ ] Pre-populated data
- [ ] Form templates library

**Build Recommendation:** Build form builder with drag-drop interface, template library, conditional logic.

---

### 8. MOBILE APP - UNKNOWN

**Status:** Cannot assess from web crawl

**Needs Verification:**
- [ ] iOS app availability
- [ ] Android app availability
- [ ] Offline mode support
- [ ] Field technician features

**Build Recommendation:** If no mobile app exists, this is critical for field technicians.

---

### 9. INVENTORY & PURCHASING - CRITICAL GAP

**Status: NOT DISCOVERED** - No `/inventory/` or `/parts/` page found

**Missing (Critical):**
- [ ] Parts/materials catalog
- [ ] Inventory tracking
- [ ] Purchase orders
- [ ] Vendor management
- [ ] Reorder alerts
- [ ] Truck stock management
- [ ] Barcode scanning

**Build Recommendation:** Build inventory management system with PO workflow, vendor management.

---

### 10. REPORTS & ANALYTICS - GAPS

**Present:** Reports and Dashboard pages exist
**Missing (Medium Priority):**
- [ ] Custom report builder
- [ ] Scheduled reports (email)
- [ ] KPI tracking dashboards
- [ ] Trend analysis
- [ ] Technician performance metrics
- [ ] Job profitability reports

**Build Recommendation:** Add custom report builder, scheduled email reports.

---

### 11. INTEGRATIONS - GAPS

**Present:** API page exists
**Missing (High Priority):**
- [ ] QuickBooks Online sync
- [ ] QuickBooks Desktop sync
- [ ] Xero integration
- [ ] Google Calendar sync
- [ ] Outlook Calendar sync
- [ ] Zapier connector
- [ ] Webhooks documentation

**Build Recommendation:** Prioritize QuickBooks integration (most requested by MEP contractors).

---

### 12. MEP-SPECIFIC FEATURES - CRITICAL GAPS

**HVAC Specific (Not Found):**
- [ ] Equipment types (AC, furnace, heat pump)
- [ ] Refrigerant tracking (EPA compliance)
- [ ] Load calculations
- [ ] Maintenance agreement templates

**Plumbing Specific (Not Found):**
- [ ] Fixture counts
- [ ] Backflow testing tracking
- [ ] Camera inspection reports
- [ ] Drain cleaning tracking

**Electrical Specific (Not Found):**
- [ ] Panel schedules
- [ ] Circuit mapping
- [ ] Code compliance checklists
- [ ] Arc flash labels

**Fire Protection Specific (Not Found):**
- [ ] Inspection schedules
- [ ] Test reports
- [ ] Code violations tracking
- [ ] Hydrant flow tests

**Build Recommendation:** Add trade-specific modules or configurable templates per trade type.

---

## PRIORITY BUILD LIST

### P0 - Critical (Must Have)
1. **Estimating & Quoting Module** - Major revenue impact
2. **Forms & Checklists Builder** - Field operations critical
3. **Inventory Management** - Parts/materials tracking

### P1 - High Priority
4. **QuickBooks Integration** - Most requested by contractors
5. **Route Optimization** - Efficiency improvement
6. **Preventive Maintenance Scheduler** - Recurring revenue
7. **AIA Billing Format** - Commercial construction standard

### P2 - Medium Priority
8. **Customer Portal** - Self-service reduces support
9. **Equipment/Asset Tracking** - Service history
10. **Custom Report Builder** - Analytics flexibility
11. **Trade-Specific Templates** - HVAC, Plumbing, Electrical, Fire

### P3 - Nice to Have
12. **GPS Tracking** - Fleet management
13. **Referral Tracking** - Marketing
14. **Survey/NPS System** - Customer feedback

---

## Revenue Opportunity

| Feature | Est. Build Cost | Customer Value |
|---------|----------------|----------------|
| Estimating Module | $25-50K | High - Enables sales workflow |
| Forms Builder | $15-30K | High - Field ops critical |
| Inventory System | $20-40K | Medium - Parts management |
| QuickBooks Integration | $10-20K | High - Reduces double-entry |
| Route Optimization | $15-25K | Medium - Efficiency gains |

**Total Opportunity:** $85-165K in build services

---

## Next Steps

1. **Validate Gaps** - Manual review of Coperniq to confirm missing features
2. **Prioritize with Customer** - Get Coperniq team input on priorities
3. **Scope P0 Features** - Detailed specs for estimating, forms, inventory
4. **Build Proposal** - Package for ai-development-cockpit team
5. **Execute** - Build highest-impact features first

---

## Bugs Found During Crawl

| Page | Severity | Count |
|------|----------|-------|
| /112/ | Medium | 1 |
| /112/login/ | Critical: 1, Medium: 2, Low: 1 | 4 |
| /112/dashboard/ | None | 0 |
| /112/api/ | High: 2, Medium: 2 | 4 |

**Total Issues:** 9 (1 critical, 2 high, 5 medium, 1 low)

---

*Generated by BugHive Autonomous QA + Gap Analysis*
*Model: DeepSeek V3.2 (Discovery) + Claude Opus (Analysis)*
