# Distributor API Research Summary

*Research completed: January 2026*
*Purpose: Investigate live catalog/pricing integration options for Coperniq*

---

## Executive Summary

**Key Finding:** Major MEP distributors do NOT offer open public REST APIs. Integration options are:
1. **ServiceTitan Partnership** (Ferguson, ABC Supply) - Best for existing ST users
2. **cXML Punchout Catalogs** - For ERP systems (Ariba, Coupa, SAP)
3. **EDI** - For high-volume B2B transactions
4. **Pricing Services** (TRA-SER, NetPricer, EPIC) - For electrical estimating

**The Untapped Opportunity:** Receipt OCR for field purchases at Home Depot/Lowe's - see LIVE_CATALOG_INTEGRATION_VISION.md

---

## Distributor Summary Table

| Distributor | Trade | Public API | Best Integration Path |
|-------------|-------|------------|----------------------|
| **Ferguson** | Plumbing, HVAC | No (dev portal under construction) | ServiceTitan partnership |
| **ABC Supply** | Roofing, Siding | Yes (free, requires credit account) | Direct REST API |
| **Graybar** | Electrical | No | NetPricer, EDI, Punchout |
| **WESCO** | Electrical, Industrial | Yes (developer portal) | REST API, EDI, Punchout |
| **Rexel** | Electrical | Yes (developer portal) | REST API, EDI |
| **Border States** | Electrical | No | EDI, SupplyTrax VMI |
| **Greentech Renewables** | Solar | No | Portal only |
| **Enphase** | Solar Microinverters | Yes (Enlighten API) | REST API (10K free calls/mo) |
| **Tesla** | Powerwall, Solar | Yes (Fleet API) | REST API (pay-per-use from 2025) |

---

## Tier 1: Direct API Available

### ABC Supply (Roofing, Siding, Exterior)
- **API Portal:** https://apidocs.abcsupply.com
- **Requirement:** Existing credit account with ABC Supply
- **Cost:** FREE
- **Features:**
  - Order API: Place orders, get history
  - Pricing API: Real-time pricing by location
  - Product API: 200,000+ items
  - Account API: Manage accounts, contacts
  - Location API: 1,000+ branches
  - Notification API: Webhooks for order/shipment status
- **Authentication:** OAuth 2.0
- **Onboarding:** 5-step process via apidocs.abcsupply.com/get-started/

### WESCO International (Electrical, Industrial)
- **API Portal:** https://apideveloper.wesco.com/s/
- **Features:** 50+ connectors, Fortune 100 scale
- **EDI:** 700+ trading partners, 270K+ docs/month
- **Punchout:** cXML supported
- **Also offers:** eStock VMI, CIF catalog exchange

### Rexel USA (Electrical)
- **API Portal:** https://developer-exchange-dev.rexel.com/signin
- **B2B Platform:** OpenText (5M+ docs/year)
- **Standards:** ETIM, cXML, EDIFACT, EDI

---

## Tier 2: Partner/Portal Access

### Ferguson Enterprises (Plumbing, HVAC) - LARGEST US DISTRIBUTOR
- **API Portal:** https://developer.ferguson.com (UNDER CONSTRUCTION)
- **Authentication:** OAuth 2.0 Client Credentials
- **Partnership Contact:** api.team@ferguson.com
- **Best Path:** ServiceTitan integration (real-time pricing, inventory)
- **Punchout:** Available via customer.support@ferguson.com
- **ServiceTitan Partnership:** https://www.servicetitan.com/partners/ferguson
  - Real-time product availability
  - Vendor cost data (pricing)
  - Electronic PO submission (coming 2025)
  - 50% off first 6 months for Ferguson referrals

### Graybar Electric
- **No public API**
- **Integration:** NetPricer, EDI, cXML Punchout
- **EDI Providers:** TrueCommerce, Cleo
- **Products:** 1M+ electrical/datacom items

### Border States Electric
- **No public API**
- **E-Commerce:** borderstates.com (215K+ products)
- **VMI:** SupplyTrax mobile app
- **EDI:** Via Zenbridge, DataTrans, Cogential IT

---

## Tier 3: Solar/Energy

### Greentech Renewables (CED Greentech)
- **No public API**
- **Portal:** https://www.greentechrenewables.com/customer-portal
- **Real-time Inventory:** Call local branch required
- **Note:** Nation's largest solar distributor (100+ locations)

### Enphase (Microinverters)
- **API:** Enlighten API (Partner Plan)
- **Portal:** https://developer-v4.enphase.com/
- **Requirement:** 10+ installations as registered installer
- **Free Tier:** 10,000 API calls/month
- **Use Case:** Monitoring, commissioning, system performance

### Tesla Powerwall/Solar
- **API:** Fleet API
- **Portal:** https://developer.tesla.com/docs/fleet-api
- **Endpoints:** site_info, live_status, energy_history, backup, storm_mode
- **Pricing:** Pay-per-use starting January 2025
  - $10/month developer discount
  - Categories: Streaming, Commands, Vehicle Data, Wakeups
- **Requirement:** Certified Installer (training + 80% exam pass)

---

## Pricing Services (Electrical Estimating)

For real-time electrical pricing, use middleware services:

| Service | Coverage | Features |
|---------|----------|----------|
| **NetPricer** | Graybar, WESCO, Gexpro | Negotiated pricing 24/7, vendor-specific |
| **TRA-SER** | 3,000+ branches | Supplier Xchange, 20M items/year priced |
| **EPIC** | Benchmark pricing | 2M+ items, daily updates, Trade & Target |

**Compatible Estimating Software:** Accubid, McCormick, ConEst, Vision InfoSoft, Timberline

**Note:** Supplier cooperation required. Large distributors participate; smaller may not unless high volume.

---

## Solar Design Software Integration

### Aurora Solar API
- **Portal:** https://docs.aurorasolar.com/
- **Features:** Pricing API, adder/discount management, CRM push
- **Pricing Methods:** Flat, price per watt, price per component

### OpenSolar
- **Portal:** https://www.opensolar.com/api/
- **Features:** Hardware catalog integration, real-time pricing from distributor partners
- **SDK:** Embeddable for custom workflows

---

## Recommendations for Coperniq

### Short-term (Now)
1. **ABC Supply API** - Direct integration for roofing contractors
2. **ServiceTitan-Ferguson** - Recommend to HVAC/Plumbing contractors
3. **Receipt OCR MVP** - Track Home Depot/Lowe's field purchases

### Medium-term (Q1-Q2 2026)
1. **WESCO/Rexel API** - Electrical contractors
2. **Enphase/Tesla API** - Solar O&M monitoring
3. **TRA-SER/NetPricer** - Electrical estimating integration

### Long-term Vision
1. **Catalog Sync Engine** - Aggregate pricing from multiple sources
2. **Punchout Framework** - cXML gateway for enterprise ERPs
3. **AI Price Matching** - Receipt OCR + catalog fuzzy matching

---

## Key Contacts

| Distributor | Contact |
|-------------|---------|
| Ferguson API | api.team@ferguson.com |
| Ferguson Support | customer.support@ferguson.com / (888) 222-1785 |
| ABC Supply API | api@abcsupply.com |
| Tesla Fleet API | developer.tesla.com |

---

## Sources

- Ferguson Developer Portal: https://developer.ferguson.com
- ABC Supply API Docs: https://apidocs.abcsupply.com
- WESCO Developer: https://apideveloper.wesco.com
- Rexel Developer Exchange: https://developer-exchange-dev.rexel.com
- Enphase Developer: https://developer-v4.enphase.com
- Tesla Fleet API: https://developer.tesla.com/docs/fleet-api
- TRA-SER: https://www.tradeservice.com/products/tra-ser
- ServiceTitan-Ferguson: https://www.servicetitan.com/partners/ferguson

---

*Research conducted by parallel agents | January 2026*
