# API Access Request - MEP Template Automation

**From:** Tim Kipper, Sr. BDR
**To:** Coperniq CTO
**Date:** 2025-12-20

---

## What I Built This Weekend

I created a complete MEP template package for Coperniq's expansion into HVAC, Plumbing, Electrical, and Fire Protection verticals.

### Deliverables Ready

| Asset | Count | Status |
|-------|-------|--------|
| HVAC Templates | 3 complete | AC Inspection, Furnace Safety, Refrigerant Log (EPA 608) |
| Template Specs | YAML format | Ready for conversion |
| Supabase Schema | 4 tables | `mep_templates`, `mep_template_groups`, `mep_template_fields`, `mep_seeding_jobs` |
| Seeding Script | Python + Playwright | Automated template creation |
| Platform Discovery | Complete | Form builder, field types, Process Studio mapped |

### Templates Created (HVAC - Week 1)

1. **[MEP] AC System Inspection** - 27 fields, 6 groups
2. **[MEP] Furnace Safety Inspection** - 25 fields, 6 groups (CO readings, gas leak tests)
3. **[MEP] Refrigerant Tracking Log** - 18 fields, EPA 608 compliant

### Templates Planned (Weeks 2-4)

- Plumbing: Backflow Test, Camera Inspection, Water Heater
- Electrical: Panel Inspection, Circuit Load Analysis
- Fire Protection: Sprinkler System (NFPA 25), Fire Extinguisher

---

## What I'm Asking For

**GraphQL API access to programmatically create Form Templates.**

### Why

I can seed all 30+ templates in minutes instead of hours. Currently I'm using the "Ask AI" UI feature one template at a time. With API access, my automation script does it instantly.

### What I've Observed About Your System

Based on my exploration of app.coperniq.io:

**GraphQL Patterns Detected:**
- Templates use unique IDs (e.g., `/form-templates/142945`)
- Forms have hierarchical structure: Template → Groups → Fields
- Field types: `Text`, `Numeric`, `Single select`, `Multiple select`, `File`
- Templates link to Work Orders via `work_order_type` and `work_order_name`
- Project properties can be linked to form fields

**Likely Mutations Needed:**
```graphql
mutation CreateFormTemplate($input: FormTemplateInput!) {
  createFormTemplate(input: $input) {
    id
    name
    groups {
      id
      name
      fields {
        id
        name
        type
        required
      }
    }
  }
}
```

**Likely Input Schema:**
```typescript
interface FormTemplateInput {
  name: string;
  emoji?: string;
  description?: string;
  workOrderId?: string;
  groups: {
    name: string;
    order: number;
    fields: {
      name: string;
      type: 'Text' | 'Numeric' | 'SingleSelect' | 'MultipleSelect' | 'File';
      required?: boolean;
      options?: string[];  // For select fields
      placeholder?: string;
    }[];
  }[];
}
```

---

## What I'm NOT Asking For

- Admin access
- Write access to customer data
- Production database access

Just the ability to create templates in Company 112 (our sandbox).

---

## Business Value

| Metric | Manual (UI) | Automated (API) |
|--------|-------------|-----------------|
| Time per template | 15-20 min | < 1 min |
| 30 templates | 10+ hours | 30 min |
| Error rate | Human error risk | Spec-validated |
| Scalability | N/A | Multi-customer seeding |

This positions Coperniq to offer **"MEP Starter Kits"** to new customers in the HVAC, Plumbing, Electrical, and Fire Protection verticals.

---

## My Credentials

- Sr. BDR at Coperniq (internal)
- Building this as a GTM proof-of-concept for MEP vertical expansion
- All work stored in my Supabase instance for transparency
- Can demo at any time

---

## Contact

Ready to discuss whenever convenient. Happy to do a 15-min screen share to show:
1. The template specs I've built
2. The automation infrastructure
3. How it would work with your GraphQL API

---

*Tim Kipper*
*Sr. BDR → GTM (hopeful)*
