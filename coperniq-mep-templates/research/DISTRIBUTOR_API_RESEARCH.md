# MEP Distributor API Research for Coperniq Integration

**Research Date**: January 13, 2026
**Purpose**: Identify B2B integration options for real-time pricing sync with Coperniq

---

## Executive Summary

Most major MEP distributors rely on **EDI (Electronic Data Interchange)** rather than modern REST APIs for B2B integration. However, several offer punchout catalogs, field service management integrations (like ServiceTitan), and third-party connector options. The solar sector has the most mature public API ecosystem.

### Key Findings

| Integration Type | Availability | Notes |
|-----------------|--------------|-------|
| Public REST APIs | Rare | Only ScanSource and Aurora Solar offer documented public APIs |
| EDI Integration | Common | Most electrical/plumbing distributors use EDI |
| ServiceTitan Integration | Growing | Ferguson, Johnstone Supply offer this |
| Punchout Catalogs (cXML) | Available | Graybar, Rexel, and others |
| Third-Party Connectors | Abundant | TrueCommerce, Cleo, B2BE, ecosio |

---

## Electrical Distributors

### 1. Graybar Electric

| Field | Details |
|-------|---------|
| **Company** | Graybar Electric Company |
| **API Availability** | No Public REST API |
| **Integration Type** | EDI, XML, Punchout Catalogs |
| **Documentation URL** | N/A (contact required) |
| **Pricing Feed** | Via EDI/Punchout only |
| **Inventory API** | Real-time via punchout catalog |
| **Access Requirements** | Business account, EDI trading partner agreement |

**Notes**:
- $11.6B in annual sales (2024)
- Supports e-commerce portals, EDI, and punchout catalogs with real-time availability
- "Graybar Connect" digital transformation initiative underway (2025)
- Third-party EDI providers: [TrueCommerce](https://www.truecommerce.com/trading-partner/graybar-electric/), [Cleo](https://www.cleo.com/trading-partner-network/graybar)

**Sources**:
- [Graybar Services](https://www.graybar.com/services)
- [Graybar Connect Digital Transformation](https://www.digitalcommerce360.com/2025/03/18/graybar-connect-digital-transformation/)

---

### 2. WESCO International

| Field | Details |
|-------|---------|
| **Company** | WESCO International, Inc. |
| **API Availability** | Limited (entroCIM platform) |
| **Integration Type** | EDI, Smart Facilities APIs |
| **Documentation URL** | N/A (enterprise contact required) |
| **Pricing Feed** | Via EDI only |
| **Inventory API** | Not publicly available |
| **Access Requirements** | Business account, EDI agreement |

**Notes**:
- Fortune 500 company
- entroCIM Smart Facilities Management platform offers 50+ API connections for facility systems
- Primary focus on utilities, communications, and industrial supply chain
- Third-party EDI: [Zenbridge](https://zenbridge.io/trading-partners/wesco-edi-integration/) ($450/mo starting)

**Sources**:
- [WESCO](https://www.wesco.com/us/en.html)
- [entroCIM Integrations](https://www.wesco.com/us/en/services/management-platforms/smart-facilities-management/entrocim-integrations.html)

---

### 3. Rexel USA

| Field | Details |
|-------|---------|
| **Company** | Rexel USA (Global: Rexel Group) |
| **API Availability** | No Public REST API |
| **Integration Type** | EDI (OpenText, B2BE), Simpro Integration |
| **Documentation URL** | N/A |
| **Pricing Feed** | Real-time via websites/integrations |
| **Inventory API** | Real-time stock levels on websites |
| **Access Requirements** | EDI trading partner, Simpro customer |

**Notes**:
- 1,900+ branches in 19 countries
- Processes 5.2M+ supply chain messages/year via OpenText
- Real-time prices and stock levels on most websites
- [Simpro Integration](https://www.simprogroup.com/partners/integration-partners/rexel) for pricing sync
- B2BE handles EDI integration globally

**Sources**:
- [OpenText B2B Rexel Case Study](https://www.opentext.com/customers/rexel)
- [B2BE Rexel Trading Partner](https://www.b2be.com/resources/trading-partners/edi-rexel-usa/)
- [Rexel E-commerce](https://www.rexel.com/en/service/e-commerce/)

---

### 4. Sonepar

| Field | Details |
|-------|---------|
| **Company** | Sonepar (Global leader in B2B electrical distribution) |
| **API Availability** | Via ecosio Partnership |
| **Integration Type** | EDI, ecosio API, SAP S/4HANA |
| **Documentation URL** | ecosio Integration Hub (partner access) |
| **Pricing Feed** | Via EDI/ecosio |
| **Inventory API** | Via EDI |
| **Access Requirements** | ecosio partnership, EDI agreement |

**Notes**:
- World's largest B2B electrical distributor
- 46,000 associates globally
- ecosio API interface integrated with Microsoft Dynamics AX
- 60+ partners connected via direct EDI
- SAP S/4HANA backend with D365 CRM integration

**Sources**:
- [ecosio Sonepar Reference](https://ecosio.com/en/reference/sonepar/)
- [Sonepar Digital Transformation](https://www.sonepar.com/en/newsroom/how-digital-unlocked-unprecedented-investment-in-sonepar-s-supply-chain-and-built-the-critical-momentum-for-group-wide-transformation-130024)

---

## HVAC Distributors

### 5. Ferguson HVAC

| Field | Details |
|-------|---------|
| **Company** | Ferguson Enterprises (Ferguson HVAC division) |
| **API Availability** | Via ServiceTitan Integration |
| **Integration Type** | ServiceTitan P2P, EDI |
| **Documentation URL** | [ServiceTitan Partner Page](https://www.servicetitan.com/partners/ferguson) |
| **Pricing Feed** | Real-time via ServiceTitan |
| **Inventory API** | Real-time availability via ServiceTitan |
| **Access Requirements** | ServiceTitan customer, Ferguson account |

**Notes**:
- Largest U.S. distributor of plumbing, HVAC, appliances
- 36,000 suppliers, 1,773 branches
- ServiceTitan integration provides: real-time pricing, electronic POs, inventory availability
- 12 distribution centers for HVAC division
- Within 60 miles of 95% of customers

**Sources**:
- [ServiceTitan Ferguson Integration](https://www.servicetitan.com/partners/ferguson)
- [Ferguson HVAC](https://www.fergusonhvac.com/)
- [Ferguson Contractor Software](https://www.ferguson.com/content/online-solutions/contractor-management-software)

---

### 6. Winsupply

| Field | Details |
|-------|---------|
| **Company** | Winsupply Inc. |
| **API Availability** | No Public API |
| **Integration Type** | TrueCommerce VMI, Internal ERP |
| **Documentation URL** | N/A |
| **Pricing Feed** | Via TrueCommerce VMI |
| **Inventory API** | VMI-based inventory management |
| **Access Requirements** | TrueCommerce partnership, local company agreement |

**Notes**:
- 660+ local companies across U.S.
- Uses TrueCommerce Datalliance VMI for inventory optimization
- Tech stack: Kubernetes, PostgreSQL, Angular, PWA
- Shared Purchasing Solutions (SPS) for inventory management
- Different ERP systems across local companies

**Sources**:
- [TrueCommerce Winsupply Case Study](https://www.truecommerce.com/resource/winsupply/)
- [Winsupply HVAC](https://www.winsupplyinc.com/featured-categories/hvac)

---

### 7. Johnstone Supply

| Field | Details |
|-------|---------|
| **Company** | Johnstone Supply (HVAC/R Cooperative) |
| **API Availability** | Yes (Internal APIs) |
| **Integration Type** | ServiceTitan P2P, Internal APIs, Mobile App |
| **Documentation URL** | [ServiceTitan Partner](https://www.servicetitan.com/partners/johnstone) |
| **Pricing Feed** | Real-time contractor-specific pricing |
| **Inventory API** | Real-time local inventory |
| **Access Requirements** | ServiceTitan customer, Johnstone account |

**Notes**:
- Leading HVAC/R cooperative, $2.2B+ annual sales, 422+ stores
- Uses "a lot of APIs" connecting to stores' ERP systems
- Supports 3 different ERP systems across stores
- Real-time pricing and availability via API calls
- OE Touch mobile app for ordering
- ServiceTitan integration: catalog sync, local pricing, electronic POs

**Sources**:
- [ServiceTitan Johnstone Integration](https://www.servicetitan.com/partners/johnstone)
- [Elastic Path Johnstone Case Study](https://www.elasticpath.com/resources/case-studies/johnstone-supply)
- [Precisely Johnstone Case Study](https://www.precisely.com/resource-center/customerstories/johnstone-supply-centralized-their-product-content-with-precisely-enterworks/)

---

## Plumbing Distributors

### 8. Ferguson (Plumbing)

*See Ferguson HVAC above - same company, same integration options*

---

### 9. HD Supply

| Field | Details |
|-------|---------|
| **Company** | HD Supply Facilities Maintenance |
| **API Availability** | No Public REST API |
| **Integration Type** | EDI only |
| **Documentation URL** | N/A |
| **Pricing Feed** | Via EDI |
| **Inventory API** | Via EDI |
| **Access Requirements** | EDI trading partner agreement |

**Notes**:
- Facilities maintenance focus
- Third-party EDI providers: [The EDI Exchange](https://www.theediexchange.com/edi/hd-supply-facilities-maintenance.cshtml), [eZCom Lingo](https://www.ezcomsoftware.com/hd-supply-edi/)
- EDI transactions: POs, ASNs, invoices

**Sources**:
- [HD Supply EDI - The EDI Exchange](https://www.theediexchange.com/edi/hd-supply-facilities-maintenance.cshtml)
- [eZCom HD Supply EDI](https://www.ezcomsoftware.com/hd-supply-edi/)

---

### 10. Hajoca Corporation

| Field | Details |
|-------|---------|
| **Company** | Hajoca Corporation |
| **API Availability** | No Public API (Internal Hajoca Hub) |
| **Integration Type** | Internal platform, ERP integrations |
| **Documentation URL** | N/A |
| **Pricing Feed** | Via Hajoca Hub (internal) |
| **Inventory API** | Real-time via Hajoca Hub |
| **Access Requirements** | Hajoca account, local branch relationship |

**Notes**:
- Founded 1858, 450+ locations, 60+ trade names
- Hajoca Hub internal platform (2025): AI, cloud technologies
- Integrates with ERP, accounting, marketing, supply chain systems
- 40% reduction in equipment wait times reported by customers
- Online ordering at many stores

**Sources**:
- [Hajoca Corporation](https://www.hajoca.com/)
- [Hajoca Hub Platform Overview](https://newzcrest.com/hajoca-hub-platform/)

---

## Solar Distributors

### 11. CED Greentech / Greentech Renewables

| Field | Details |
|-------|---------|
| **Company** | Greentech Renewables (formerly CED Greentech) |
| **API Availability** | No Public API documented |
| **Integration Type** | Portal/website only |
| **Documentation URL** | N/A |
| **Pricing Feed** | Not available via API |
| **Inventory API** | On-site inventory at 100+ locations |
| **Access Requirements** | Contractor account |

**Notes**:
- Largest solar equipment distributor in U.S.
- 100+ locations in major solar markets
- Design services, engineering support, financing
- No documented public API for pricing/inventory integration

**Sources**:
- [Greentech Renewables](https://www.greentechrenewables.com/)
- [Greentech Rebrand Announcement](https://www.greentechrenewables.com/greentech-renewables-intro)

---

### 12. BayWa r.e. Solar Distribution

| Field | Details |
|-------|---------|
| **Company** | BayWa r.e. Solar Systems LLC |
| **API Availability** | No Public API documented |
| **Integration Type** | Webstore only |
| **Documentation URL** | N/A |
| **Pricing Feed** | Not available via API |
| **Inventory API** | Real-time via webstore |
| **Access Requirements** | Installer account |

**Notes**:
- Global B2B distributor of solar components
- Advanced webstore with real-time product availability
- Split Pay financing program
- Focus on residential/commercial installers

**Sources**:
- [BayWa r.e. Solar Distribution US](https://solar-distribution-us.baywa-re.com/)
- [BayWa r.e. Solar Trade Global](https://solar-distribution.baywa-re.com/en/)

---

### 13. Aurora Solar (Design Platform with Pricing API)

| Field | Details |
|-------|---------|
| **Company** | Aurora Solar |
| **API Availability** | **Yes - Public REST API** |
| **Integration Type** | REST API |
| **Documentation URL** | [Aurora Solar API Docs](https://docs.aurorasolar.com/reference/aurora-solar-api) |
| **Pricing Feed** | Update Design Pricing API, Create/Delete Adder API |
| **Inventory API** | N/A (design platform, not distributor) |
| **Access Requirements** | Enterprise plan ($259/user/mo or custom) |

**Notes**:
- Solar design and sales platform (not a distributor)
- Full REST API for CRM/ERP integration
- Pricing API: Set flat system cost, price per watt, adders/discounts
- Enterprise features: API access, secure permissions

**Sources**:
- [Aurora Solar API](https://aurorasolar.com/api/)
- [Aurora API Documentation](https://docs.aurorasolar.com/reference/aurora-solar-api)
- [Aurora Pricing API](https://docs.aurorasolar.com/reference/pricing)

---

### 14. Enphase (Monitoring API)

| Field | Details |
|-------|---------|
| **Company** | Enphase Energy |
| **API Availability** | **Yes - Public API** |
| **Integration Type** | REST API (OAuth) |
| **Documentation URL** | [Enphase Developer Portal](https://developer-v4.enphase.com/) |
| **Pricing Feed** | N/A (monitoring only) |
| **Inventory API** | N/A |
| **Access Requirements** | Developer account, API plans |

**API Pricing**:
- **Watt Plan**: Free (1,000 hits/month)
- **Kilowatt Plan**: $250/month
- **Megawatt Plan**: $1,000/month

**Notes**:
- Enlighten Systems API for production monitoring
- OAuth authentication, JSON responses
- Can retrieve meter readings (1 interval to 1 week)
- Manufacturer API, not distributor

**Sources**:
- [Enphase Developer Portal](https://developer-v4.enphase.com/)
- [Enphase Developer Plans](https://developer-v4.enphase.com/developer-plans)

---

## Fire Safety / Low Voltage Distributors

### 15. ADI Global Distribution (Resideo)

| Field | Details |
|-------|---------|
| **Company** | ADI Global Distribution (Resideo) |
| **API Availability** | Limited (Resideo Developer Portal) |
| **Integration Type** | B2B omnichannel, AI-powered |
| **Documentation URL** | [Resideo Developer](https://developer.honeywellhome.com/api-methods) |
| **Pricing Feed** | Via account portal |
| **Inventory API** | Not publicly documented |
| **Access Requirements** | ADI account, Resideo developer account |

**Notes**:
- Leading wholesale distributor of security/low-voltage products
- 350,000+ products from 1,000+ manufacturers
- 100,000+ contractors served in 17 countries
- 190+ locations in North America, Europe, MENA
- Resideo Developer Portal: Thermostat, Camera, Water Leak APIs
- Acquired Snap One/Control4 (2024)
- AI-powered B2B omnichannel purchasing

**Sources**:
- [ADI Global Distribution](https://www.adiglobal.com/)
- [Resideo Developer Portal](https://developer.honeywellhome.com/api-methods)
- [ADI B2B Omnichannel Case Study](https://www.digitalcommerce360.com/2024/08/21/resideo-case-study-b2b-omnichannel-buyer-seller-report/)

---

### 16. ScanSource

| Field | Details |
|-------|---------|
| **Company** | ScanSource, Inc. |
| **API Availability** | **Yes - Public REST API** |
| **Integration Type** | REST API, EDI |
| **Documentation URL** | [ScanSource API](https://www.scansource.com/resource-center/digital-business-tools/api) |
| **Pricing Feed** | Real-time pricing API |
| **Inventory API** | Real-time availability API |
| **Access Requirements** | API key (email b2brequest@scansource.com) |

**Key Features**:
- Developer portal with interactive API testing
- Real-time pricing and availability requests
- No per-document or setup fees for EDI
- POS Portal API for merchant/order management

**Third-Party Integrations**:
- [VARStreet](https://www.varstreetinc.com/distributors/scansource): 200,000 normalized products
- [Catalyst NetSuite](https://nscatalyst.com/netsuite-to-scansource-integration/): Electronic PO processing
- [Spark Shipping](https://www.sparkshipping.com/integrations/scansource/): Amazon, Magento, WooCommerce

**Sources**:
- [ScanSource API Resource](https://www.scansource.com/resource-center/digital-business-tools/api)
- [ScanSource Partner Portal](https://partnerportal.scansource.com/)
- [ScanSource EDI Tool](https://partnerportal.scansource.com/EDI)

---

### 17. Jenne Inc.

| Field | Details |
|-------|---------|
| **Company** | Jenne, Inc. |
| **API Availability** | No Public API documented |
| **Integration Type** | Partner portal, VAR support |
| **Documentation URL** | N/A |
| **Pricing Feed** | Via partner portal |
| **Inventory API** | Not available |
| **Access Requirements** | Partner/reseller account |

**Notes**:
- Value-added distributor since 1986
- Physical security: video surveillance, access control, mass notification
- 180+ manufacturer partners
- Does not sell direct to end users
- Yealink products offer PBX API integration

**Sources**:
- [Jenne Inc.](https://www.jenne.com/)
- [Jenne Physical Security](https://www.jenne.com/value-added-distributor/physical-security/)

---

## Integration Methods Comparison

### Best Options for Coperniq Integration

| Priority | Distributor | Method | Effort | Real-Time |
|----------|-------------|--------|--------|-----------|
| 1 | **ScanSource** | REST API | Low | Yes |
| 2 | **Johnstone Supply** | ServiceTitan | Medium | Yes |
| 3 | **Ferguson** | ServiceTitan | Medium | Yes |
| 4 | **Rexel** | Simpro/EDI | Medium | Yes |
| 5 | **Graybar** | Punchout/EDI | High | Yes |
| 6 | **Sonepar** | ecosio API | High | Yes |

### Integration Types Explained

1. **REST API** (Best)
   - Direct HTTP calls for pricing/inventory
   - ScanSource is the gold standard
   - Aurora Solar for design pricing

2. **ServiceTitan Integration** (Good for Field Service)
   - Ferguson, Johnstone Supply
   - Real-time pricing and PO submission
   - Requires ServiceTitan subscription

3. **EDI** (Enterprise Standard)
   - Graybar, WESCO, HD Supply, Rexel
   - Third-party providers: TrueCommerce, Cleo, B2BE
   - Higher setup cost, ongoing fees

4. **Punchout Catalogs (cXML/OCI)** (Procurement)
   - Graybar, Rexel
   - Integrates with ERP procurement modules
   - Real-time availability during shopping

5. **Web Portal Scraping** (Last Resort)
   - Not recommended
   - Terms of Service violations
   - Brittle to UI changes

---

## Recommendations for Coperniq

### Phase 1: Quick Wins
1. **ScanSource API** - Immediate integration for low-voltage/security products
2. **ServiceTitan Partnership** - Access Ferguson + Johnstone Supply pricing

### Phase 2: Strategic EDI
1. Evaluate TrueCommerce or Cleo for multi-distributor EDI
2. Target Graybar and Rexel for electrical
3. Consider ecosio for Sonepar (if European expansion planned)

### Phase 3: Solar Ecosystem
1. Aurora Solar API for design pricing integration
2. Enphase API for monitoring data

### Contact Information

| Distributor | Integration Contact |
|-------------|---------------------|
| ScanSource | b2brequest@scansource.com |
| Ferguson | ServiceTitan Partner Marketplace |
| Johnstone Supply | ServiceTitan Partner Marketplace |
| Graybar | Contact local branch / EDI team |
| ADI/Resideo | developer.honeywellhome.com |
| Aurora Solar | Enterprise sales |

---

## Appendix: Third-Party EDI/Integration Providers

| Provider | Specialization | Starting Cost |
|----------|---------------|---------------|
| [TrueCommerce](https://www.truecommerce.com/) | Multi-distributor EDI | Custom |
| [Cleo](https://www.cleo.com/) | Enterprise B2B | Custom |
| [B2BE](https://www.b2be.com/) | Rexel, global | Custom |
| [ecosio](https://ecosio.com/) | Sonepar, Microsoft Dynamics | Custom |
| [Zenbridge](https://zenbridge.io/) | WESCO EDI | $450/mo |
| [eZCom Lingo](https://www.ezcomsoftware.com/) | HD Supply, QuickBooks | Custom |
| [VARStreet](https://www.varstreetinc.com/) | IT/ScanSource catalog | Custom |

---

*Last Updated: January 13, 2026*
