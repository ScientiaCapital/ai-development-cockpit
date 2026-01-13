# Comprehensive MEP Distributor & OEM API Research

**Updated:** 2026-01-13 (Expanded Edition)
**Purpose:** Real-time pricing sync, purchase reconciliation, and competitive differentiation for Coperniq
**Status:** Research Complete - Ready for Implementation Planning

---

## Executive Summary

### Key Discoveries

This research identifies **significant opportunities** for Coperniq to build competitive advantage through distributor and OEM API integrations. The findings reveal:

1. **ABC Supply has a comprehensive REST API** - Real-time pricing, inventory, ordering with OAuth 2.0
2. **SRS Distribution offers SIPS platform** - MuleSoft-powered APIs processing 500K+ calls/week
3. **Ferguson Developer Portal exists** - Currently "under construction" but promising
4. **Major OEMs have developer portals** - Daikin, Eaton, Schneider, Siemens, Enphase, SolarEdge
5. **ETIM classification** is the emerging standard for product data normalization

### The Dual Problem

**Problem 1: The $500-$2,000 Credit Card Black Hole**
MEP contractors lose visibility on $500 to several thousand dollars per project when technicians use company credit cards at big box retailers. This spend is never attributed to jobs and erodes margins invisibly.

**Problem 2: No Multi-Trade Unified Catalog**
ServiceTitan is trade-specific. Procore is construction-focused. Neither offers a unified catalog across HVAC + Plumbing + Electrical + Solar + Roofing with real-time distributor pricing.

### Competitive Gap Analysis

| Platform | Home Depot Pro | Lowe's Pro | Credit Card Sync | Distributor APIs | OEM APIs |
|----------|---------------|------------|-----------------|------------------|----------|
| **ServiceTitan** | Workforce only | None | None | Johnstone P2P, Ferguson, ABC Supply (2025) | Limited |
| **Procore** | None | Purchase tracking | None | Limited | None |
| **Buildertrend** | 25mo history | None | None | Limited | None |
| **JobTread** | Pro Xtra | None | Plaid | None | None |
| **Coperniq (Target)** | Pro Xtra | Pro Extended Aisle | Plaid | **Multi-distributor** | **Multi-OEM** |

**Coperniq Opportunity:** Be the ONLY platform with comprehensive coverage across all integration types AND multi-trade unified catalog.

---

## Integration Priority Matrix

### Top 15 Integration Priorities (Ranked by ROI)

| Rank | Provider | Trade | API Status | Effort | Impact | Notes |
|------|----------|-------|------------|--------|--------|-------|
| 1 | **Plaid** | All | Full REST | Low | CRITICAL | Solve credit card black hole |
| 2 | **ABC Supply** | Roofing | Full REST | Medium | HIGH | Comprehensive API, ServiceTitan has it |
| 3 | **Daikin** | HVAC | Full REST | Low | HIGH | Best-documented OEM API |
| 4 | **SRS Distribution** | Roofing | Full REST | Medium | HIGH | MuleSoft-powered, well-documented |
| 5 | **Enphase** | Solar | Full REST | Low | HIGH | Critical for solar vertical |
| 6 | **SolarEdge** | Solar | Full REST | Low | HIGH | Complete solar monitoring |
| 7 | **Eaton** | Electrical | Full REST | Medium | HIGH | Comprehensive smart breaker APIs |
| 8 | **Schneider Electric** | Electrical | Full REST | Medium | HIGH | B2B pricing + ETIM 10.0 catalog |
| 9 | **QXO/Beacon** | Roofing | Custom API | Medium | MEDIUM | Third major roofing distributor |
| 10 | **Johnstone Supply** | HVAC | cXML/EDI | High | HIGH | ServiceTitan has P2P integration |
| 11 | **WESCO** | Electrical | Developer Portal | Medium | MEDIUM | $22B electrical/industrial distributor |
| 12 | **Siemens** | Electrical | Full REST | Medium | MEDIUM | Building X platform APIs |
| 13 | **Ferguson** | Plumbing | Partial | TBD | HIGH | Portal under construction - monitor |
| 14 | **Graybar** | Electrical | EDI only | High | MEDIUM | Major electrical, EDI-focused |
| 15 | **ScanSource** | Low Voltage | Full REST | Medium | MEDIUM | Fire/safety/security |

---

## Part 1: Big Box Retail APIs

### Home Depot Pro Xtra Integration

**Integration Status:** Available via API
**Competitive Coverage:** Buildertrend, JobTread have it; ServiceTitan does NOT

#### Official Integration Point
- **URL:** https://www.homedepot.com/c/pro-integrations
- **Method:** Pro Xtra program membership required
- **Data Available:**
  - Up to 25 months purchase history
  - Real-time product pricing
  - Saved product lists
  - Store inventory levels

#### Integration Approaches

1. **Official Partner Program** (Preferred)
   - Contact Home Depot Pro business development
   - API access through Pro Xtra B2B integration
   - EDI supported (X12 standard, AS2 format)

2. **EDI Transactions Required:**
   - 850 (Purchase Order)
   - 810 (Invoice)
   - 856 (Advance Ship Notice)

**Sources:**
- [Home Depot Pro Integrations](https://www.homedepot.com/c/pro-integrations)
- [Cleo EDI Integration](https://www.cleo.com/trading-partner-network/home-depot/)

---

### Lowe's Pro Integration

**Integration Status:** Developer Portal Available
**Competitive Coverage:** Procore has it; ServiceTitan does NOT

#### Developer Portal
- **URL:** https://portal.apim.lowes.com/
- **API Discovery:** https://apim.dev.portal.lowes.com/docs/services
- **Available APIs:**
  - Order Status API
  - Triage Bot Router (B2B messaging)
  - Product catalog access

#### Pro Extended Aisle Program
- Real-time inventory visibility
- Contract pricing
- Job site/rooftop delivery
- Quoting and ordering automation
- AI integration (Mylow Companion)

**Sources:**
- [Lowe's Developer Portal](https://portal.apim.lowes.com/)
- [ProjectsForce Integration](https://www.projectsforce.com/lowe-s-api-integration)

---

## Part 2: Credit Card Reconciliation

### The Problem Flow

```
1. Tech goes to Home Depot for emergency parts
2. Uses company credit card
3. Receipt goes in truck console
4. Office never sees the charge
5. Job is invoiced without materials cost
6. Margin is eaten - nobody knows why
```

### Solution: Plaid Transactions API

**URL:** https://plaid.com/products/transactions/
**Pricing:** ~$1.50/user/month (first 200 API calls free)
**Proven By:** JobTread uses this exact approach

#### Transaction Data Available
- Transaction date
- Amount
- Merchant name (cleaned)
- Category (automatic)
- Location

#### Integration Pattern (JobTread Model)

```
1. User links company credit card via Plaid Link
2. Transactions sync automatically
3. AI suggests job attribution based on:
   - Date (matches job activity)
   - Location (near job site)
   - Items (matches job materials)
4. User confirms attribution with one click
5. Job cost updates automatically
```

**Sources:**
- [Plaid Transactions API](https://plaid.com/products/transactions/)
- [JobTread Plaid Integration](https://www.jobtread.com/product-updates/2025-01-06-connect-job-tread-with-plaid-to-sync-credit-card-and-bank-transactions)

---

## Part 3: HVAC/Mechanical Distributors

### Ferguson HVAC

| Attribute | Value |
|-----------|-------|
| **Company** | Ferguson Enterprises |
| **URL** | https://www.fergusonhvac.com |
| **Developer Portal** | https://developer.ferguson.com |
| **API Status** | Under Construction |
| **Integration Type** | REST API (OAuth 2.0) |
| **Market Position** | Largest US plumbing/HVAC distributor ($28B+ revenue) |
| **ServiceTitan** | Has partnership integration |

**Current Portal Status:** Shows "Hello World" API only. More endpoints coming.

**Sources:**
- [Ferguson Developer Portal](https://developer.ferguson.com/)
- [Ferguson API Catalog](https://developer.ferguson.com/apis)

---

### Johnstone Supply

| Attribute | Value |
|-----------|-------|
| **Company** | Johnstone Supply (Cooperative) |
| **URL** | https://www.johnstonesupply.com |
| **API Status** | Partner-only |
| **Integration Types** | P2P, PunchOut (cXML), EDI, JSConnect |
| **Pricing Feed** | Real-time (via P2P integration) |
| **Inventory** | Yes (real-time availability) |
| **Order Submission** | Yes |
| **Catalog Size** | 100,000+ products online, 1M+ SKUs |
| **ServiceTitan** | Full P2P integration available |

**Integration Options:**
1. **ServiceTitan P2P** - Full procurement automation
2. **PunchOut Catalog (cXML)** - Ariba, SAP, Coupa, Jaggaer compatible
3. **JSConnect** - Direct order flow
4. **EDI via TrueCommerce** - POs, ASNs, invoices

**Sources:**
- [Johnstone Supply E-commerce](https://www.johnstonesupply.com/store165/e-commerce)
- [ServiceTitan Johnstone Integration](https://help.servicetitan.com/how-to/available-johnstone-supply-procure-to-pay-p2p-distributors)

---

### Gemaire (Watsco)

| Attribute | Value |
|-----------|-------|
| **Company** | Gemaire Distributors (Watsco subsidiary) |
| **URL** | https://www.gemaire.com |
| **API Status** | No Public API |
| **Integration Type** | E-commerce + Mobile app |
| **Pricing Feed** | Real-time (customer-specific via login) |
| **Inventory** | Yes (real-time) |
| **Market Position** | One of largest HVAC distributors globally |

**Digital Tools:**
- HVAC Contractor Assist mobile app
- Real-time inventory and pricing
- Warranty verification
- Spec sheets and documentation

**Sources:**
- [Gemaire Website](https://www.gemaire.com/)
- [HVAC Contractor Assist App](https://www.amazon.com/Watsco-Inc-Gemaires-Contractor-Assist/dp/B00WKM6CU8)

---

### Baker Distributing (Watsco)

| Attribute | Value |
|-----------|-------|
| **Company** | Baker Distributing Company (Watsco subsidiary) |
| **URL** | https://www.bakerdist.com |
| **API Status** | No Public API |
| **Platform** | Magento 2 + Kubernetes + AWS + Salesforce |
| **Pricing Feed** | Real-time (account-linked) |
| **Inventory** | Yes (real-time) |

**Digital Tools:**
- CSV bulk ordering via Quick Order
- HVAC/R Contractor Assist app
- Compressor cross-reference lookup
- Real-time inventory by location

**Sources:**
- [Baker Distributing E-commerce](https://www.bakerdist.com/ecommerce)

---

### Carrier Enterprise (Watsco)

| Attribute | Value |
|-----------|-------|
| **Company** | Carrier Enterprise |
| **URL** | https://www.carrierenterprise.com |
| **Related API** | https://developer.carrier.com (OEM) |
| **Locations** | 220 locations in 22 states + Puerto Rico + Canada |
| **Notes** | Exclusive Carrier/Bryant distributor |

**Sources:**
- [Carrier Developer Network](https://developer.carrier.com/)
- [Carrier Enterprise](https://www.carrierenterprise.com/)

---

### Winsupply

| Attribute | Value |
|-----------|-------|
| **Company** | Winsupply Inc. |
| **URL** | https://www.winsupply.com |
| **API Status** | No Public API Found |
| **Notes** | National HVAC/plumbing distributor. No public developer documentation. |

---

## Part 4: Plumbing Distributors

### Hajoca Corporation

| Attribute | Value |
|-----------|-------|
| **Company** | Hajoca Corporation |
| **URL** | https://www.hajoca.com |
| **API Status** | No Public API |
| **Locations** | 450+ locations, 60+ regional brands |
| **Internal Platform** | Hajoca Hub (2025) with AI/cloud |
| **Founded** | 1858 (family-owned) |

**Sources:**
- [Hajoca Website](https://www.hajoca.com/)

---

### HD Supply / Home Depot Pro

| Attribute | Value |
|-----------|-------|
| **Company** | Home Depot Pro (formerly HD Supply) |
| **URL** | https://www.homedepotpro.com |
| **API Status** | EDI Required |
| **Integration Type** | EDI (X12 standard, AS2 format) |
| **EDI Transactions** | 850 (PO), 810 (Invoice), 856 (ASN) |

**Sources:**
- [Home Depot EDI Integration](https://www.cleo.com/trading-partner-network/home-depot/)

---

### Coburn Supply

| Attribute | Value |
|-----------|-------|
| **Company** | Coburn Supply Company |
| **URL** | https://www.coburns.com |
| **API Status** | No Public API |
| **Locations** | 50+ (TX, LA, MS, AL, TN) |
| **Products** | Plumbing, electrical, waterworks, HVAC |

**Sources:**
- [Coburn Supply](https://www.coburns.com/)

---

## Part 5: Electrical Distributors

### Graybar Electric

| Attribute | Value |
|-----------|-------|
| **Company** | Graybar Electric Company |
| **URL** | https://www.graybar.com |
| **API Status** | EDI/XML Only |
| **Integration Type** | EDI, XML, proprietary formats |
| **Partners** | TrueCommerce, Cleo, Cogential IT |

**Sources:**
- [Graybar Services](https://www.graybar.com/services)
- [TrueCommerce Graybar EDI](https://www.truecommerce.com/trading-partner/graybar-electric/)

---

### WESCO International

| Attribute | Value |
|-----------|-------|
| **Company** | WESCO International (includes Anixter) |
| **URL** | https://www.wesco.com |
| **Developer Portal** | https://apideveloper.wesco.com |
| **API Status** | Developer Portal Available |
| **Revenue** | $22B (2024) |
| **Fortune 500** | Ranked #199 (2025) |
| **entroCIM** | 120+ integrations, 50+ API connections |

**Sources:**
- [WESCO API Developer Portal](https://apideveloper.wesco.com/s/)
- [WESCO entroCIM Integrations](https://www.wesco.com/us/en/services/management-platforms/smart-facilities-management/entrocim-integrations.html)

---

### Sonepar Group

| Attribute | Value |
|-----------|-------|
| **Company** | Sonepar (global, 80+ brands) |
| **URL** | https://www.sonepar.com |
| **API Status** | API-First Strategy |
| **Integration Type** | REST API, GraphQL, EDI |
| **Tech Stack** | Next.js, React, Spring Boot, Azure API Manager |
| **Investment** | €2.5B supply chain + €1B digital platform |
| **EDI Partners** | ecosio (60 connected partners) |

**Sources:**
- [Sonepar Digital Transformation](https://www.sonepar.com/en/newsroom/how-digital-unlocked-unprecedented-investment-in-sonepar-s-supply-chain-and-built-the-critical-momentum-for-group-wide-transformation-130024)
- [ecosio Sonepar Case Study](https://ecosio.com/en/reference/sonepar/)

---

### CED (Consolidated Electrical Distributors)

| Attribute | Value |
|-----------|-------|
| **Company** | Consolidated Electrical Distributors |
| **URL** | Various regional portals |
| **API Status** | No Public API |
| **Locations** | 700+ nationwide |
| **Internal** | Salesforce with REST API (internal only) |

---

## Part 6: Roofing Distributors

### ABC Supply Company - BEST ROOFING API

| Attribute | Value |
|-----------|-------|
| **Company** | ABC Supply Co., Inc. |
| **URL** | https://www.abcsupply.com |
| **Developer Portal** | https://apidocs.abcsupply.com |
| **API Status** | **FULL REST API AVAILABLE** |
| **Integration Type** | REST API (OAuth 2.0) |
| **Market Position** | Largest US roofing/exterior products distributor |
| **ServiceTitan** | Deep integration launched 2025 |

#### API Capabilities

| Category | Endpoints |
|----------|-----------|
| **Order Management** | Place orders, retrieve details, order history, templates |
| **Pricing** | "Price Items" endpoint for real-time pricing |
| **Product Catalog** | Item details, search, browse hierarchies, images |
| **Inventory** | Check availability across locations |
| **Account Services** | Search accounts, customer addresses, contacts |
| **Location Services** | Branch search, branch details |
| **Webhooks** | Real-time order update notifications |

**Authentication:** OAuth 2.0 (client ID + secret from Developer Portal)
**Requirements:** Existing ABC Supply credit account + myABCSupply registration

**Existing Integrations:**
- ServiceTitan (deep integration, nightly price sync)
- AccuLynx
- Roofr
- Hover

**Sources:**
- [ABC Supply API Docs](https://apidocs.abcsupply.com/for-individuals-and-businesses/)
- [ABC Connect](https://www.abcsupply.com/contractor-center/abc-connect/)
- [ServiceTitan ABC Integration](https://www.servicetitan.com/press/servicetitan-announces-integration-abc-supply)

---

### QXO (formerly Beacon Building Products)

| Attribute | Value |
|-----------|-------|
| **Company** | QXO, Inc. (acquired Beacon in 2025) |
| **URL** | https://www.qxo.com |
| **API Portal** | https://www.qxo.com/customapi |
| **API Status** | Custom API Services Available |
| **Locations** | 533 (50 US states, 6 Canadian provinces) |

**API Capabilities:**
- Place and track material orders
- Real-time pricing (single or multiple products)
- Account information access

**Existing Integrations:**
- AccuLynx
- JobNimbus (Beacon PRO+)

**Sources:**
- [QXO Custom API](https://www.qxo.com/customapi)
- [AccuLynx QXO Integration](https://acculynx.com/integrations/qxo/)

---

### SRS Distribution - SIPS Platform

| Attribute | Value |
|-----------|-------|
| **Company** | SRS Distribution Inc. |
| **URL** | https://www.srsdistribution.com |
| **Developer Portal** | https://apidocs.roofhub.pro (SIPS) |
| **API Status** | **REST API AVAILABLE** |
| **Platform** | MuleSoft-powered |
| **Volume** | ~500,000 API calls/week |
| **Locations** | 430+ |

**API Capabilities (SIPS Platform):**
- Real-time pricing updates
- Order placement
- Order tracking
- Invoice access
- Delivery completion notifications (webhook)
- Proof of delivery/invoice PDF downloads

**Existing Integrations:**
- Roofr (real-time pricing, 2025)
- AccuLynx
- RoofLink
- JobProgress, iRoofing, JobNimbus
- Xactware, EagleView

**Sources:**
- [SRS SIPS API Portal](https://apidocs.roofhub.pro/)
- [Roofr SRS Integration](https://www.digitalcommerce360.com/2025/07/08/roofr-srs-distribution-launch-real-time-pricing-integration/)

---

## Part 7: Fire Safety / Low Voltage Distributors

### ADI (Resideo)

| Attribute | Value |
|-----------|-------|
| **Company** | ADI Global Distribution (Resideo subsidiary) |
| **URL** | https://www.adiglobal.com |
| **Developer Portal** | https://developer.resideo.com |
| **API Status** | Resideo Developer Portal Available |
| **Products** | 350,000+ products, 1,000+ manufacturers |
| **Customers** | 100,000+ contractors in 17 countries |

**API Resources:**
- Resideo Developer Portal: APIs + SDKs
- ProSeries Panel API: Security panel integration
- OvrC Remote Management: Device management

**Sources:**
- [Resideo Developer Portal](https://developer.resideo.com/)
- [ProSeries Panel API](https://proseriesapi.resideo.com/)

---

### ScanSource - BEST LOW VOLTAGE API

| Attribute | Value |
|-----------|-------|
| **Company** | ScanSource, Inc. |
| **URL** | https://www.scansource.com |
| **API Portal** | https://services.scansource.com |
| **API Status** | **FULL REST API** |
| **Contact** | b2brequest@scansource.com |

**API Capabilities:**
- Real-time pricing
- Real-time availability
- Full catalog access
- Product information
- **No EDI fees!**

**Fire Safety Products (via Altronix):**
- FireSwitch (NAC power extenders)
- CommBatt (BDA power and backup)

**Sources:**
- [ScanSource API](https://www.scansource.com/resource-center/digital-business-tools/api)
- [ScanSource REST API Help](https://services.scansource.com/Help)

---

### Jenne Distributors

| Attribute | Value |
|-----------|-------|
| **Company** | Jenne, Inc. |
| **URL** | https://www.jenne.com |
| **API Status** | No Public API Found |
| **Products** | IP telephony, networking, AV, security/surveillance |
| **Partners** | 180+ manufacturers |

---

## Part 8: Solar/Energy Distributors

### CED Greentech / Greentech Renewables

| Attribute | Value |
|-----------|-------|
| **Company** | Greentech Renewables (formerly CED Greentech) |
| **URL** | https://www.greentechrenewables.com |
| **API Status** | No Public API |
| **Locations** | 100+ in major US solar markets |
| **Parent** | CED (Consolidated Electrical Distributors) |
| **Market Position** | Largest US solar distributor |

**Products:**
- Panels: Q Cells, Canadian Solar, Jinko, Silfab
- Inverters: Enphase, SolarEdge, SMA, Sungrow
- Storage, mounting equipment

**Sources:**
- [Greentech Renewables](https://www.greentechrenewables.com/)

---

### BayWa r.e.

| Attribute | Value |
|-----------|-------|
| **Company** | BayWa r.e. Solar Trade |
| **URL** | https://solar-distribution-us.baywa-re.com |
| **API Status** | No Public API |
| **Presence** | 34 countries, $6.3B revenue |

---

### Soligent Distribution

| Attribute | Value |
|-----------|-------|
| **Company** | Soligent Distribution |
| **URL** | https://www.soligent.net |
| **API Status** | No Public API |
| **Market Position** | Largest pure-play solar distributor in Americas |
| **Founded** | 1979 |

---

### Krannich Solar

| Attribute | Value |
|-----------|-------|
| **Company** | Krannich Solar USA |
| **URL** | https://krannich-solar.com/us-en |
| **API Status** | No Public API |
| **Presence** | 31 branches, 27 countries |
| **WebPortal** | 24/7 access with pricing, order tracking |

---

## Part 9: OEM APIs - HVAC Manufacturers

### Daikin - BEST OEM API

| Attribute | Value |
|-----------|-------|
| **Company** | Daikin Industries |
| **Developer Portals** | https://developer.cloud.daikineurope.com (EMEA), https://www.daikinone.com/openapi (NA) |
| **API Status** | **FULL REST API AVAILABLE** |
| **Integration Type** | REST API (OAuth 2.0) |
| **Rate Limits** | 200-1000 calls/user/day |
| **License** | Free for private developers |

**API Products:**
- **ONECTA Cloud API** (EMEA) - Full device control, monitoring
- **Daikin One Open API** (NA) - Thermostat control
- **DKN Cloud WiFi API** - Adaptor integration

**Getting Started:**
1. Create Daikin Onecta account
2. Access developer portal
3. Accept terms (private devs) or sign license (business partners)

**Sources:**
- [Daikin Developer Portal EU](https://www.daikin.eu/en_us/product-group/control-systems/daikin-developer-portal.html)
- [Daikin One Open API](https://www.daikinone.com/openapi/index.html)
- [Daikin API Documentation](https://www.daikinone.com/openapi/documentation/index.html)

---

### Rheem

| Attribute | Value |
|-----------|-------|
| **Company** | Rheem Manufacturing Company |
| **Developer Portal** | https://developer-my.rheem.com |
| **API Status** | Partner-Only (Opening) |
| **Protocol** | MQTT (redesigned from REST) |
| **Products** | EcoNet water heaters, HVAC systems |

**Third-Party Libraries Available:**
- py-aosmith (Python)
- node-aosmith (Node.js)
- Home Assistant integration

**Sources:**
- [Rheem Developer Portal](https://developer-my.rheem.com/)
- [py-aosmith](https://pypi.org/project/py-aosmith/)

---

### Lennox

| Attribute | Value |
|-----------|-------|
| **Company** | Lennox International |
| **Portal** | https://www.lennoxpros.com |
| **API Status** | Dealer Portal + Product API |
| **Access** | Dealers with in-house developer only |

**APIs Available:**
- Product API (raw product data)
- Promotions API
- Energy Saving Calculator (embeddable)
- iComfort Control4 integration

**Sources:**
- [LennoxPros Website Product API](https://www.lennoxpros.com/partner-resources/marketing/website-product-api)

---

### Trane / Carrier (Johnson Controls)

| Attribute | Value |
|-----------|-------|
| **Companies** | Trane Technologies, Carrier Global, Johnson Controls |
| **Portals** | https://partners.trane.com, https://developer.carrier.com |
| **API Status** | Partner/Dealer portals |
| **Integration** | BACnet, ASHRAE protocols for BAS |
| **API Agreement** | https://www.johnsoncontrols.com/legal/digital/api-agreement |

**Sources:**
- [Carrier Developer Network](https://developer.carrier.com/)
- [Trane Partners Portal](https://partners.trane.com/)
- [Johnson Controls API Agreement](https://www.johnsoncontrols.com/legal/digital/api-agreement)

---

## Part 10: OEM APIs - Electrical Manufacturers

### Eaton - COMPREHENSIVE API

| Attribute | Value |
|-----------|-------|
| **Company** | Eaton Corporation |
| **Developer Portal** | https://developer.eaton.com |
| **API Status** | **FULL API CATALOG AVAILABLE** |
| **Authentication** | OAuth 2.0 |

**API Products:**
| API | Purpose |
|-----|---------|
| **Smart Breaker APIs** | Control, monitor smart breakers |
| **AbleEdge APIs** | Commission, monitor, control smart breakers |
| **Brightlayer Demand Response** | Utility load control switches |
| **Brightlayer Operations Insight** | Power infrastructure monitoring |
| **CI-Data Open API** | Electrical Power Monitoring System |

**Getting Started:**
1. Sign up for Eaton developer account
2. Register an application
3. Request API access (approval required)
4. Use client ID as API key or OAuth token

**Sources:**
- [Eaton Developer Portal](https://developer.eaton.com/)
- [Eaton API Specification Catalog](https://www.eaton.com/us/en-us/digital/for-developer-partners/API_Specification_Catalog.html)
- [Eaton Smart Breaker API](https://api.em.eaton.com/docs)

---

### Schneider Electric - B2B PRICING API

| Attribute | Value |
|-----------|-------|
| **Company** | Schneider Electric |
| **Developer Portals** | https://portal.api.schneider.com, https://api-explorer.se.com |
| **API Status** | **COMPREHENSIVE B2B APIs** |
| **Authentication** | OAuth 2.0 |
| **Classification** | ETIM 10.0 compliant |

**API Products:**
| API | Purpose |
|-----|---------|
| **Product Catalogue API** | ETIM 10.0 product data |
| **Stock Level API** | Real-time warehouse availability |
| **Net Price API** | Public + personalized net pricing |
| **Order Status API** | Order tracking, shipment schedule |
| **Quote Lines API** | Distributor quote retrieval |

**Sources:**
- [Schneider Partner APIs](https://api-explorer.se.com/en)
- [Schneider Development Tools](https://www.se.com/us/en/work/support/resources-and-tools/tools/development-tools/)

---

### Siemens - BUILDING X PLATFORM

| Attribute | Value |
|-----------|-------|
| **Company** | Siemens AG |
| **Developer Portal** | https://developer.siemens.com |
| **API Status** | **FULL API SUITE AVAILABLE** |
| **Platform** | Building X |

**API Products:**
| API | Purpose |
|-----|---------|
| **Electrification X API** | Electrical distribution data |
| **Building Operations API** | Read data points, issue commands |
| **Structure API** | Locations, devices, data points |
| **Point Value Ingest API** | Virtual device data ingestion |
| **Geometry API** | 2D floor plans (GeoJSON) |
| **Lighting Controls** | Fixtures, sensors, energy |

**Sources:**
- [Siemens Developer Portal](https://developer.siemens.com/)
- [Siemens Building X APIs](https://xcelerator.siemens.com/global/en/products/buildings/building-x/solutions/apis.html)

---

### ABB - MULTIPLE PORTALS

| Attribute | Value |
|-----------|-------|
| **Company** | ABB Ltd |
| **Developer Portals** | https://developer.eu.mybuildings.abb.com, https://developers.connect.abb.com |
| **API Status** | **MULTIPLE PORTALS AVAILABLE** |

**API Products:**
- **Ability Platform APIs** - Streaming data, stored data, object models
- **Smart Buildings APIs** - Local and cloud-based
- **Software Developer Portal** - Power data from ABB hardware

**Sources:**
- [ABB Developer Portal](https://developers.connect.abb.com/)
- [ABB Smart Buildings Developer Portal](https://developer.eu.mybuildings.abb.com/)

---

## Part 11: OEM APIs - Solar Manufacturers

### SolarEdge - MONITORING API

| Attribute | Value |
|-----------|-------|
| **Company** | SolarEdge Technologies |
| **API Documentation** | https://knowledge-center.solaredge.com |
| **API Status** | **MONITORING API AVAILABLE** |
| **Authentication** | API Key (Site or Account level) |
| **Rate Limits** | 300 requests/account, 300 requests/site |

**Capabilities:**
- Site data (energy production, revenue, environmental)
- Inverter data (voltage, current, power, temperature)
- Equipment list (inverters, SMIs with serial numbers)
- Power flow data
- One-week data retrieval per request

**Best Practices:**
- Use Site API keys for third-party access
- Rotate keys every 6 months
- Don't expose keys in browser JavaScript

**Sources:**
- [SolarEdge Monitoring API PDF](https://knowledge-center.solaredge.com/sites/kc/files/se_monitoring_api.pdf)

---

### Enphase Energy - ENLIGHTEN API

| Attribute | Value |
|-----------|-------|
| **Company** | Enphase Energy |
| **Developer Portal** | https://developer-v4.enphase.com |
| **API Status** | **FULL API AVAILABLE** |
| **Authentication** | OAuth 2.0 |

**API Products:**
- **Monitoring API** - System details, production, consumption, battery
- **Commissioning API** - Activations, companies/users, tariffs

**Pricing Tiers:**
| Plan | Price | Access |
|------|-------|--------|
| **Watt** | Free | Limited endpoints, lower rate limits |
| **Kilowatt** | $250/month | Device-level monitoring, streaming |
| **Megawatt** | $1,000/month | Full access |
| **Partner** | Free (10+ installs) | All APIs |

**Data:** 15-minute interval data, microinverter-level

**Sources:**
- [Enphase Developer Portal](https://developer-v4.enphase.com/)
- [Enphase API Quickstart](https://developer-v4.enphase.com/docs/quickstart.html)

---

## Part 12: Industry Standards & Aggregators

### ETIM (Product Classification)

| Attribute | Value |
|-----------|-------|
| **Standard** | ETIM (Electrotechnical Information Model) |
| **URL** | https://www.etim-international.com |
| **Version** | 10.0 (latest) |
| **Classes** | 5,554 classes across 5 sectors |
| **Sectors** | Electrotechnical (E), HVAC/Plumbing (W), Building Materials (B), Shipbuilding (M), Tools/Hardware (T) |
| **Adoption** | 20+ countries, GE, Philips, Schneider Electric |
| **Exchange Format** | BMEcat, ETIM xChange 1.1 |

**Why Important:** Standardized product classification enables cross-distributor catalog integration and consistent pricing comparisons.

**Sources:**
- [ETIM International](https://www.etim-international.com/)

---

### cXML PunchOut Catalogs

| Attribute | Value |
|-----------|-------|
| **Standard** | cXML (Commerce eXtensible Markup Language) |
| **Owner** | SAP (via Ariba acquisition) |
| **Use Case** | B2B procurement integration |
| **Supported** | SAP Ariba, Coupa, Jaggaer, Oracle |

**How It Works:**
1. Buyer punches out from procurement system to supplier catalog
2. Browses products with real-time pricing
3. Cart data returns via cXML
4. PO generated through normal approval workflow

**MEP Relevance:** Johnstone Supply offers cXML PunchOut.

**Sources:**
- [TradeCentric cXML Guide](https://tradecentric.com/blog/cxml-punchout/)

---

### RSMeans (Gordian) - CONSTRUCTION PRICING

| Attribute | Value |
|-----------|-------|
| **Company** | Gordian |
| **Product** | RSMeans Data |
| **API** | https://dataapi-sb.gordian.com (Swagger) |
| **Pricing** | Starting $5,973/year |
| **Data** | 92,000+ unit line items, 25,000 assemblies |

**Capabilities:**
- Material, labor, equipment pricing
- Location-specific cost adjustments
- Predictive costs (3-year ML forecasting)
- eTakeoff integration (2025)

**Sources:**
- [RSMeans API](https://www.rsmeans.com/products/services/api)
- [RSMeans Data](https://www.gordian.com/products/rsmeans-data-services/)

---

### NECA/MCAA Labor Estimating

| Attribute | Value |
|-----------|-------|
| **Organizations** | NECA (Electrical), MCAA (Mechanical) |
| **Products** | Manual of Labor Units (NECA), WebLEM+Plus (MCAA) |
| **API Status** | No Public API (membership benefit) |
| **Integration** | Via software partners (McCormick Systems) |

**Data:**
- NECA MLU: Labor units for electrical (since 1923)
- MCAA WebLEM+Plus: 138,850+ labor hour values

**Sources:**
- [NECA MLU](https://www.necanet.org/education/publications/neca-manual-of-labor-units-(mlu))
- [MCAA Resources](https://www.mcaa.org/resources/)

---

## Part 13: Competitive Intelligence

### What ServiceTitan Has (Coperniq Must Match)

1. **Ferguson Partnership** - Real-time pricing, electronic POs, inventory
2. **Johnstone Supply P2P** - Full procurement automation for HVAC
3. **ABC Supply Integration** (2025) - Nightly price sync, direct ordering

**ServiceTitan Procurement Middleware:**
- Request Middleware bridges ServiceTitan and supplier APIs
- Data transformation for request/response formatting
- Authentication management (OAuth 2.0, API key, Basic Auth)
- Suppliers integrate without changing their API

### Where Coperniq Can Differentiate

1. **Multi-Trade Unified Catalog**
   - ServiceTitan is trade-specific (separate for roofing, HVAC, plumbing)
   - Coperniq can offer ONE catalog across all MEP trades

2. **OEM Direct Integration**
   - Daikin, Eaton, Schneider, Siemens all have developer portals
   - Equipment monitoring + pricing in one system

3. **Solar/Energy Vertical**
   - Enphase and SolarEdge APIs available
   - ServiceTitan weak in solar/renewables

4. **ETIM Standardization**
   - Schneider Electric already ETIM 10.0 compliant
   - Enables cross-distributor product matching

5. **Real-Time Availability from Watsco**
   - Gemaire, Baker, CE have real-time inventory
   - Partnership opportunity without public API

---

## Part 14: Technical Architecture

### Recommended Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Coperniq Catalog Service                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ REST API    │  │ EDI Gateway │  │ cXML        │          │
│  │ Adapter     │  │             │  │ PunchOut    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Unified Catalog Schema (ETIM)             │  │
│  │  - Product classification                              │  │
│  │  - Price normalization                                 │  │
│  │  - Inventory aggregation                               │  │
│  │  - Labor unit mapping                                  │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Job Attribution Engine                 │  │
│  │  - Plaid transaction matching                         │  │
│  │  - Location-based attribution                         │  │
│  │  - Date/activity correlation                          │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                               │
│                              ▼                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Coperniq GraphQL (Task/Project)           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Price Resolution Logic

```python
def resolve_price(item_code: str, contractor_id: str) -> PriceResult:
    """
    Priority order for price resolution:
    1. Contractor-specific negotiated price
    2. Real-time distributor API price
    3. Last synced distributor price (if <24h old)
    4. Master catalog price
    """
    # Check contractor overrides first
    override = get_contractor_price(item_code, contractor_id)
    if override:
        return PriceResult(source="CONTRACTOR", price=override)

    # Try real-time distributor price
    for distributor in get_preferred_distributors(contractor_id):
        try:
            live_price = distributor.get_price(item_code)
            if live_price:
                cache_price(item_code, live_price)
                return PriceResult(source=distributor.name, price=live_price)
        except APIError:
            continue

    # Fall back to cached or master price
    cached = get_cached_price(item_code)
    if cached and cached.age_hours < 24:
        return PriceResult(source="CACHED", price=cached.price)

    master = get_master_catalog_price(item_code)
    return PriceResult(source="MASTER", price=master)
```

### Key Technical Decisions

1. **Pricing Sync Strategy**
   - ABC Supply: Nightly sync (like ServiceTitan)
   - Real-time APIs: On-demand with caching
   - EDI: Batch processing (daily/weekly)

2. **Authentication Management**
   - OAuth 2.0 token refresh for REST APIs
   - Certificate management for EDI
   - API key rotation (SolarEdge recommends 6 months)

3. **Rate Limit Handling**
   - Enphase: 200-1000 calls/user/day
   - SolarEdge: 300 requests per account
   - Implement request queuing and exponential backoff

4. **Data Normalization**
   - ETIM classification for cross-distributor matching
   - Unit of measure standardization
   - Price currency and tax handling

---

## Part 15: Implementation Roadmap

### Phase 1: Quick Wins (Weeks 1-4)

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| 1 | **Plaid Transactions** | 2-4 days | Solve credit card black hole |
| 2 | **Daikin Open API** | 1-2 weeks | Best-documented OEM |
| 3 | **Enphase API** | 1-2 weeks | Critical for solar |
| 4 | **SolarEdge API** | 1 week | Complete solar monitoring |

### Phase 2: Roofing Parity (Weeks 5-8)

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| 5 | **ABC Supply API** | 3-4 weeks | Match ServiceTitan |
| 6 | **SRS Distribution SIPS** | 3-4 weeks | Second roofing distributor |
| 7 | **QXO/Beacon API** | 2-3 weeks | Complete roofing coverage |

### Phase 3: Electrical Leadership (Weeks 9-12)

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| 8 | **Eaton APIs** | 2-3 weeks | Smart breaker monitoring |
| 9 | **Schneider Electric** | 2-3 weeks | B2B pricing + ETIM |
| 10 | **WESCO Portal** | 3-4 weeks | Major electrical |
| 11 | **Siemens Building X** | 2-3 weeks | Building automation |

### Phase 4: HVAC/Plumbing Depth (Weeks 13-16)

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| 12 | **Johnstone cXML** | 4-6 weeks | PunchOut implementation |
| 13 | **Ferguson API** | TBD | When portal completes |
| 14 | **Graybar EDI** | 4-6 weeks | Major electrical/plumbing |

### Phase 5: Big Box Retail (Parallel Track)

| Priority | Integration | Effort | Impact |
|----------|-------------|--------|--------|
| 15 | **Lowe's Developer Portal** | 2-3 weeks | Beat ServiceTitan |
| 16 | **Home Depot Pro Xtra** | 3-4 weeks | Match Buildertrend |

### Partnership Opportunities (Ongoing)

- **Watsco Brands** (Gemaire, Baker, CE) - No public API but partnership potential
- **Greentech Renewables** - CED subsidiary, solar leadership
- **Hajoca** - Regional plumbing giant

---

## Appendix: API Documentation Links

### Distributor Developer Portals

| Distributor | Portal URL |
|-------------|------------|
| Ferguson | https://developer.ferguson.com |
| ABC Supply | https://apidocs.abcsupply.com |
| SRS Distribution | https://apidocs.roofhub.pro |
| QXO/Beacon | https://www.qxo.com/customapi |
| WESCO | https://apideveloper.wesco.com |
| ScanSource | https://services.scansource.com |

### OEM Developer Portals

| OEM | Portal URL |
|-----|------------|
| Daikin (NA) | https://www.daikinone.com/openapi |
| Daikin (EU) | https://developer.cloud.daikineurope.com |
| Eaton | https://developer.eaton.com |
| Schneider Electric | https://api-explorer.se.com |
| Siemens | https://developer.siemens.com |
| ABB | https://developer.eu.mybuildings.abb.com |
| Resideo/ADI | https://developer.resideo.com |
| SolarEdge | https://knowledge-center.solaredge.com |
| Enphase | https://developer-v4.enphase.com |
| Rheem | https://developer-my.rheem.com |
| Carrier | https://developer.carrier.com |
| Lennox | https://www.lennoxpros.com |

### Industry Standards

| Standard | URL |
|----------|-----|
| ETIM International | https://www.etim-international.com |
| RSMeans/Gordian | https://www.rsmeans.com/products/services/api |
| cXML Spec | https://xml.cxml.org |

---

## Next Steps

1. [ ] Prototype Plaid integration (highest ROI, lowest effort)
2. [ ] Register for Daikin Open API (best OEM documentation)
3. [ ] Contact ABC Supply for API credentials (match ServiceTitan)
4. [ ] Register for Enphase developer account (solar vertical)
5. [ ] Monitor Ferguson developer portal for completion
6. [ ] Design ETIM-based unified catalog schema
7. [ ] Build job attribution algorithm for credit card transactions

---

*This research positions Coperniq as the most comprehensive MEP platform for purchase tracking, distributor integration, and OEM monitoring - capabilities neither ServiceTitan nor Procore fully delivers today.*

**Research Date:** January 13, 2026
**Last Updated:** January 13, 2026
