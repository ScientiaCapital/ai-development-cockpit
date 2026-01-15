# Coperniq Energy - Complete Demo Environment Plan

**Created**: 2025-12-21
**Purpose**: Tight demo environment showcasing all MEP trades, service plans, and Coperniq capabilities

---

## Demo Client Strategy (20 Clients)

### Residential HVAC (4 clients)
1. **Sarah Martinez** - HVAC Bronze Plan
   - Site: Single-family home, Phoenix AZ
   - Assets: 15-year-old Trane AC unit
   - Projects: Annual maintenance
   - Service Plan: [MEP] HVAC Bronze ($360/year, Annual visit)

2. **Robert Chen** - HVAC Silver Plan
   - Site: Single-family home, Austin TX
   - Assets: 8-year-old Carrier system
   - Projects: Spring tune-up, Filter replacement
   - Service Plan: [MEP] HVAC Silver ($600/year, Bi-annual)

3. **Jennifer Williams** - HVAC Gold Plan
   - Site: Single-family home, Atlanta GA
   - Assets: 3-year-old Lennox heat pump
   - Projects: Quarterly PM, Emergency repair last year
   - Service Plan: [MEP] HVAC Gold ($1,200/year, Quarterly)

4. **Michael Thompson** - HVAC Platinum Plan
   - Site: Single-family home, Charlotte NC
   - Assets: New Trane XV20i variable speed
   - Projects: Premium quarterly service, Priority support
   - Service Plan: [MEP] HVAC Platinum ($2,400/year, Quarterly + Priority)

### Commercial Property (3 clients)
5. **Downtown Office Tower LLC** - Commercial HVAC RTU Maintenance
   - Site: 50,000 sq ft office building, San Francisco CA
   - Assets: 4x Carrier 15-ton RTUs, BAS system
   - Projects: Quarterly PM, Chiller retrofit 2024
   - Service Plan: [MEP] Commercial HVAC RTU Maintenance ($2,400/year per unit)

6. **Retail Plaza Management** - Multi-Trade Service
   - Site: 100,000 sq ft shopping center, Dallas TX
   - Assets: 10 RTUs, Commercial refrigeration, Grease trap
   - Projects: HVAC, Plumbing, Fire protection
   - Service Plan: [MEP] Multi-Trade Project (Custom pricing)

7. **Industrial Warehouse Solutions** - Commercial Electrical + HVAC
   - Site: 200,000 sq ft warehouse, Edison NJ
   - Assets: High-bay lighting, Dock equipment, Unit heaters
   - Projects: LED retrofit, Electrical panel upgrades
   - Service Plan: [MEP] Electrical Safety ($800/year)

### Multi-Family / Property Management (2 clients)
8. **Sunset Apartments HOA** - Multi-Family Common Area
   - Site: 150-unit apartment complex, San Diego CA
   - Assets: Pool equipment, Common area HVAC, Elevators
   - Projects: Pool heater replacement, Chiller service
   - Service Plan: [MEP] Plumbing Gold ($1,500/year)

9. **Riverfront Condos Management** - Multi-Family Unit Service
   - Site: 80-unit condo building, Portland OR
   - Assets: Individual HVAC units, Central boiler
   - Projects: Unit turnover service, Annual inspections
   - Service Plan: [MEP] HVAC Silver (bulk pricing)

### Industrial / Manufacturing (2 clients)
10. **American Food Processing Inc** - Commercial Refrigeration
    - Site: Food processing facility, Fresno CA
    - Assets: Walk-in freezers, Refrigeration racks, Ammonia system
    - Projects: EPA 608 compliance, Emergency refrigeration repair
    - Service Plan: [MEP] Service Agreement Monthly ($3,600/year)

11. **DataCenter Midwest LLC** - Mission Critical HVAC
    - Site: Tier III data center, Chicago IL
    - Assets: Precision cooling, Hot/cold aisle containment, N+1 redundancy
    - Projects: 24/7 monitoring, Quarterly commissioning
    - Service Plan: [MEP] Service Agreement Monthly ($12,000/year, SLA-based)

### Healthcare (1 client)
12. **Wellness Medical Group** - Healthcare HVAC + Fire
    - Site: Medical office building, Boston MA
    - Assets: Medical-grade HVAC (ASHRAE 170), Fire suppression
    - Projects: Life safety compliance, JCAHO prep
    - Service Plan: [MEP] Fire Protection Quarterly ($600/year)

### Retail / Restaurant (2 clients)
13. **Thai Spice Restaurant** - Commercial Kitchen
    - Site: Restaurant, Seattle WA
    - Assets: Kitchen exhaust (NFPA 96), Grease trap, Walk-in cooler
    - Projects: Hood cleaning, Grease trap service, Refrigeration PM
    - Service Plan: [MEP] Service Agreement Monthly ($1,200/year)

14. **Urban Outfitters Flagship** - Retail HVAC
    - Site: 25,000 sq ft retail store, Brooklyn NY
    - Assets: 3x RTUs, VRF system in backroom
    - Projects: Seasonal PM, Emergency repair history
    - Service Plan: [MEP] Commercial HVAC RTU Maintenance ($7,200/year)

### Government (1 client)
15. **City of Springfield Public Works** - Municipal Building
    - Site: City hall + maintenance garage, Springfield IL
    - Assets: Boilers, Chillers, Emergency generators, Vehicle lifts
    - Projects: Annual inspections, Generator NFPA 110 testing
    - Service Plan: [MEP] Service Agreement Monthly ($4,800/year)

### Solar EPC (3 clients)
16. **Residential Solar - Garcia Family** - Solar Residential O&M
    - Site: 8kW residential solar, Los Angeles CA
    - Assets: 24x SolarEdge panels, Enphase microinverters
    - Projects: Installation 2022, Annual inspection
    - Service Plan: [MEP] Solar Residential O&M ($240/year)

17. **Commercial Solar - Tech Campus LLC** - Solar Commercial O&M
    - Site: 250kW commercial solar, Austin TX
    - Assets: SolarEdge commercial inverters, Monitoring system
    - Projects: 2024 installation, Quarterly performance reports
    - Service Plan: Custom O&M ($3,000/year, $12/kW)

18. **Community Solar Farm LLC** - Utility-Scale Solar O&M
    - Site: 5MW community solar, North Carolina
    - Assets: Central inverters, Tracker system, SCADA
    - Projects: Construction 2023, Performance guarantee
    - Service Plan: Custom O&M ($50,000/year, $10/kW + availability SLA)

### Fire Protection (1 client)
19. **Northside Business Park** - Fire Sprinkler NFPA 25
    - Site: Multi-tenant office park, Denver CO
    - Assets: Wet pipe sprinkler system, Fire alarm panel
    - Projects: Annual NFPA 25 inspection, 5-year obstruction test
    - Service Plan: [MEP] Fire Protection Quarterly ($1,200/year)

### Roofing (1 client)
20. **Big Box Retail - Roofing Maintenance** - Commercial Roofing
    - Site: 150,000 sq ft big box store, Phoenix AZ
    - Assets: TPO flat roof, 20 RTU curbs, Skylights
    - Projects: Bi-annual roof inspection, Preventive maintenance
    - Service Plan: [MEP] Roofing Maintenance ($1,800/year)

---

## Implementation Checklist

### Phase 1: Client Cleanup
- [ ] Archive existing 152 clients to "Demo Archive" tag
- [ ] Delete duplicate/test clients
- [ ] Keep only the 20 strategic demo clients above

### Phase 2: Client Creation (Use Coperniq AI)
For each of the 20 clients:
- [ ] Create client with AI (name, type, contact info)
- [ ] Add site address with AI
- [ ] Assign appropriate service plan
- [ ] Add owner/manager assignment

### Phase 3: Asset Population (Use Coperniq AI)
For each client, create assets using AI by describing:
- [ ] Equipment type, manufacturer, model, serial number
- [ ] Installation date, expected lifetime
- [ ] Connected to service plan

### Phase 4: Project History (Use Coperniq AI)
For each client, create 2-3 historical projects:
- [ ] Installation projects
- [ ] Maintenance/service projects
- [ ] Emergency repair projects (where applicable)

### Phase 5: Invoice History (Use Coperniq AI)
For each client, create invoice examples:
- [ ] Service plan invoices (recurring)
- [ ] T&M service invoices
- [ ] Project/installation invoices
- [ ] Show payment structures in action

### Phase 6: Payment Structures
Build payment structure templates showcasing:
- [ ] Service Agreement Monthly (recurring)
- [ ] Project Milestone (30/30/30/10)
- [ ] T&M Emergency Service
- [ ] EaaS/Uptime SLA-based (innovative)
- [ ] ESPC Gain-Sharing (performance-based)

### Phase 7: Demo Validation
- [ ] Each client has complete data (site, assets, service plan, projects, invoices)
- [ ] All 14 service plans are in use
- [ ] All 8 payment structures are demonstrated
- [ ] All trades represented (HVAC, Plumbing, Electrical, Solar, Fire, Roofing)
- [ ] Geographic diversity (10+ states)
- [ ] Customer types: Residential, Commercial, Industrial, Healthcare, Government

---

## Demo Scenarios

### Scenario 1: Residential HVAC Contractor
**Client Profile**: Small HVAC company, 5 techs, residential focus
**Demo Flow**:
1. Show 4-tier service plan offering (Bronze/Silver/Gold/Platinum)
2. Customer in Silver plan needs upgrade → Show upsell to Gold
3. Show Work Order templates (AC Maintenance, Furnace Safety)
4. Show automation: Annual PM reminder triggers Work Order creation
5. Show invoice: Service plan annual billing + T&M add-on work

### Scenario 2: Multi-Trade MEP Contractor
**Client Profile**: Commercial MEP contractor, HVAC + Plumbing + Electrical + Fire
**Demo Flow**:
1. Show Downtown Office Tower with all trades
2. Show multi-trade project workflow (Bid → Install → Closeout)
3. Show payment structure: 30/30/30/10 milestone billing
4. Show cross-sell: HVAC customer gets plumbing backflow test
5. Show compliance: NFPA 25 fire sprinkler inspection form

### Scenario 3: Solar EPC + O&M
**Client Profile**: Solar installer transitioning to O&M revenue
**Demo Flow**:
1. Show 3-tier solar business: Residential, Commercial, Utility
2. Show installation project → O&M service plan attachment
3. Show monitoring integration (hypothetical)
4. Show SREC tracking, incentive management
5. Show O&M revenue: $12/kW-year pricing model

### Scenario 4: Property Management
**Client Profile**: Property manager, 500 units across 5 properties
**Demo Flow**:
1. Show Sunset Apartments with bulk service agreement
2. Show multi-location management
3. Show emergency dispatch workflow
4. Show invoice: Monthly billing for common area + per-unit charges
5. Show tenant portal (hypothetical)

### Scenario 5: Industrial/Mission Critical
**Client Profile**: Data center facility manager
**Demo Flow**:
1. Show DataCenter Midwest with 24/7 SLA requirements
2. Show uptime-based pricing: 99.9% availability guarantee
3. Show emergency response: 2-hour SLA automation
4. Show compliance: Generator NFPA 110 monthly load testing
5. Show invoice: Base fee + SLA bonus/penalty structure

---

## Success Metrics

**Demo Environment Quality**:
- All 20 clients fully populated (site, assets, service plan, projects, invoices)
- 100% service plan utilization (all 14 plans have assigned clients)
- 100% payment structure coverage (all 8 structures demonstrated)
- 100% trade coverage (HVAC, Plumbing, Electrical, Solar, Fire, Roofing, Low Voltage, Security)

**Sales Enablement**:
- 5 pre-built demo scenarios with talking points
- "Coperniq vs ServiceTitan" comparison showing what Coperniq can do that ST can't
- Battle cards for each vertical (Residential HVAC, Commercial MEP, Solar EPC, O&M)

**Technical Validation**:
- AI features used for all data creation (Assets, Projects, Invoices)
- Automations working (PM reminders, invoice generation, emergency dispatch)
- Service plan renewals configured
- Payment structures mapped to real-world use cases

---

## Next Steps

1. **Execute Phase 1**: Archive/delete existing clients → Clean slate
2. **Execute Phase 2**: Create 20 strategic demo clients using AI
3. **Execute Phase 3-5**: Populate with assets, projects, invoices using AI
4. **Execute Phase 6**: Build innovative payment structures
5. **Execute Phase 7**: Validate completeness, run demo scenarios

**Estimated Time**: 6-8 hours for complete demo environment build-out

**Tools Required**:
- Coperniq AI (for client/asset/project/invoice creation)
- Playwright MCP (for automation where needed)
- Manual configuration (for service plan assignment, automation setup)

---

**Last Updated**: 2025-12-21
**Status**: Planning complete, ready for execution
