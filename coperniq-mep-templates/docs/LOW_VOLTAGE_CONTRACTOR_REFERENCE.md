# Low Voltage Contractor Project Workflows
## Expert Reference for Coperniq Workflow Configuration

**Document Version**: 1.0
**Date**: 2026-01-14
**Purpose**: Comprehensive reference for low voltage contractor workflows, compliance frameworks, RMR business models, and service offerings to support Coperniq template configuration.

---

## Table of Contents

1. [Low Voltage Trade Categories](#1-low-voltage-trade-categories)
2. [Market Segments](#2-market-segments)
3. [Compliance Framework](#3-compliance-framework-critical)
4. [Project Types & Phases](#4-project-types--phases)
5. [Security Systems Workflows](#5-security-systems-workflows)
6. [Structured Cabling Workflows](#6-structured-cabling-workflows)
7. [Audio/Visual Systems Workflows](#7-audiovisual-systems-workflows)
8. [Building Automation/BMS Workflows](#8-building-automationbms-workflows)
9. [Fire Alarm (Low Voltage) Workflows](#9-fire-alarm-low-voltage-workflows)
10. [Nurse Call & Healthcare Workflows](#10-nurse-call--healthcare-workflows)
11. [RMR Business Model (CRITICAL)](#11-rmr-business-model-critical)
12. [Service Plans & Pricing](#12-service-plans--pricing)
13. [Coperniq Workflow Mapping](#13-coperniq-workflow-mapping)
14. [Form Templates Reference](#14-form-templates-reference)

---

## 1. Low Voltage Trade Categories

### 1.1 Security Systems

Low voltage security systems operate at Class 2/Class 3 power levels (typically 12-24VDC) and encompass three primary subsystems:

| Subsystem | Components | Standards | Primary Function |
|-----------|------------|-----------|------------------|
| **Access Control** | Card readers, controllers, electric strikes, maglocks | UL 294, UL 1076 | Manage building entry/exit |
| **Video Surveillance (CCTV)** | IP cameras, NVRs, VMS software | UL 2900, ONVIF | Visual monitoring and recording |
| **Intrusion Detection** | Motion sensors, door/window contacts, glass break | UL 681, UL 1023 | Unauthorized entry detection |

**Integration Points:**
- All three subsystems typically connect to a central monitoring station (CMS)
- Video verification requires CCTV + intrusion integration
- Access control events can trigger camera recording
- Single pane of glass management via PSIM (Physical Security Information Management)

---

### 1.2 Structured Cabling Infrastructure

The foundation for ALL low voltage systems. Follows TIA-568 standards for telecommunications cabling.

| Cabling Type | Speed Rating | Max Distance | Primary Use Cases |
|--------------|--------------|--------------|-------------------|
| **Cat5e** | 1 Gbps | 100m | Legacy, VoIP phones |
| **Cat6** | 1 Gbps (10G at 55m) | 100m | Standard office, cameras |
| **Cat6A** | 10 Gbps | 100m | High-density, Wi-Fi 6 APs |
| **Cat8** | 25/40 Gbps | 30m | Data centers only |
| **OM3 Fiber** | 10 Gbps | 300m | Building backbone |
| **OM4 Fiber** | 100 Gbps | 150m | High-speed backbone |
| **OS2 Fiber** | 100+ Gbps | 10km+ | Campus, WAN connections |

**BICSI Installation Standards:**
- ANSI/BICSI N1-2019: Installation Practices
- ANSI/BICSI N2-2017: Remote Power (PoE)
- ANSI/BICSI N3-2020: Bonding & Grounding

---

### 1.3 Audio/Visual (A/V) Systems

Professional A/V spans multiple sub-categories:

| Category | Applications | Key Components |
|----------|--------------|----------------|
| **Conference Room** | Meetings, video calls | Displays, cameras, mics, DSPs |
| **Digital Signage** | Wayfinding, advertising | Players, commercial displays, CMS |
| **Distributed Audio** | Paging, background music | Amplifiers, 70V speakers |
| **Control Systems** | Room automation | Crestron/Extron processors, touch panels |
| **Video Walls** | Command centers, lobbies | Narrow-bezel displays, controllers |

**Key Brands (Enterprise):**
- Control: Crestron, Extron, AMX, Q-SYS
- Displays: Samsung, LG, Sony, NEC
- Conferencing: Poly, Logitech, Cisco Webex
- Audio: Biamp, QSC, Shure, Sennheiser

---

### 1.4 Building Automation / BMS (Low Voltage)

Building Management Systems control HVAC, lighting, and energy through low voltage networks:

| Protocol | Type | Primary Use | Interoperability |
|----------|------|-------------|------------------|
| **BACnet** | Open standard | HVAC, lighting | High - ASHRAE standard |
| **Modbus** | Open standard | Industrial, utilities | Medium - simple protocol |
| **KNX** | Open standard | European, lighting | Medium - requires gateway |
| **LonWorks** | Proprietary | Legacy BMS | Low - declining |
| **Zigbee/Z-Wave** | Wireless | Residential, IoT | Medium - consumer focus |

**Common BMS Points:**
- Temperature sensors (room, duct, OAT)
- Humidity sensors
- CO2 sensors (demand ventilation)
- Occupancy sensors
- Light level sensors
- Energy meters (sub-metering)
- Relay outputs (lighting, equipment)

---

### 1.5 Fire Alarm (Low Voltage Components)

While fire protection is a separate trade, the LOW VOLTAGE components of fire alarm systems are often installed by LV contractors:

| Component | Voltage | Standard | Notes |
|-----------|---------|----------|-------|
| FACP (Fire Alarm Control Panel) | 24VDC | NFPA 72, UL 864 | Main controller |
| Smoke Detectors | 24VDC | UL 268 | Photoelectric/ionization |
| Heat Detectors | 24VDC | UL 521 | Rate-of-rise, fixed temp |
| Notification Appliances | 24VDC | UL 464 | Horns, strobes, speakers |
| Duct Smoke Detectors | 24VDC | UL 268A | HVAC shutdown |
| Pull Stations | 24VDC | UL 38 | Manual activation |

**Licensing Note:** Most states require separate fire alarm contractor license (C-16 in California, F-04 in Texas, etc.)

---

### 1.6 Nurse Call / Healthcare Systems

Specialized low voltage systems for healthcare facilities:

| System Type | Application | Key Standard |
|-------------|-------------|--------------|
| **Nurse Call** | Patient-to-staff communication | UL 1069 |
| **Wander Management** | Dementia patient tracking | UL 2560 |
| **Infant Security** | Newborn abduction prevention | ASTM F2475 |
| **RTLS** | Real-time location services | IEEE 802.11, BLE |
| **Code Blue** | Emergency response | Joint Commission |

**Healthcare Integration Requirements:**
- HL7/FHIR integration with EMR systems
- Middleware for clinical workflows
- ADT (Admit/Discharge/Transfer) integration
- HIPAA compliance for patient data

---

## 2. Market Segments

Low voltage contractors serve three distinct market segments with different service requirements:

### 2.1 Residential

| Characteristic | Details |
|---------------|---------|
| **Typical Project Size** | $500 - $15,000 |
| **Decision Maker** | Homeowner |
| **Sales Cycle** | 1-14 days |
| **Payment Terms** | 50% deposit, 50% on completion |
| **RMR Focus** | Alarm monitoring ($29.95-$59.95/mo) |
| **Key Services** | Smart home, security, whole-house audio |

**Residential RMR Products:**
- Basic monitoring: $39.95/mo
- Interactive (app control): $59.95/mo
- Video verification: +$10/camera/mo
- Smart home automation: $89.95/mo

---

### 2.2 Commercial

| Characteristic | Details |
|---------------|---------|
| **Typical Project Size** | $10,000 - $500,000 |
| **Decision Maker** | Facility manager, IT director, procurement |
| **Sales Cycle** | 30-180 days |
| **Payment Terms** | Net 30, progress billing |
| **RMR Focus** | Monitoring + service contracts |
| **Key Services** | Access control, CCTV, structured cabling, conference rooms |

**Commercial Service Tiers:**
- Basic: Monitoring only ($95-$195/mo)
- Standard: Monitoring + annual inspection ($295-$495/mo)
- Premium: Monitoring + quarterly PM + priority response ($595-$995/mo)

---

### 2.3 Enterprise / Data Center

| Characteristic | Details |
|---------------|---------|
| **Typical Project Size** | $100,000 - $10,000,000+ |
| **Decision Maker** | VP of Security, CIO, Procurement Committee |
| **Sales Cycle** | 6-24 months |
| **Payment Terms** | Progress billing, retention |
| **RMR Focus** | Managed services, 24/7 SOC |
| **Key Services** | Enterprise access control, PSIM, data center cabling |

**Enterprise SLA Tiers:**
- Gold: 4-hour response, 99.5% uptime ($2,500-$7,500/mo)
- Platinum: 2-hour response, 99.9% uptime ($7,500-$15,000/mo)
- Mission Critical: 1-hour response, 99.99% uptime ($15,000-$50,000/mo)

---

## 3. Compliance Framework (CRITICAL)

### 3.1 Licensing Requirements by State

Low voltage contractor licensing varies significantly by state:

| State | License Type | Scope | Requirements |
|-------|-------------|-------|--------------|
| **California** | C-7 (Low Voltage) | All low voltage | 4 yrs experience, exam, bond |
| **Texas** | ACR (Alarm) + Electrician | Alarm + cabling | Separate licenses required |
| **Florida** | EF (Alarm) | Alarm systems | State registration |
| **New York** | Local (NYC varies) | Varies by borough | Fire alarm separate |
| **Illinois** | PFMA (Private Alarm) | Alarm systems | State license |

**National Certifications:**
- NICET (Fire Alarm): Levels I-IV
- ASIS CPP: Certified Protection Professional
- ESA NTS: National Training School
- BICSI RCDD: Registered Communications Distribution Designer
- CTS: Certified Technology Specialist (AVIXA)

---

### 3.2 Industry Standards

| Standard | Organization | Scope |
|----------|--------------|-------|
| **TIA-568** | TIA | Structured cabling |
| **TIA-606-C** | TIA | Labeling & administration |
| **TIA-607-D** | TIA | Bonding & grounding |
| **BICSI N-Series** | BICSI | Installation practices |
| **NFPA 72** | NFPA | Fire alarm code |
| **NFPA 70 (NEC)** | NFPA | Electrical code (Art. 725) |
| **UL 294** | UL | Access control units |
| **UL 681** | UL | Burglar alarm systems |
| **UL 864** | UL | Fire alarm control panels |
| **UL 2050** | UL | National industrial security |

---

### 3.3 NEC Article 725 - Class 2 and Class 3 Circuits

Low voltage work falls under NEC Article 725:

| Class | Voltage Limit | Current Limit | Power Limit | Typical Use |
|-------|---------------|---------------|-------------|-------------|
| **Class 1** | 30V / 600V | N/A | 1000 VA | HVAC controls, motors |
| **Class 2** | 30V | 8A | 100 VA | Most LV systems |
| **Class 3** | 100V | N/A | 100 VA | Nurse call, speakers |

**Key Installation Requirements:**
- Class 2/3 cables cannot share raceways with Class 1 or power circuits
- Plenum-rated (CMP) cables required in air-handling spaces
- Riser-rated (CMR) cables for vertical runs between floors
- Fire stopping required at fire-rated barriers
- Proper support and routing per BICSI standards

---

## 4. Project Types & Phases

### 4.1 New Construction (Design-Build)

**Phase Structure:**

| Phase | Duration | Activities | Deliverables |
|-------|----------|------------|--------------|
| **1. Design** | 2-8 weeks | Site surveys, BOMs, drawings | Shop drawings, submittals |
| **2. Rough-In** | 4-12 weeks | Conduit, backboxes, cable pull | Rough-in inspection |
| **3. Trim-Out** | 2-6 weeks | Device installation | Device termination |
| **4. Testing** | 1-4 weeks | Point-to-point, certification | Test reports |
| **5. Commissioning** | 1-2 weeks | Programming, integration | Commissioning report |
| **6. Training** | 1-3 days | End-user training | Training sign-off |
| **7. Closeout** | 1-2 weeks | As-builts, O&M manuals | Final documentation |

---

### 4.2 Retrofit / Renovation

**Key Differences from New Construction:**
- Existing infrastructure assessment required
- Cable pathway discovery (often limited)
- Phased installation to minimize disruption
- Integration with legacy systems
- AHJ approval for scope changes

**Retrofit Premium Factors:**
- After-hours work: +25-50%
- Occupied space work: +15-30%
- Historical buildings: +20-40%
- Asbestos/lead presence: +50-100%

---

### 4.3 Service & Maintenance

**Service Types:**

| Type | Frequency | Scope | Typical Cost |
|------|-----------|-------|--------------|
| **Break/Fix** | As needed | Reactive repairs | T&M ($125-$195/hr) |
| **Preventive Maintenance** | Quarterly/Annual | Scheduled inspections | $295-$1,495/visit |
| **Monitoring** | 24/7 | Remote surveillance | $39.95-$595/mo |
| **Managed Services** | 24/7 | Full outsourced support | $500-$5,000/mo |

---

## 5. Security Systems Workflows

### 5.1 Access Control Project Phases

#### Phase 1: Discovery & Design (1-3 weeks)
- Door hardware survey (existing locks, frames, power)
- IT infrastructure assessment (network, VLANs)
- Security policy review
- Credential technology selection (Prox, Smart Card, Mobile)
- Integration requirements (HR systems, visitor mgmt)

**Deliverables:**
- Site survey report
- Door schedule (all doors with hardware specs)
- System architecture diagram
- Bill of materials

#### Phase 2: Pre-Installation (1-2 weeks)
- Equipment procurement
- Controller configuration
- Card/credential enrollment
- Database setup

#### Phase 3: Installation (2-8 weeks)
- Power supply installation (12/24VDC)
- Low voltage wiring to each door
- Reader mounting
- Lock/strike installation
- Request-to-exit device installation
- Door position switch installation

**Per-Door Checklist:**
- [ ] Power supply adequate
- [ ] Cat6 to reader location
- [ ] 18/4 power to lock
- [ ] 22/4 to door contact
- [ ] 22/4 to REX
- [ ] Controller terminations
- [ ] Mechanical strike/latch alignment

#### Phase 4: Programming & Integration (1-2 weeks)
- Access levels configuration
- Schedule programming (business hours, holidays)
- Credential assignment
- Integration testing (elevators, alarms, cameras)
- Report configuration

#### Phase 5: Training & Closeout (1-2 days)
- Administrator training
- End-user training
- Badge issuance procedures
- Documentation handoff

---

### 5.2 Video Surveillance Project Phases

#### Phase 1: Site Survey & Design
- Coverage area mapping
- Camera placement design (field of view calculations)
- Network bandwidth analysis
- Storage requirements calculation
- Lighting assessment

**Storage Calculation:**
```
Daily Storage = (Cameras × Bitrate × Hours × 3600) / 8 / 1000 / 1000
30-Day Storage = Daily Storage × 30

Example: 16 cameras @ 8 Mbps, 24/7 recording
Daily = (16 × 8 × 24 × 3600) / 8,000,000 = 1.38 TB/day
30-Day = 41.4 TB required
```

#### Phase 2: Infrastructure
- Network drops at camera locations
- PoE switch installation
- NVR/server rack installation
- UPS sizing and installation

**PoE Power Budget:**
| Camera Type | Power Consumption | PoE Standard |
|-------------|-------------------|--------------|
| Basic IP | 8-15W | PoE (802.3af) |
| PTZ | 25-60W | PoE+ (802.3at) |
| Multi-sensor | 40-80W | PoE++ (802.3bt) |

#### Phase 3: Camera Installation
- Mount selection (wall, ceiling, pole, corner)
- Physical mounting
- Cable termination
- Aim and focus adjustment
- Weather sealing (outdoor)

#### Phase 4: VMS Configuration
- Camera discovery and addition
- Recording schedules
- Motion detection zones
- Analytics configuration (if applicable)
- User accounts and permissions
- Remote access setup

#### Phase 5: Acceptance Testing
- All cameras visible and recording
- Playback verification
- Remote access verification
- Analytics accuracy verification
- Night/low-light performance
- Motion detection validation

---

### 5.3 Intrusion Detection Workflow

**Panel Types:**
- Wired (traditional): Honeywell Vista, DSC PowerSeries
- Wireless: Qolsys, Alarm.com, 2GIG
- Hybrid: Combination wired + wireless

**Zone Types:**
| Zone Type | Function | Typical Devices |
|-----------|----------|-----------------|
| **Entry/Exit** | Delayed alarm | Front door, garage |
| **Perimeter** | Instant alarm | Windows, back doors |
| **Interior** | Follow zones | Motion sensors |
| **24-Hour** | Always armed | Panic, fire, medical |
| **Fire** | Supervised | Smoke/heat detectors |

**Central Station Signals:**
- Opening (disarm)
- Closing (arm)
- Alarm (zone activation)
- Trouble (low battery, tamper, comm fail)
- Restore (zone/trouble cleared)

---

## 6. Structured Cabling Workflows

### 6.1 New Construction Cabling

**Industry-Standard Phases:**

#### Phase 1: Design & Documentation
- Floor plan analysis
- MDF/IDF locations
- Cable pathway design
- Horizontal distribution
- Backbone design
- Bill of materials

**BICSI Design Standards:**
- Max horizontal run: 90m (295 ft) permanent link
- 10m (33 ft) allowance for patch cords
- MDF serves up to 90m radius
- IDF required if distance exceeds 90m
- Minimum 2 Cat6A drops per workstation

#### Phase 2: Rough-In
- J-hook installation
- Conduit installation (where required)
- Cable tray/ladder rack
- Backbox installation
- Pull string placement
- Firestopping sleeves

#### Phase 3: Cable Pulling
- Cable labeling (both ends)
- Pull tension limits (25 lbs for Cat6A)
- Bend radius compliance (4× cable diameter)
- Plenum rating verification
- Cable support intervals (4-5 ft max)

#### Phase 4: Termination
- Patch panel terminations
- Outlet terminations
- Fiber splicing/connectorization
- Labeling per TIA-606-C

**TIA-606-C Labeling Format:**
```
[Building]-[Floor]-[IDF]-[Patch Panel]-[Port]
Example: A-2-IDF1-PP1-24 = Building A, Floor 2, IDF1, Patch Panel 1, Port 24
```

#### Phase 5: Testing & Certification
- Wire map testing
- Length verification
- Insertion loss
- NEXT (Near-End Crosstalk)
- Return loss
- Propagation delay
- Alien crosstalk (Cat6A)

**Certification Levels:**
| Level | Tests | Required For |
|-------|-------|--------------|
| **Basic** | Wire map, length | Residential, basic commercial |
| **Level III** | + IL, NEXT, RL | Cat6 certification |
| **Level IV** | + ELFEXT, PSELFEXT | Cat6A certification |
| **Level V** | + Alien crosstalk | 10GBASE-T guarantee |

#### Phase 6: Documentation
- As-built drawings
- Test result database
- Labeling database
- Warranty registration
- O&M manuals

---

### 6.2 Fiber Optic Installation

**Fiber Types:**

| Type | Core/Cladding | Bandwidth | Max Distance | Use Case |
|------|---------------|-----------|--------------|----------|
| **OM3** | 50/125µm | 10G | 300m | Building backbone |
| **OM4** | 50/125µm | 100G | 150m | Data center |
| **OM5** | 50/125µm | 100G+ | 150m | SWDM applications |
| **OS2** | 9/125µm | 100G+ | 10km+ | Campus, WAN |

**Termination Methods:**
- Fusion splicing: Lowest loss (<0.1dB), requires splicer
- Mechanical splicing: Medium loss (<0.3dB), field repair
- Connectorization: Higher loss (<0.5dB), flexibility

**OTDR Testing (Tier 2):**
- Launch/receive fiber requirements
- Event markers (connectors, splices)
- Reflectance measurements
- Attenuation per km
- Bi-directional testing required

---

## 7. Audio/Visual Systems Workflows

### 7.1 Conference Room A/V

**Standard Room Configurations:**

| Room Size | Seats | Display | Camera | Audio |
|-----------|-------|---------|--------|-------|
| **Huddle** | 2-6 | 55-65" | USB video bar | Integrated |
| **Small** | 6-10 | 65-75" | PTZ 12x | Ceiling mic |
| **Medium** | 10-20 | 75-86" or dual | PTZ 20x | Multiple ceiling mics |
| **Large** | 20-40 | Dual 86"+ or projector | Dual PTZ | DSP + multiple mics |
| **Board** | 12-24 | Video wall or dual 86" | Tracking camera | Full DSP system |

**A/V Installation Phases:**

#### Phase 1: Pre-Wire
- Display mounting location
- Cable pathways (conduit/raceway)
- Floor box locations
- Ceiling mic locations
- Equipment rack location
- Network drops (minimum 2)

#### Phase 2: Equipment Installation
- Display mounting
- Equipment rack setup
- Control processor installation
- DSP installation
- Amplifier installation

#### Phase 3: Cabling
- HDMI/fiber runs
- Audio cabling
- Control wiring (RS-232, IR, relay)
- Network connections
- Power distribution

#### Phase 4: Programming
- Control system programming
- DSP configuration
- Camera presets
- Source switching
- Room automation
- UC platform integration (Teams, Zoom, Webex)

#### Phase 5: Commissioning
- Audio tuning (EQ, AEC)
- Video calibration
- Touch panel programming
- User testing
- Training

---

### 7.2 Digital Signage

**Deployment Types:**

| Type | Hardware | Software | Content |
|------|----------|----------|---------|
| **Stand-alone** | USB player | Local | Static images/video |
| **Networked** | Media player | CMS | Dynamic, scheduled |
| **Interactive** | Touch display + PC | Custom app | User-driven |
| **Video Wall** | Controller + displays | Wall processor | Multi-source |

**Key Metrics:**
- Screen brightness: 500+ nits indoor, 2500+ nits outdoor
- Operating hours: 16/7 commercial, 24/7 enterprise
- Content update frequency: Real-time to daily
- Failover: Cached content for network failures

---

## 8. Building Automation/BMS Workflows

### 8.1 BMS Project Phases

#### Phase 1: Sequences of Operation (SOO)
- HVAC equipment schedules
- Temperature setpoints
- Alarm conditions
- Energy management sequences
- Demand response integration

#### Phase 2: Point Installation
- Sensor installation
- Actuator installation
- VFD communication wiring
- Controller mounting
- Network backbone

**Common Point Types:**
| Point Type | Abbreviation | Example |
|------------|--------------|---------|
| Analog Input | AI | Temperature sensor |
| Analog Output | AO | Valve actuator |
| Digital Input | DI | Switch status |
| Digital Output | DO | Relay command |
| Virtual Point | VP | Calculated value |

#### Phase 3: Controller Programming
- Point configuration
- Control loop tuning
- Alarm limits
- Trending setup
- Schedule programming

#### Phase 4: Graphics Development
- System overview graphics
- Equipment detail graphics
- Floor plan graphics
- Alarm summary pages
- Trend viewers

#### Phase 5: Commissioning
- Point-to-point verification
- Functional performance testing
- Control loop optimization
- Energy baseline establishment
- Operator training

---

## 9. Fire Alarm (Low Voltage) Workflows

### 9.1 Fire Alarm Installation (LV Contractor Scope)

**Typical LV Contractor Responsibilities:**
- Conduit and raceway installation
- Cable pulling (plenum-rated FPLP)
- Device mounting (smoke, heat, horns, strobes)
- Terminations at devices and FACP
- Initial functional testing

**Licensed Fire Alarm Contractor Responsibilities:**
- System design
- FACP programming
- Final testing and certification
- AHJ inspection coordination
- Central station connection

### 9.2 Device Spacing Requirements

**Smoke Detectors (NFPA 72):**
- Smooth ceiling: 30 ft spacing (900 sq ft coverage)
- Beamed ceiling: Varies by beam depth
- Sloped ceiling: Within 4 ft of peak
- Wall-mounted: 4-12 inches from ceiling

**Horn/Strobes (ADA/NFPA 72):**
- 15 candela minimum (small rooms <20×20)
- 30 candela (up to 28×28)
- 75-110 candela (larger areas)
- Sleeping areas: 110+ candela
- Sound: 75 dBA minimum, 15 dBA above ambient

---

## 10. Nurse Call & Healthcare Workflows

### 10.1 Nurse Call System Types

| System Type | Technology | Scalability | Integration |
|-------------|------------|-------------|-------------|
| **Wired** | Hardwired | Large facilities | Full EMR/RTLS |
| **Wireless** | RF/Wi-Fi | Retrofit, assisted living | Moderate |
| **Hybrid** | Wired backbone + wireless | Flexible | Full |
| **VoIP-based** | IP network | Modern facilities | Extensive |

### 10.2 Installation Requirements

**Patient Room Requirements:**
- Pillow speaker station at bedside
- Bathroom pull cord station
- Staff emergency (code blue) button
- Corridor dome light
- TV/entertainment integration (optional)

**Nursing Station Requirements:**
- Master station console
- Annunciator panel
- Middleware integration
- Report printing

**Code Requirements:**
- UL 1069 certification
- Joint Commission readiness
- CMS requirements (skilled nursing)
- State health department codes

---

## 11. RMR Business Model (CRITICAL)

### 11.1 Why RMR Matters

Recurring Monthly Revenue is the primary driver of low voltage company valuation:

| Business Model | Valuation Multiple | Example Value |
|----------------|-------------------|---------------|
| **Project-only** | 0.3-0.5× annual revenue | $300K-$500K per $1M |
| **RMR 25%** | 1.0-1.5× annual revenue | $1M-$1.5M per $1M |
| **RMR 50%+** | 2.0-3.0× annual revenue | $2M-$3M per $1M |
| **RMR 75%+** | 3.0-4.5× annual revenue | $3M-$4.5M per $1M |

### 11.2 RMR Categories

#### Monitoring Services

| Service | Dealer Cost | Customer Price | Margin |
|---------|-------------|----------------|--------|
| Basic Alarm Monitoring | $15/mo | $39.95/mo | 62% |
| Premium Monitoring (Fire + Video) | $22/mo | $59.95/mo | 63% |
| Interactive (App Control) | $35/mo | $89.95/mo | 61% |
| Fire Alarm Monitoring | $35/mo | $95.00/mo | 63% |
| Video Verification | $45/mo | $125.00/mo | 64% |

#### Managed Services

| Service | Dealer Cost | Customer Price | Margin |
|---------|-------------|----------------|--------|
| Remote Video Monitoring | $25/cam/mo | $75/cam/mo | 67% |
| Access Control Cloud | $8/door/mo | $25/door/mo | 68% |
| BMS Remote Monitoring | $250/mo | $595/mo | 58% |
| AV Remote Support | $150/mo | $395/mo | 62% |
| Network Monitoring | $50/site/mo | $150/site/mo | 67% |

#### Service Agreements

| Tier | Services Included | Residential | Commercial |
|------|-------------------|-------------|------------|
| **Bronze** | Monitoring only | $29.95/mo | $95/mo |
| **Silver** | + Annual inspection | $49.95/mo | $195/mo |
| **Gold** | + Quarterly PM | $69.95/mo | $395/mo |
| **Platinum** | + Priority response | $99.95/mo | $795/mo |

### 11.3 RMR Acquisition Strategies

1. **Installation Subsidies**: Reduce upfront cost in exchange for 36-60 month monitoring agreement
2. **Technology Upgrades**: Upgrade legacy systems with cloud services
3. **Takeover Programs**: Convert competitor accounts with free equipment
4. **Bundling**: Package monitoring with service agreement
5. **Video Add-On**: Add cloud video storage to existing alarm accounts

---

## 12. Service Plans & Pricing

### 12.1 Residential Service Plans

| Plan | Monthly | Annual | Included Services |
|------|---------|--------|-------------------|
| **Basic Monitoring** | $39.95 | $479 | 24/7 central station, cellular |
| **Premium Monitoring** | $59.95 | $719 | + Fire, video verification |
| **Interactive** | $89.95 | $1,079 | + App control, smart home |
| **Total Protection** | $129.95 | $1,559 | + Service agreement, priority |

### 12.2 Commercial Service Plans

| Plan | Monthly | Annual | SLA Response |
|------|---------|--------|--------------|
| **Standard** | $195 | $2,340 | Next business day |
| **Professional** | $395 | $4,740 | Same day |
| **Enterprise** | $795 | $9,540 | 4-hour |
| **Mission Critical** | $1,495 | $17,940 | 2-hour |

### 12.3 Service Agreement Components

**Included in All Plans:**
- 24/7 monitoring
- Cellular communication
- Quarterly system health reports
- Software/firmware updates
- Phone support

**Professional Tier Adds:**
- Annual on-site inspection
- Battery replacement
- Sensor testing
- 15% parts discount

**Enterprise Tier Adds:**
- Quarterly on-site PM
- 25% parts discount
- Dedicated account manager
- Monthly reporting

**Mission Critical Adds:**
- Monthly on-site PM
- 40% parts discount
- 24/7 NOC monitoring
- Spare equipment program

---

## 13. Coperniq Workflow Mapping

### 13.1 Project Workflows

| Workflow Name | Phase Count | Trigger | Primary Use |
|---------------|-------------|---------|-------------|
| `[MEP] Security System Install` | 7 | New sale | Access/CCTV/intrusion projects |
| `[MEP] Structured Cabling Project` | 6 | Contract signed | New construction cabling |
| `[MEP] A/V Conference Room` | 5 | PO received | Conference room installations |
| `[MEP] BMS Integration` | 6 | Design complete | Building automation projects |
| `[MEP] Fire Alarm Install (LV)` | 5 | GC assignment | Fire alarm rough-in/trim |

### 13.2 Request Workflows

| Workflow Name | Use Case | SLA |
|---------------|----------|-----|
| `[MEP] Security Service Request` | Alarm trouble, camera issues | 4-24 hrs |
| `[MEP] Network Troubleshooting` | Connectivity issues | 2-8 hrs |
| `[MEP] A/V Support Request` | Conference room issues | 2-4 hrs |
| `[MEP] Add-On Sales Request` | Expansion quotes | 1-3 days |

### 13.3 Work Order Templates

**Field Work Orders:**
| Template | Duration | Skills Required |
|----------|----------|-----------------|
| `[MEP] Access Control - Single Door` | 2-4 hrs | Access control cert |
| `[MEP] Camera Installation` | 1-2 hrs | IP networking |
| `[MEP] Cable Certification` | 15 min/drop | BICSI cert |
| `[MEP] Alarm Panel Service` | 1-2 hrs | Alarm license |
| `[MEP] A/V Troubleshooting` | 1-4 hrs | CTS certification |

**Office Work Orders:**
| Template | Duration | Role |
|----------|----------|------|
| `[MEP] System Design - Access Control` | 8-40 hrs | Designer |
| `[MEP] VMS Programming` | 2-8 hrs | Programmer |
| `[MEP] Credential Enrollment` | 15 min/user | Admin |
| `[MEP] Monitoring Account Setup` | 30 min | Central station |

---

## 14. Form Templates Reference

### 14.1 Security System Forms

| Form Name | Sections | Fields | Use Phase |
|-----------|----------|--------|-----------|
| Security System Site Survey | 6 | 35 | Pre-sale |
| Access Control Door Schedule | 4 | 25 | Design |
| Camera Placement Worksheet | 5 | 30 | Design |
| Network Infrastructure Assessment | 4 | 20 | Pre-install |
| Access Control Commissioning | 7 | 45 | Closeout |
| CCTV Acceptance Test | 6 | 35 | Closeout |

### 14.2 Structured Cabling Forms

| Form Name | Sections | Fields | Use Phase |
|-----------|----------|--------|-----------|
| Cabling Site Survey | 5 | 25 | Pre-sale |
| MDF/IDF Build Specification | 6 | 40 | Design |
| Cable Test Report | 4 | 20 | Testing |
| Fiber Certification Report | 5 | 30 | Testing |
| As-Built Documentation | 4 | 15 | Closeout |

### 14.3 A/V System Forms

| Form Name | Sections | Fields | Use Phase |
|-----------|----------|--------|-----------|
| Conference Room Survey | 6 | 35 | Pre-sale |
| A/V Equipment Proposal | 5 | 30 | Design |
| Display Installation Checklist | 4 | 20 | Install |
| Audio Tuning Report | 5 | 25 | Commission |
| User Training Sign-Off | 3 | 10 | Closeout |

### 14.4 Service & RMR Forms

| Form Name | Sections | Fields | Use Phase |
|-----------|----------|--------|-----------|
| Monitoring Agreement | 4 | 15 | Sales |
| Service Agreement | 5 | 20 | Sales |
| Annual Inspection Report | 8 | 50 | Service |
| Quarterly PM Report | 6 | 35 | Service |
| Customer Satisfaction Survey | 3 | 12 | Post-service |

---

## Appendix A: Low Voltage Catalog Items

See `research/low-voltage-catalog-gaps.md` for comprehensive 229-item catalog covering:
- Access Control (31 items)
- Video Surveillance (29 items)
- Intrusion Detection (12 items)
- Fire Alarm LV (16 items)
- Audio/Visual (35 items)
- Structured Cabling (40 items)
- Building Automation (21 items)
- Nurse Call (16 items)
- Data Center (9 items)
- Intercom/Paging (5 items)
- RMR Services (15 items)

---

## Appendix B: Key Vendor Contacts

### Security Manufacturers
- **Access Control**: HID Global, Mercury Security, Allegion, ASSA ABLOY
- **Video**: Axis, Hanwha, Verkada, Milestone, Genetec
- **Intrusion**: Honeywell, DSC, Qolsys, Alarm.com

### Structured Cabling
- **Cable**: Belden, CommScope, Panduit, Leviton
- **Testing**: Fluke Networks, VIAVI

### A/V
- **Control**: Crestron, Extron, Q-SYS
- **Display**: Samsung Business, LG Business, Sony Pro
- **Conferencing**: Poly, Logitech, Cisco

### Central Stations
- **National**: COPS Monitoring, Rapid Response, Affiliated Monitoring
- **Regional**: Per market

---

## Appendix C: Industry Resources

### Associations
- ESA (Electronic Security Association)
- SIA (Security Industry Association)
- BICSI
- AVIXA (Audiovisual and Integrated Experience Association)
- NSCA (National Systems Contractors Association)

### Certifications
- NICET (Fire Alarm Levels I-IV)
- ASIS CPP/PSP/PCI
- BICSI RCDD/TECH/INSTALLER
- AVIXA CTS/CTS-D/CTS-I
- ESA NTS

### Publications
- Security Sales & Integration (SSI)
- Security Business
- Commercial Integrator
- Cabling Installation & Maintenance
- AVNetwork

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-14 | Claude/Tim | Initial creation - comprehensive LV reference |

---

*This document provides the foundation for building comprehensive Low Voltage contractor templates in Coperniq Process Studio. The RMR business model sections are particularly critical for contractors transitioning from project-based to recurring revenue models.*
