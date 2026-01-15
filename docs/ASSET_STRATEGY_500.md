# Brand-Agnostic Asset Strategy - Instance 388

**Created**: 2026-01-15
**Vision**: 500-1000 assets across 4 verticals, monitored from ONE dashboard
**Competitive Moat**: Only platform showing Tesla + Enphase + Generac + SolarEdge in unified view

---

## The Problem We're Solving

Most contractors with 50+ energy systems use **5+ different apps** to monitor:
- Tesla → Tesla app
- Enphase → Enlighten
- Generac → PWRview
- SolarEdge → SetApp
- Sonnen → sonnenPortal

**Coperniq solves this** by becoming the single pane of glass for ALL assets.

---

## Asset Distribution Plan (700+ Assets)

### Energy + MEP (350 assets)

| Brand | Type | Residential | Commercial | Total | Age Profile |
|-------|------|-------------|------------|-------|-------------|
| Tesla Powerwall 2/3 | Battery | 60 | 20 | 80 | 0-3 years (new) |
| Tesla Megapack | Comm Battery | 0 | 10 | 10 | 0-2 years |
| Enphase IQ 5P/8 | Battery | 50 | 20 | 70 | 1-4 years |
| Enphase IQ8+ | Microinverter | 40 | 15 | 55 | 0-3 years |
| Generac PWRcell | Battery | 30 | 15 | 45 | 1-3 years |
| Generac Guardian | Generator | 25 | 20 | 45 | 2-8 years (mixed) |
| Kohler | Generator | 10 | 25 | 35 | 3-10 years |
| Cummins | Generator | 5 | 15 | 20 | 5-15 years (old) |
| SolarEdge | Inverter | 35 | 20 | 55 | 1-5 years |
| Fronius | Inverter | 20 | 15 | 35 | 2-6 years |
| SMA Sunny Boy | Inverter | 15 | 10 | 25 | 3-8 years |
| Sonnen ecoLinx | Battery | 20 | 5 | 25 | 1-3 years |
| Carrier/Trane RTU | HVAC | 0 | 40 | 40 | 5-15 years |
| Lennox/Rheem Split | HVAC | 50 | 0 | 50 | 3-12 years |
| **SUBTOTAL** | | **360** | **230** | **590** | |

### Roofing (100 assets)

| Type | Material | Count | Age Profile |
|------|----------|-------|-------------|
| Commercial TPO | White membrane | 35 | 2-15 years |
| Commercial EPDM | Rubber | 20 | 5-20 years |
| Metal Standing Seam | Galvalume/Aluminum | 15 | 0-30 years |
| Residential Asphalt | Architectural | 20 | 1-25 years |
| Solar-Ready Roofs | Pre-conduit | 10 | 0-3 years |
| **SUBTOTAL** | | **100** | |

### Low Voltage (100 assets)

| Brand/Type | Category | Count | Age Profile |
|------------|----------|-------|-------------|
| Honeywell/Tridium | BMS Controller | 25 | 2-10 years |
| Schneider EcoStruxure | BMS | 15 | 1-8 years |
| Lenel/S2 | Access Control | 20 | 2-12 years |
| Hikvision/Axis | IP Cameras | 25 | 1-5 years |
| Lutron/Crestron | Lighting Control | 10 | 3-8 years |
| Network Switches | Data/Fiber | 5 | 2-7 years |
| **SUBTOTAL** | | **100** | |

### Fire & Safety (100 assets)

| Brand/Type | Category | Count | Age Profile |
|------------|----------|-------|-------------|
| Tyco/SimplexGrinnell | Sprinkler System | 30 | 5-25 years |
| Notifier/Fire-Lite | Fire Alarm Panel | 25 | 3-15 years |
| Ansul/Amerex | Kitchen Suppression | 15 | 2-10 years |
| Kidde/Badger | Fire Extinguisher | 20 | 1-6 years |
| Emergency Lighting | Exit/Egress | 10 | 2-8 years |
| **SUBTOTAL** | | **100** | |

---

## Geographic Distribution (Map Demo)

### Service Territory: Southeast Region

| State | City/Area | Asset Count | Primary Types |
|-------|-----------|-------------|---------------|
| TN | Nashville Metro | 150 | Solar, Battery, HVAC |
| TN | Memphis | 75 | Commercial HVAC, Generator |
| GA | Atlanta Metro | 125 | Solar, Battery, Low Voltage |
| GA | Savannah | 50 | Commercial, Fire |
| AL | Birmingham | 75 | HVAC, Roofing |
| AL | Mobile | 50 | Residential, Generator |
| FL | Jacksonville | 100 | Solar, Battery |
| FL | Pensacola | 75 | Hurricane-related (Gen, Roof) |
| **TOTAL** | | **700** | |

---

## Asset Lifecycle Stories

### Old Assets (5-15+ years) - Ready for Replacement/Upgrade

| Client | Asset | Age | Story |
|--------|-------|-----|-------|
| Thompson Manufacturing | Carrier RTU 50-ton | 12 yrs | Compressor failing, replacement quote sent |
| Oak Hill Elementary | Trane Chiller | 18 yrs | Refrigerant phase-out, planning upgrade |
| Davis Office Park | Kohler 150kW Gen | 15 yrs | PM visit overdue, transfer switch issues |
| Riverside Medical | Fire alarm panel | 20 yrs | Code compliance issue, needs modernization |

### Mid-Life Assets (3-8 years) - Under Warranty, PM Schedules

| Client | Asset | Age | Story |
|--------|-------|-----|-------|
| Wilson Commercial | SolarEdge 10kW | 5 yrs | Extended warranty, annual inspection due |
| Martinez Restaurant | Ansul Hood System | 4 yrs | Semi-annual inspection (NFPA 96) |
| Anderson Medical | Generac PWRcell | 3 yrs | Warranty service, firmware update |
| Green Energy Homes | Enphase IQ8 array | 4 yrs | Production monitoring, cleaning due |

### New Assets (0-2 years) - Recently Installed by Kipper Energy

| Client | Asset | Age | Story |
|--------|-------|-----|-------|
| Metro Distribution | Tesla Megapack 2 | 6 mo | Just commissioned, monitoring setup |
| Sunnyvale HOA | 25x Tesla Powerwall 3 | 8 mo | Community solar + storage |
| Tech Campus | Enphase + Battery | 3 mo | Full building electrification |
| New Hospital Wing | Fire suppression | 1 yr | As-built documentation complete |

---

## Data Fields for Each Asset

### Required Fields (Coperniq Schema)
```yaml
Asset:
  title: "Tesla Powerwall 3 - Unit A"
  manufacturer: "Tesla"
  model: "Powerwall 3"
  serialNumber: "TW3-2024-XXXXXX"
  installDate: "2025-09-15"
  warrantyExpiration: "2035-09-15"
  capacity: "13.5 kWh"
  site:
    address: "123 Main St, Nashville, TN 37203"
    coordinates: [36.1627, -86.7816]
  contact:
    name: "John Smith"
    type: "Commercial"
```

### Custom Fields for Monitoring Demo
```yaml
# Energy Assets
currentOutput: "4.2 kW"  # Real-time production
stateOfCharge: "87%"     # Battery level
lastCommunication: "2026-01-15T10:30:00Z"
alertStatus: "Normal"    # Normal/Warning/Critical

# HVAC Assets
supplyTemp: "55°F"
returnTemp: "72°F"
refrigerantType: "R-410A"
refrigerantCharge: "12 lbs"

# Fire Assets
lastInspectionDate: "2025-10-15"
nextInspectionDue: "2026-01-15"
inspectionResult: "Pass"
deficienciesFound: 0
```

---

## API Batch Creation Strategy

### Using Coperniq GraphQL API
```graphql
mutation CreateAsset($input: AssetInput!) {
  createAsset(input: $input) {
    id
    title
    manufacturer
    model
    site {
      id
      address
    }
  }
}
```

### Python Script Structure
```python
# batch_create_assets.py
import asyncio
from coperniq_client import CoperniqClient

ENERGY_ASSETS = [
    {"manufacturer": "Tesla", "model": "Powerwall 3", "type": "Battery", "count": 80},
    {"manufacturer": "Enphase", "model": "IQ Battery 5P", "type": "Battery", "count": 70},
    # ... more
]

async def create_assets():
    client = CoperniqClient(api_key=COPERNIQ_API_KEY)

    for asset_spec in ENERGY_ASSETS:
        for i in range(asset_spec["count"]):
            # Generate realistic data
            serial = generate_serial(asset_spec["manufacturer"])
            install_date = random_date_in_range(...)
            site = random_site_in_territory()

            await client.create_asset({
                "title": f"{asset_spec['manufacturer']} {asset_spec['model']}",
                "manufacturer": asset_spec["manufacturer"],
                "model": asset_spec["model"],
                "serialNumber": serial,
                "installDate": install_date,
                "siteId": site.id
            })
```

---

## Map Visualization Features to Demo

1. **Cluster View**: 700 assets grouped by region
2. **Filter by Brand**: Show only Tesla, only Generac, etc.
3. **Filter by Status**: Normal (green), Warning (yellow), Critical (red)
4. **Filter by Trade**: Energy, Roofing, Low Voltage, Fire
5. **Route Optimization**: Plan service routes for PM visits
6. **Heat Map**: Asset density by neighborhood
7. **Timeline**: Assets by installation year

---

## Competitive Advantage Summary

| Feature | ServiceTitan | Procore | Salesforce | **Coperniq** |
|---------|--------------|---------|------------|--------------|
| Multi-brand asset monitoring | ❌ | ❌ | ❌ | ✅ |
| Geographic asset map | Limited | ❌ | ❌ | ✅ |
| Energy production tracking | ❌ | ❌ | ❌ | ✅ |
| Warranty management | ✅ | ❌ | ❌ | ✅ |
| PM scheduling by asset | ✅ | ❌ | ❌ | ✅ |
| Multi-trade projects | ❌ | ✅ | ❌ | ✅ |
| Service agreement tracking | ✅ | ❌ | ❌ | ✅ |

---

## Next Steps

1. [ ] Create 50 demo sites across SE region with realistic addresses
2. [ ] Build Python script for batch asset creation
3. [ ] Create 700 assets programmatically via API
4. [ ] Configure map visualization in Coperniq
5. [ ] Document the "one dashboard for all brands" demo script
6. [ ] Build MCP server for Claude to query/update assets

---

*This document supports the vision of Coperniq as the brand-agnostic monitoring platform for modern MEP contractors.*
