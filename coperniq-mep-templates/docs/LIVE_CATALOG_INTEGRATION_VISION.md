# Live Catalog Integration Vision: Coperniq + Distributor APIs

## The Problem Nobody Is Solving

### The Field Tech "Parts Run" Black Hole

**Current Reality:**
1. Tech arrives at job site
2. Discovers they need a part (fitting, capacitor, filter, etc.)
3. Drives to Home Depot, Lowe's, or local supply house
4. Pays with company card or personal card
5. Submits expense report later (maybe)
6. **ZERO connection to the job**

**The Impact:**
- $500-2,000 in untracked materials PER JOB
- No visibility into true job cost
- Can't price future jobs accurately
- Margin erosion nobody sees
- Inventory management is impossible

**ServiceTitan's Blind Spot:**
> ServiceTitan tracks service tickets, not material purchases. They have no integration with retail distributors for field purchases.

---

## The Vision: Live Catalog Ecosystem

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COPERNIQ LIVE CATALOG                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  WHOLESALE      │  │  RETAIL         │  │  MANUFACTURER   │     │
│  │  DISTRIBUTORS   │  │  PARTNERS       │  │  DIRECT         │     │
│  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤     │
│  │ • Ferguson      │  │ • Home Depot    │  │ • Carrier       │     │
│  │ • ABC Supply    │  │ • Lowe's        │  │ • Trane         │     │
│  │ • Graybar       │  │ • Menards       │  │ • Rheem         │     │
│  │ • Wesco         │  │ • Grainger      │  │ • Enphase       │     │
│  │ • CED Greentech │  │ • Fastenal      │  │ • Tesla         │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                ↓                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              COPERNIQ CATALOG SYNC ENGINE                     │  │
│  │  • Real-time price updates                                    │  │
│  │  • Inventory availability                                     │  │
│  │  • Job-level material tracking                                │  │
│  │  • Receipt capture & OCR                                      │  │
│  │  • Automatic expense → job allocation                         │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                ↓                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              COPERNIQ WORK ORDER / PROJECT                    │  │
│  │  • Materials auto-attached to job                             │  │
│  │  • True job costing                                           │  │
│  │  • Margin visibility                                          │  │
│  │  • Accurate future pricing                                    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Integration Tiers

### Tier 1: Full API Integration (Real-Time)
**Best for:** High-volume wholesale distributors with established B2B infrastructure

| Distributor | Products | Integration Method | Status |
|-------------|----------|-------------------|--------|
| Ferguson | Plumbing, HVAC | B2B API / EDI | 🔍 Researching |
| Graybar | Electrical | B2B API / Punchout | 🔍 Researching |
| Wesco | Electrical, Industrial | B2B API | 🔍 Researching |
| CED Greentech | Solar | Portal API | 🔍 Researching |

**Capabilities:**
- Live pricing updates
- Real-time inventory
- Direct ordering from Coperniq
- Automatic PO generation

### Tier 2: Punchout Catalog Integration
**Best for:** Distributors with existing e-procurement infrastructure

| Distributor | Integration Type |
|-------------|-----------------|
| Grainger | cXML Punchout |
| Fastenal | cXML Punchout |
| MSC Industrial | cXML Punchout |

**Capabilities:**
- Browse catalog within Coperniq
- Cart transfers back to Coperniq
- Pricing at checkout
- Order tracking

### Tier 3: Receipt Capture & OCR (Field Purchases)
**Best for:** Retail stores where APIs don't exist

| Retailer | Method |
|----------|--------|
| Home Depot | Receipt OCR → Job Allocation |
| Lowe's | Receipt OCR → Job Allocation |
| Menards | Receipt OCR → Job Allocation |
| Local supply houses | Receipt OCR → Job Allocation |

**Workflow:**
1. Tech takes photo of receipt
2. OCR extracts: Store, items, prices, date/time
3. AI matches items to catalog
4. Tech selects which job to allocate
5. Materials auto-attached to work order
6. True job cost updated in real-time

---

## Potential APIs to Investigate

### Wholesale Distributors

#### Ferguson Enterprises (Plumbing, HVAC)
- **Website:** ferguson.com
- **B2B Programs:** Ferguson Pro, Ferguson Online
- **Likely Integration:** EDI, possibly REST API for partners
- **Products:** Plumbing, HVAC, waterworks, industrial

#### ABC Supply (Roofing, Siding)
- **Website:** abcsupply.com
- **B2B Programs:** ABC Supply Pro
- **Likely Integration:** Portal-based, possibly EDI
- **Products:** Roofing, siding, windows, gutters

#### Graybar Electric
- **Website:** graybar.com
- **B2B Programs:** Graybar Smart Stock, e-Business
- **Likely Integration:** EDI, cXML, possibly REST API
- **Products:** Electrical, datacomm, industrial

#### Wesco International
- **Website:** wesco.com
- **B2B Programs:** WESCO e-Business
- **Likely Integration:** EDI, cXML, API
- **Products:** Electrical, industrial, utility

#### CED Greentech (Solar)
- **Website:** cedgreentech.com
- **B2B Programs:** Installer portal
- **Likely Integration:** Portal API, inventory feeds
- **Products:** Solar panels, inverters, racking, batteries

### Retail Partners

#### Home Depot Pro
- **Website:** homedepot.com/c/Pro_Xtra
- **Programs:** Pro Xtra loyalty, Pro Desk
- **Potential Integration:**
  - Pro Xtra API (if available)
  - Receipt scraping/OCR
  - Purchase history export
- **Products:** Everything a field tech might need

#### Lowe's for Pros
- **Website:** lowesforpros.com
- **Programs:** Lowe's for Pros loyalty
- **Potential Integration:**
  - Pro account API (if available)
  - Receipt scraping/OCR
  - Purchase history export
- **Products:** Everything a field tech might need

### Manufacturer Direct

#### HVAC Manufacturers
- **Carrier/Bryant:** PartsPLUS portal
- **Trane/American Standard:** Parts portal
- **Lennox:** PartsPlus
- **Rheem/Ruud:** ProPartner portal

#### Solar/Energy Manufacturers
- **Enphase:** Installer portal with pricing
- **SolarEdge:** Partner portal
- **Tesla:** Certified installer portal

---

## The Killer Feature: Receipt OCR → Job Allocation

### User Flow (Mobile App)

```
┌─────────────────────────────────────────┐
│         COPERNIQ MOBILE APP             │
├─────────────────────────────────────────┤
│                                         │
│  [📷 Scan Receipt]                      │
│                                         │
│  ↓                                      │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Receipt Detected:                 │  │
│  │ HOME DEPOT #1234                  │  │
│  │ 01/13/2026  2:34 PM               │  │
│  │                                   │  │
│  │ Items Found:                      │  │
│  │ ☑ 3/4" Copper Elbow (x4)   $3.48 │  │
│  │ ☑ PVC Primer              $8.99  │  │
│  │ ☑ PVC Cement              $7.49  │  │
│  │ ☑ Teflon Tape (x2)        $4.98  │  │
│  │                                   │  │
│  │ TOTAL: $24.94                    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Allocate to Job:                       │
│  ┌───────────────────────────────────┐  │
│  │ 🔍 Search or select...            │  │
│  │                                   │  │
│  │ Recent Jobs:                      │  │
│  │ • Smith Residence - Water Heater  │  │
│  │ • Johnson - AC Repair             │  │
│  │ • 123 Main St - Plumbing Rough   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  [✓ Allocate to Job]                    │
│                                         │
└─────────────────────────────────────────┘
```

### Backend Processing

1. **Receipt OCR Engine**
   - Google Cloud Vision / AWS Textract / Azure Form Recognizer
   - Extract: Store name, date, line items, prices, total
   - Confidence scoring for each extracted field

2. **Item Matching**
   - Match extracted items to Coperniq catalog
   - Fuzzy matching for retail product names
   - Create new catalog items for unmatched (with approval)

3. **Job Allocation**
   - Link materials to work order
   - Update job cost in real-time
   - Adjust margin calculations

4. **Expense Reconciliation**
   - Match to credit card transactions
   - Flag discrepancies
   - Automated expense report generation

---

## Business Impact

### For Contractors

| Metric | Before | After |
|--------|--------|-------|
| Job cost visibility | 60-70% | 98%+ |
| Material margin erosion | 15-25% unknown | <5% |
| Time to invoice | Days | Same day |
| Expense report time | 2-4 hrs/week | Automated |
| Pricing accuracy | Guesswork | Data-driven |

### For Coperniq

| Opportunity | Impact |
|-------------|--------|
| Competitive moat | Neither Procore nor ServiceTitan has this |
| Enterprise sales | Large contractors need this |
| Partner revenue | Distributor referral fees |
| Data value | Aggregate pricing intelligence |

---

## Implementation Phases

### Phase 1: Receipt OCR MVP (4-6 weeks)
- Mobile receipt capture
- Basic OCR extraction
- Manual job allocation
- Simple reporting

### Phase 2: Catalog Matching (4-6 weeks)
- Fuzzy item matching
- Catalog auto-population
- Price variance alerts
- Material usage analytics

### Phase 3: Distributor API Integration (8-12 weeks)
- Ferguson API integration (if available)
- Graybar API integration
- Live pricing sync
- Inventory visibility

### Phase 4: Punchout Catalogs (6-8 weeks)
- cXML punchout framework
- Grainger integration
- Fastenal integration
- In-app purchasing

---

## Questions for Coperniq Leadership

1. **API Access:** Does Coperniq have existing relationships with any distributors?
2. **Mobile App:** What receipt capture capabilities exist in the current mobile app?
3. **Catalog API:** Can external systems push catalog updates via API?
4. **Webhooks:** Can Coperniq send webhooks when catalog items need price updates?
5. **Partner Program:** Interest in co-marketing with distributors?

---

## Competitive Positioning

### The Pitch to Contractors

> "Every time your tech stops at Home Depot, you're losing money you can't see. Coperniq is the only platform that captures field purchases and ties them to the job automatically. Know your true margins. Price your next job right."

### The Pitch to Coperniq Leadership

> "This is the moat ServiceTitan can't cross. They're built for service tickets, not materials. If we nail distributor integration and receipt capture, we own the multi-trade contractor market."

---

*Document created: January 2026*
*Research in progress via parallel agents*
