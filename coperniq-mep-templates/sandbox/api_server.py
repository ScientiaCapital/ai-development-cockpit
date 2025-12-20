"""
Coperniq MEP + Clean Energy Platform - FastAPI Server

TUD Market (Tenants, Users, Developers/Owners) + Clean Energy Integration
The blue ocean opportunity for MEP contractors in the energy transition.

Run: uvicorn sandbox.api_server:app --reload --port 8000
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# Load environment
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

# Import our E2B runtime
from sandbox.e2b_runtime import E2BSandboxRuntime, SandboxInstance, AgentResponse, TrialStatus

# =============================================================================
# FASTAPI APP
# =============================================================================

app = FastAPI(
    title="Coperniq MEP + Clean Energy Platform",
    description="""
    ## TUD Market Integration

    **Tenants** | **Users** | **Developers/Owners**

    The blue ocean opportunity connecting MEP contractors with clean energy
    and the real estate sector.

    ### Features
    - Multi-trade contractor configuration
    - Clean energy (Solar, Storage, EV) integration
    - O&M service management
    - ESG reporting ready
    - E2B cloud sandbox execution
    """,
    version="1.0.0"
)

# CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global runtime instance
runtime: Optional[E2BSandboxRuntime] = None

# =============================================================================
# TUD MARKET CONFIGURATION
# =============================================================================

TUD_MARKET_SEGMENTS = {
    "tenants": {
        "name": "Tenants",
        "description": "Residential and commercial tenants seeking energy efficiency",
        "interests": ["Lower utility bills", "Comfort", "Sustainability", "Co-investment in solar"],
        "templates": ["tenant_energy_audit", "comfort_survey", "solar_co_invest_agreement"]
    },
    "users": {
        "name": "Building Users/Occupants",
        "description": "Property managers, facility managers, building operators",
        "interests": ["Operational efficiency", "Maintenance", "Compliance", "Asset management"],
        "templates": ["facility_inspection", "equipment_inventory", "maintenance_schedule", "compliance_checklist"]
    },
    "developers_owners": {
        "name": "Developers/Owners",
        "description": "Real estate developers, property owners, investors",
        "interests": ["ROI", "ESG compliance", "Property value", "Green certifications"],
        "templates": ["solar_feasibility", "esg_assessment", "green_certification_tracker", "capex_proposal"]
    }
}

# =============================================================================
# FULL CONTRACTOR CONFIGURATION
# =============================================================================

CONTRACTOR_CONFIG = {
    "company_types": {
        "self_perform_mep": {
            "name": "Self-Performing MEP Contractor",
            "description": "Full-service MEP contractor with in-house crews",
            "default_trades": ["hvac", "plumbing", "electrical"],
            "default_services": ["installation", "service", "maintenance"]
        },
        "solar_epc": {
            "name": "Solar EPC Contractor",
            "description": "Solar installation and project management",
            "default_trades": ["solar", "electrical"],
            "default_services": ["design", "installation", "interconnection", "monitoring"]
        },
        "om_provider": {
            "name": "O&M Service Provider",
            "description": "Operations & maintenance for buildings and systems",
            "default_trades": ["hvac", "electrical", "solar"],
            "default_services": ["maintenance", "monitoring", "emergency_service"]
        },
        "multi_trade_full": {
            "name": "Multi-Trade Full Service",
            "description": "Complete MEP + Energy + O&M contractor",
            "default_trades": ["hvac", "plumbing", "electrical", "solar", "fire_protection", "controls"],
            "default_services": ["installation", "service", "maintenance", "monitoring", "emergency_service"]
        }
    },

    "trades": {
        "hvac": {
            "name": "HVAC",
            "icon": "❄️",
            "templates": [
                "hvac_lead_intake",
                "hvac_site_survey",
                "hvac_load_calc",
                "hvac_equipment_proposal",
                "hvac_installation_checklist",
                "hvac_startup_commissioning",
                "hvac_service_call",
                "hvac_pm_visit",
                "hvac_refrigerant_log"
            ],
            "certifications": ["EPA 608", "NATE", "OSHA 10/30"]
        },
        "plumbing": {
            "name": "Plumbing",
            "icon": "🔧",
            "templates": [
                "plumbing_service_call",
                "plumbing_drain_camera",
                "plumbing_backflow_test",
                "plumbing_water_heater_install",
                "plumbing_repipe_proposal",
                "plumbing_fixture_inventory"
            ],
            "certifications": ["Journeyman Plumber", "Backflow Tester"]
        },
        "electrical": {
            "name": "Electrical",
            "icon": "⚡",
            "templates": [
                "electrical_panel_inspection",
                "electrical_circuit_analysis",
                "electrical_ev_charger_install",
                "electrical_generator_install",
                "electrical_lighting_audit",
                "electrical_service_upgrade"
            ],
            "certifications": ["Journeyman Electrician", "Master Electrician"]
        },
        "solar": {
            "name": "Solar/Clean Energy",
            "icon": "☀️",
            "templates": [
                "solar_site_assessment",
                "solar_shade_analysis",
                "solar_proposal",
                "solar_permit_package",
                "solar_installation_checklist",
                "solar_commissioning",
                "solar_production_verification",
                "solar_om_inspection",
                "battery_storage_proposal",
                "ev_charging_proposal"
            ],
            "certifications": ["NABCEP PV", "OSHA 10/30"]
        },
        "fire_protection": {
            "name": "Fire Protection",
            "icon": "🔥",
            "templates": [
                "fire_sprinkler_inspection",
                "fire_extinguisher_inspection",
                "fire_alarm_inspection",
                "fire_suppression_inspection",
                "fire_hydrant_flow_test"
            ],
            "certifications": ["NICET", "State Fire Marshal License"]
        },
        "controls": {
            "name": "Building Controls/BAS",
            "icon": "🎛️",
            "templates": [
                "bas_point_verification",
                "bas_sequence_of_operations",
                "bas_trend_analysis",
                "bas_energy_optimization",
                "thermostat_programming"
            ],
            "certifications": ["BACnet Certified", "Manufacturer Specific"]
        }
    },

    "services": {
        "installation": {
            "name": "New Installation",
            "phases": ["sales", "design", "permit", "install", "commission", "closeout"],
            "templates": ["proposal", "contract", "permit_app", "install_checklist", "commissioning", "warranty"]
        },
        "service": {
            "name": "Service/Repair",
            "phases": ["dispatch", "diagnose", "repair", "invoice"],
            "templates": ["service_call", "diagnosis_report", "repair_ticket", "invoice"]
        },
        "maintenance": {
            "name": "Preventive Maintenance",
            "phases": ["schedule", "perform", "report", "recommend"],
            "templates": ["pm_schedule", "pm_checklist", "condition_report", "recommendation"]
        },
        "monitoring": {
            "name": "Remote Monitoring",
            "phases": ["setup", "monitor", "alert", "respond"],
            "templates": ["monitoring_setup", "alert_config", "performance_report"]
        },
        "emergency_service": {
            "name": "24/7 Emergency",
            "phases": ["dispatch", "respond", "resolve", "followup"],
            "templates": ["emergency_dispatch", "emergency_report", "followup_proposal"]
        }
    },

    "market_segments": {
        "residential": {
            "name": "Residential",
            "icon": "🏠",
            "tud_focus": ["tenants", "users"],
            "typical_projects": ["HVAC replacement", "Water heater", "Solar install", "EV charger"]
        },
        "commercial": {
            "name": "Commercial",
            "icon": "🏢",
            "tud_focus": ["users", "developers_owners"],
            "typical_projects": ["RTU replacement", "Lighting retrofit", "Solar PPA", "BAS upgrade"]
        },
        "industrial": {
            "name": "Industrial/Manufacturing",
            "icon": "🏭",
            "tud_focus": ["users", "developers_owners"],
            "typical_projects": ["Process cooling", "Compressed air", "Solar + storage", "Power quality"]
        },
        "multifamily": {
            "name": "Multifamily",
            "icon": "🏘️",
            "tud_focus": ["tenants", "developers_owners"],
            "typical_projects": ["Central plant", "Unit turnover", "Solar community", "EV infrastructure"]
        }
    }
}

# =============================================================================
# FULL TEMPLATE CATALOG
# =============================================================================

TEMPLATE_CATALOG = {
    # HVAC Templates (10)
    "hvac_lead_intake": {
        "name": "HVAC Lead Intake Form",
        "trade": "hvac",
        "phase": "sales",
        "fields": 15,
        "coperniq_type": "Form",
        "description": "Capture lead info, system type, urgency, budget"
    },
    "hvac_site_survey": {
        "name": "HVAC Site Survey",
        "trade": "hvac",
        "phase": "sales",
        "fields": 25,
        "coperniq_type": "Form",
        "description": "Measure space, document existing equipment, photos"
    },
    "hvac_load_calc": {
        "name": "HVAC Load Calculation",
        "trade": "hvac",
        "phase": "design",
        "fields": 30,
        "coperniq_type": "Form",
        "description": "Manual J/S calculations, equipment sizing"
    },
    "hvac_equipment_proposal": {
        "name": "HVAC Equipment Proposal",
        "trade": "hvac",
        "phase": "sales",
        "fields": 20,
        "coperniq_type": "Form",
        "description": "Good/Better/Best options, financing, rebates"
    },
    "hvac_installation_checklist": {
        "name": "HVAC Installation Checklist",
        "trade": "hvac",
        "phase": "install",
        "fields": 35,
        "coperniq_type": "Form",
        "description": "Step-by-step installation verification"
    },
    "hvac_startup_commissioning": {
        "name": "HVAC Startup & Commissioning",
        "trade": "hvac",
        "phase": "commission",
        "fields": 40,
        "coperniq_type": "Form",
        "description": "System startup, performance verification, handoff"
    },
    "hvac_service_call": {
        "name": "HVAC Service Call",
        "trade": "hvac",
        "phase": "service",
        "fields": 20,
        "coperniq_type": "Task",
        "description": "Diagnosis, repair, parts used, labor"
    },
    "hvac_pm_visit": {
        "name": "HVAC PM Visit",
        "trade": "hvac",
        "phase": "maintenance",
        "fields": 45,
        "coperniq_type": "Task",
        "description": "Seasonal maintenance checklist, condition report"
    },
    "hvac_refrigerant_log": {
        "name": "Refrigerant Tracking Log",
        "trade": "hvac",
        "phase": "service",
        "fields": 15,
        "coperniq_type": "Form",
        "description": "EPA 608 compliant refrigerant tracking"
    },

    # Plumbing Templates (6)
    "plumbing_service_call": {
        "name": "Plumbing Service Call",
        "trade": "plumbing",
        "phase": "service",
        "fields": 18,
        "coperniq_type": "Task",
        "description": "Diagnosis, repair, materials, labor"
    },
    "plumbing_drain_camera": {
        "name": "Drain Camera Inspection",
        "trade": "plumbing",
        "phase": "service",
        "fields": 15,
        "coperniq_type": "Form",
        "description": "Video inspection with findings and recommendations"
    },
    "plumbing_backflow_test": {
        "name": "Backflow Preventer Test",
        "trade": "plumbing",
        "phase": "maintenance",
        "fields": 20,
        "coperniq_type": "Form",
        "description": "Annual backflow testing per local requirements"
    },
    "plumbing_water_heater_install": {
        "name": "Water Heater Installation",
        "trade": "plumbing",
        "phase": "install",
        "fields": 25,
        "coperniq_type": "Form",
        "description": "Tank/tankless install checklist"
    },
    "plumbing_repipe_proposal": {
        "name": "Repipe Proposal",
        "trade": "plumbing",
        "phase": "sales",
        "fields": 18,
        "coperniq_type": "Form",
        "description": "Whole-house repipe scope and pricing"
    },
    "plumbing_fixture_inventory": {
        "name": "Plumbing Fixture Inventory",
        "trade": "plumbing",
        "phase": "service",
        "fields": 25,
        "coperniq_type": "Form",
        "description": "Document all fixtures for service agreements"
    },

    # Electrical Templates (6)
    "electrical_panel_inspection": {
        "name": "Electrical Panel Inspection",
        "trade": "electrical",
        "phase": "service",
        "fields": 30,
        "coperniq_type": "Form",
        "description": "Panel safety inspection, capacity analysis"
    },
    "electrical_circuit_analysis": {
        "name": "Circuit Load Analysis",
        "trade": "electrical",
        "phase": "design",
        "fields": 25,
        "coperniq_type": "Form",
        "description": "Load calculations for upgrades or additions"
    },
    "electrical_ev_charger_install": {
        "name": "EV Charger Installation",
        "trade": "electrical",
        "phase": "install",
        "fields": 22,
        "coperniq_type": "Form",
        "description": "Level 2/DC fast charger installation checklist"
    },
    "electrical_generator_install": {
        "name": "Generator Installation",
        "trade": "electrical",
        "phase": "install",
        "fields": 28,
        "coperniq_type": "Form",
        "description": "Standby/portable generator install and transfer switch"
    },
    "electrical_lighting_audit": {
        "name": "Lighting Audit",
        "trade": "electrical",
        "phase": "sales",
        "fields": 20,
        "coperniq_type": "Form",
        "description": "LED retrofit opportunity analysis"
    },
    "electrical_service_upgrade": {
        "name": "Service Upgrade Proposal",
        "trade": "electrical",
        "phase": "sales",
        "fields": 18,
        "coperniq_type": "Form",
        "description": "Panel upgrade, service entrance, meter base"
    },

    # Solar/Clean Energy Templates (10)
    "solar_site_assessment": {
        "name": "Solar Site Assessment",
        "trade": "solar",
        "phase": "sales",
        "fields": 35,
        "coperniq_type": "Form",
        "description": "Roof/ground assessment, shading, electrical"
    },
    "solar_shade_analysis": {
        "name": "Solar Shade Analysis",
        "trade": "solar",
        "phase": "design",
        "fields": 15,
        "coperniq_type": "Form",
        "description": "Sunpath, obstructions, production estimate"
    },
    "solar_proposal": {
        "name": "Solar Proposal",
        "trade": "solar",
        "phase": "sales",
        "fields": 25,
        "coperniq_type": "Form",
        "description": "System design, pricing, financing, savings"
    },
    "solar_permit_package": {
        "name": "Solar Permit Package",
        "trade": "solar",
        "phase": "permit",
        "fields": 20,
        "coperniq_type": "Form",
        "description": "Permit application, plans, structural calcs"
    },
    "solar_installation_checklist": {
        "name": "Solar Installation Checklist",
        "trade": "solar",
        "phase": "install",
        "fields": 50,
        "coperniq_type": "Form",
        "description": "Mounting, wiring, equipment, safety"
    },
    "solar_commissioning": {
        "name": "Solar Commissioning",
        "trade": "solar",
        "phase": "commission",
        "fields": 30,
        "coperniq_type": "Form",
        "description": "System test, monitoring setup, customer training"
    },
    "solar_production_verification": {
        "name": "Production Verification",
        "trade": "solar",
        "phase": "commission",
        "fields": 15,
        "coperniq_type": "Form",
        "description": "Compare actual vs projected production"
    },
    "solar_om_inspection": {
        "name": "Solar O&M Inspection",
        "trade": "solar",
        "phase": "maintenance",
        "fields": 35,
        "coperniq_type": "Form",
        "description": "Annual inspection, cleaning, performance check"
    },
    "battery_storage_proposal": {
        "name": "Battery Storage Proposal",
        "trade": "solar",
        "phase": "sales",
        "fields": 22,
        "coperniq_type": "Form",
        "description": "Battery sizing, backup loads, ROI"
    },
    "ev_charging_proposal": {
        "name": "EV Charging Proposal",
        "trade": "solar",
        "phase": "sales",
        "fields": 18,
        "coperniq_type": "Form",
        "description": "Charger selection, installation scope, utility coordination"
    },

    # Fire Protection Templates (5)
    "fire_sprinkler_inspection": {
        "name": "Sprinkler System Inspection",
        "trade": "fire_protection",
        "phase": "maintenance",
        "fields": 40,
        "coperniq_type": "Form",
        "description": "NFPA 25 compliant inspection"
    },
    "fire_extinguisher_inspection": {
        "name": "Fire Extinguisher Inspection",
        "trade": "fire_protection",
        "phase": "maintenance",
        "fields": 15,
        "coperniq_type": "Form",
        "description": "Monthly/annual extinguisher inspection"
    },
    "fire_alarm_inspection": {
        "name": "Fire Alarm Inspection",
        "trade": "fire_protection",
        "phase": "maintenance",
        "fields": 35,
        "coperniq_type": "Form",
        "description": "Annual fire alarm system testing"
    },
    "fire_suppression_inspection": {
        "name": "Suppression System Inspection",
        "trade": "fire_protection",
        "phase": "maintenance",
        "fields": 30,
        "coperniq_type": "Form",
        "description": "Hood suppression, clean agent systems"
    },
    "fire_hydrant_flow_test": {
        "name": "Fire Hydrant Flow Test",
        "trade": "fire_protection",
        "phase": "maintenance",
        "fields": 20,
        "coperniq_type": "Form",
        "description": "Annual hydrant flow testing"
    },

    # Building Controls Templates (5)
    "bas_point_verification": {
        "name": "BAS Point Verification",
        "trade": "controls",
        "phase": "commission",
        "fields": 50,
        "coperniq_type": "Form",
        "description": "Verify all control points functional"
    },
    "bas_sequence_of_operations": {
        "name": "Sequence of Operations",
        "trade": "controls",
        "phase": "design",
        "fields": 30,
        "coperniq_type": "Form",
        "description": "Document control sequences"
    },
    "bas_trend_analysis": {
        "name": "Trend Data Analysis",
        "trade": "controls",
        "phase": "maintenance",
        "fields": 20,
        "coperniq_type": "Form",
        "description": "Analyze historical trends for issues"
    },
    "bas_energy_optimization": {
        "name": "Energy Optimization Report",
        "trade": "controls",
        "phase": "maintenance",
        "fields": 25,
        "coperniq_type": "Form",
        "description": "Identify energy savings opportunities"
    },
    "thermostat_programming": {
        "name": "Thermostat Programming",
        "trade": "controls",
        "phase": "service",
        "fields": 12,
        "coperniq_type": "Form",
        "description": "Smart thermostat setup and optimization"
    },

    # TUD Market Templates (8)
    "tenant_energy_audit": {
        "name": "Tenant Energy Audit",
        "trade": "solar",
        "phase": "sales",
        "fields": 20,
        "coperniq_type": "Form",
        "tud_segment": "tenants",
        "description": "Assess tenant energy usage and savings opportunities"
    },
    "comfort_survey": {
        "name": "Tenant Comfort Survey",
        "trade": "hvac",
        "phase": "service",
        "fields": 15,
        "coperniq_type": "Form",
        "tud_segment": "tenants",
        "description": "Gather tenant comfort feedback"
    },
    "solar_co_invest_agreement": {
        "name": "Solar Co-Investment Agreement",
        "trade": "solar",
        "phase": "sales",
        "fields": 18,
        "coperniq_type": "Form",
        "tud_segment": "tenants",
        "description": "Tenant participation in rooftop solar"
    },
    "facility_inspection": {
        "name": "Facility Condition Assessment",
        "trade": "hvac",
        "phase": "service",
        "fields": 50,
        "coperniq_type": "Form",
        "tud_segment": "users",
        "description": "Full facility MEP condition assessment"
    },
    "equipment_inventory": {
        "name": "Equipment Inventory",
        "trade": "hvac",
        "phase": "service",
        "fields": 30,
        "coperniq_type": "Form",
        "tud_segment": "users",
        "description": "Complete MEP equipment inventory"
    },
    "solar_feasibility": {
        "name": "Solar Feasibility Study",
        "trade": "solar",
        "phase": "sales",
        "fields": 35,
        "coperniq_type": "Form",
        "tud_segment": "developers_owners",
        "description": "Comprehensive solar feasibility for investors"
    },
    "esg_assessment": {
        "name": "ESG Assessment",
        "trade": "solar",
        "phase": "sales",
        "fields": 40,
        "coperniq_type": "Form",
        "tud_segment": "developers_owners",
        "description": "Environmental, Social, Governance assessment"
    },
    "green_certification_tracker": {
        "name": "Green Certification Tracker",
        "trade": "controls",
        "phase": "commission",
        "fields": 30,
        "coperniq_type": "Form",
        "tud_segment": "developers_owners",
        "description": "LEED, Energy Star, WELL certification tracking"
    },

    # Service Agreements (4)
    "service_agreement_bronze": {
        "name": "Bronze Service Agreement",
        "trade": "hvac",
        "phase": "sales",
        "fields": 15,
        "coperniq_type": "ServicePlanInstance",
        "description": "Basic: 1 PM visit/year, 10% parts discount"
    },
    "service_agreement_silver": {
        "name": "Silver Service Agreement",
        "trade": "hvac",
        "phase": "sales",
        "fields": 18,
        "coperniq_type": "ServicePlanInstance",
        "description": "Standard: 2 PM visits/year, priority scheduling, 15% discount"
    },
    "service_agreement_gold": {
        "name": "Gold Service Agreement",
        "trade": "hvac",
        "phase": "sales",
        "fields": 22,
        "coperniq_type": "ServicePlanInstance",
        "description": "Premium: 4 PM visits/year, 24/7 priority, 20% discount, no overtime"
    },
    "service_agreement_commercial": {
        "name": "Commercial Service Agreement",
        "trade": "hvac",
        "phase": "sales",
        "fields": 30,
        "coperniq_type": "ServicePlanInstance",
        "description": "Custom commercial/industrial PM program"
    }
}

# =============================================================================
# PYDANTIC MODELS
# =============================================================================

class ContractorSetupRequest(BaseModel):
    """Request to configure a new contractor"""
    company_name: str = Field(..., description="Contractor company name")
    company_type: str = Field(..., description="One of: self_perform_mep, solar_epc, om_provider, multi_trade_full")
    trades: List[str] = Field(default=[], description="List of trades: hvac, plumbing, electrical, solar, fire_protection, controls")
    services: List[str] = Field(default=[], description="List of services: installation, service, maintenance, monitoring, emergency_service")
    market_segments: List[str] = Field(default=[], description="List of markets: residential, commercial, industrial, multifamily")
    tud_focus: List[str] = Field(default=[], description="TUD segments: tenants, users, developers_owners")

class QueryRequest(BaseModel):
    """Request to run an agent query"""
    query: str = Field(..., description="Natural language query")
    agent: Optional[str] = Field(None, description="Specific agent to use")

class TemplateToggle(BaseModel):
    """Toggle templates on/off"""
    templates: Dict[str, bool] = Field(..., description="Template ID -> enabled/disabled")

# =============================================================================
# API ENDPOINTS
# =============================================================================

@app.on_event("startup")
async def startup():
    """Initialize E2B runtime on startup"""
    global runtime
    try:
        runtime = E2BSandboxRuntime()
        print("✅ E2B Runtime initialized")
    except Exception as e:
        print(f"⚠️ E2B Runtime not available: {e}")
        runtime = None

@app.get("/", response_class=HTMLResponse)
async def home():
    """Home page with interactive demo"""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Coperniq MEP + Clean Energy Platform</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                color: #fff;
                min-height: 100vh;
                padding: 20px;
            }
            .container { max-width: 1400px; margin: 0 auto; }
            h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
                background: linear-gradient(90deg, #00d4ff, #00ff88);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .subtitle { color: #888; margin-bottom: 30px; }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
            .card {
                background: rgba(255,255,255,0.05);
                border-radius: 12px;
                padding: 20px;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .card h2 {
                font-size: 1.2rem;
                margin-bottom: 15px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .card h2 span { font-size: 1.5rem; }
            .trade-list { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; }
            .trade-tag {
                background: rgba(0,212,255,0.2);
                border: 1px solid rgba(0,212,255,0.3);
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .trade-tag:hover { background: rgba(0,212,255,0.4); }
            .trade-tag.active { background: #00d4ff; color: #000; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 20px; }
            .stat {
                text-align: center;
                padding: 15px;
                background: rgba(0,255,136,0.1);
                border-radius: 8px;
            }
            .stat-value { font-size: 2rem; font-weight: bold; color: #00ff88; }
            .stat-label { font-size: 0.8rem; color: #888; margin-top: 5px; }
            .template-grid {
                max-height: 300px;
                overflow-y: auto;
                margin-top: 15px;
            }
            .template-item {
                display: flex;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                cursor: pointer;
            }
            .template-item:hover { background: rgba(255,255,255,0.05); }
            .template-toggle {
                width: 40px;
                height: 22px;
                background: #333;
                border-radius: 11px;
                position: relative;
                margin-right: 12px;
                cursor: pointer;
            }
            .template-toggle.on { background: #00ff88; }
            .template-toggle::after {
                content: '';
                position: absolute;
                width: 18px;
                height: 18px;
                background: #fff;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: 0.2s;
            }
            .template-toggle.on::after { left: 20px; }
            .template-info { flex: 1; }
            .template-name { font-weight: 500; }
            .template-desc { font-size: 0.8rem; color: #888; }
            .query-box {
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
            }
            .query-input {
                width: 100%;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                padding: 12px;
                color: #fff;
                font-size: 1rem;
            }
            .query-input:focus { outline: none; border-color: #00d4ff; }
            .btn {
                background: linear-gradient(90deg, #00d4ff, #00ff88);
                color: #000;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                margin-top: 10px;
                transition: transform 0.2s;
            }
            .btn:hover { transform: scale(1.02); }
            .response-box {
                background: rgba(0,0,0,0.3);
                border-radius: 8px;
                padding: 15px;
                margin-top: 15px;
                font-family: monospace;
                white-space: pre-wrap;
                max-height: 200px;
                overflow-y: auto;
            }
            .tud-card {
                background: linear-gradient(135deg, rgba(0,212,255,0.1), rgba(0,255,136,0.1));
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏗️ Coperniq MEP + Clean Energy Platform</h1>
            <p class="subtitle">TUD Market (Tenants, Users, Developers/Owners) + Clean Energy Integration</p>

            <div class="stats">
                <div class="stat">
                    <div class="stat-value">54</div>
                    <div class="stat-label">Templates Available</div>
                </div>
                <div class="stat">
                    <div class="stat-value">6</div>
                    <div class="stat-label">Trades Supported</div>
                </div>
                <div class="stat">
                    <div class="stat-value">5</div>
                    <div class="stat-label">Service Types</div>
                </div>
            </div>

            <div class="grid" style="margin-top: 30px;">
                <div class="card">
                    <h2><span>🔧</span> Contractor Configuration</h2>
                    <p style="color: #888; margin-bottom: 15px;">Select your trades and services:</p>

                    <h3 style="font-size: 0.9rem; color: #00d4ff; margin-bottom: 10px;">TRADES</h3>
                    <div class="trade-list" id="trades">
                        <div class="trade-tag active" data-trade="hvac">❄️ HVAC</div>
                        <div class="trade-tag active" data-trade="plumbing">🔧 Plumbing</div>
                        <div class="trade-tag active" data-trade="electrical">⚡ Electrical</div>
                        <div class="trade-tag active" data-trade="solar">☀️ Solar</div>
                        <div class="trade-tag" data-trade="fire_protection">🔥 Fire Protection</div>
                        <div class="trade-tag" data-trade="controls">🎛️ Controls</div>
                    </div>

                    <h3 style="font-size: 0.9rem; color: #00d4ff; margin: 15px 0 10px;">SERVICES</h3>
                    <div class="trade-list" id="services">
                        <div class="trade-tag active" data-service="installation">New Installation</div>
                        <div class="trade-tag active" data-service="service">Service/Repair</div>
                        <div class="trade-tag active" data-service="maintenance">PM</div>
                        <div class="trade-tag" data-service="monitoring">Monitoring</div>
                        <div class="trade-tag" data-service="emergency_service">24/7 Emergency</div>
                    </div>

                    <h3 style="font-size: 0.9rem; color: #00d4ff; margin: 15px 0 10px;">MARKET SEGMENTS</h3>
                    <div class="trade-list" id="markets">
                        <div class="trade-tag active" data-market="residential">🏠 Residential</div>
                        <div class="trade-tag active" data-market="commercial">🏢 Commercial</div>
                        <div class="trade-tag" data-market="industrial">🏭 Industrial</div>
                        <div class="trade-tag" data-market="multifamily">🏘️ Multifamily</div>
                    </div>

                    <button class="btn" onclick="generateConfig()">Generate Config →</button>
                </div>

                <div class="card tud-card">
                    <h2><span>🌍</span> TUD Market Focus</h2>
                    <p style="color: #888; margin-bottom: 15px;">The blue ocean opportunity:</p>

                    <div class="trade-list">
                        <div class="trade-tag active" data-tud="tenants">👥 Tenants</div>
                        <div class="trade-tag active" data-tud="users">🏢 Users</div>
                        <div class="trade-tag active" data-tud="developers_owners">💼 Developers/Owners</div>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.2); border-radius: 8px;">
                        <h4 style="color: #00ff88;">Why TUD + Clean Energy?</h4>
                        <ul style="color: #888; font-size: 0.9rem; margin-top: 10px; padding-left: 20px;">
                            <li>64% of homeowners interested in renewables</li>
                            <li>Commercial buildings = untapped solar opportunity</li>
                            <li>ESG factors driving investment decisions</li>
                            <li>Tenants willing to co-invest in rooftop solar</li>
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <h2><span>📋</span> Template Catalog</h2>
                    <p style="color: #888; margin-bottom: 10px;">Toggle templates on/off:</p>

                    <div class="template-grid" id="templateList">
                        <!-- Templates will be populated by JS -->
                    </div>
                </div>

                <div class="card">
                    <h2><span>🤖</span> AI Agent Query</h2>
                    <p style="color: #888; margin-bottom: 10px;">Ask anything about your MEP operations:</p>

                    <div class="query-box">
                        <input type="text" class="query-input" id="queryInput"
                               placeholder="e.g., What's my margin by trade?"
                               onkeypress="if(event.key==='Enter')runQuery()">
                        <button class="btn" onclick="runQuery()">Run Query →</button>
                    </div>

                    <div class="response-box" id="responseBox">
                        Response will appear here...
                    </div>
                </div>
            </div>

            <div style="text-align: center; margin-top: 40px; color: #666;">
                <p>Powered by E2B Cloud Sandbox • Coperniq GraphQL • Claude AI</p>
                <p style="margin-top: 10px;">
                    <a href="/docs" style="color: #00d4ff;">API Docs</a> •
                    <a href="/api/templates" style="color: #00d4ff;">Template Catalog</a> •
                    <a href="/api/config" style="color: #00d4ff;">Full Config</a>
                </p>
            </div>
        </div>

        <script>
            // Toggle trade/service selection
            document.querySelectorAll('.trade-tag').forEach(tag => {
                tag.onclick = () => tag.classList.toggle('active');
            });

            // Populate template list
            const templates = """ + json.dumps(TEMPLATE_CATALOG) + """;
            const templateList = document.getElementById('templateList');
            Object.entries(templates).forEach(([id, t]) => {
                templateList.innerHTML += `
                    <div class="template-item">
                        <div class="template-toggle on" onclick="this.classList.toggle('on')"></div>
                        <div class="template-info">
                            <div class="template-name">${t.name}</div>
                            <div class="template-desc">${t.trade} • ${t.fields} fields</div>
                        </div>
                    </div>
                `;
            });

            // Generate config
            async function generateConfig() {
                const trades = [...document.querySelectorAll('#trades .trade-tag.active')].map(t => t.dataset.trade);
                const services = [...document.querySelectorAll('#services .trade-tag.active')].map(t => t.dataset.service);
                const markets = [...document.querySelectorAll('#markets .trade-tag.active')].map(t => t.dataset.market);

                const config = { trades, services, market_segments: markets };
                alert('Config generated!\\n\\n' + JSON.stringify(config, null, 2));
            }

            // Run AI query
            async function runQuery() {
                const query = document.getElementById('queryInput').value;
                const responseBox = document.getElementById('responseBox');
                responseBox.textContent = '⏳ Processing...';

                try {
                    const res = await fetch('/api/sandbox/demo-user/query', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({query})
                    });
                    const data = await res.json();
                    responseBox.textContent = `Agent: ${data.agent_used}\\nTime: ${data.execution_time_ms}ms\\n\\n${data.response}`;
                } catch (e) {
                    responseBox.textContent = 'Error: ' + e.message;
                }
            }
        </script>
    </body>
    </html>
    """

@app.get("/api/config")
async def get_full_config():
    """Get the full contractor configuration options"""
    return {
        "company_types": CONTRACTOR_CONFIG["company_types"],
        "trades": CONTRACTOR_CONFIG["trades"],
        "services": CONTRACTOR_CONFIG["services"],
        "market_segments": CONTRACTOR_CONFIG["market_segments"],
        "tud_market": TUD_MARKET_SEGMENTS
    }

@app.get("/api/templates")
async def get_templates(
    trade: Optional[str] = Query(None, description="Filter by trade"),
    phase: Optional[str] = Query(None, description="Filter by phase"),
    tud_segment: Optional[str] = Query(None, description="Filter by TUD segment")
):
    """Get all templates with optional filtering"""
    templates = TEMPLATE_CATALOG.copy()

    if trade:
        templates = {k: v for k, v in templates.items() if v.get("trade") == trade}
    if phase:
        templates = {k: v for k, v in templates.items() if v.get("phase") == phase}
    if tud_segment:
        templates = {k: v for k, v in templates.items() if v.get("tud_segment") == tud_segment}

    return {
        "count": len(templates),
        "templates": templates
    }

@app.post("/api/contractor/setup")
async def setup_contractor(request: ContractorSetupRequest):
    """Configure a new contractor with trades, services, and templates"""

    # Get company type defaults
    company_config = CONTRACTOR_CONFIG["company_types"].get(request.company_type, {})

    # Merge with explicit selections
    trades = request.trades or company_config.get("default_trades", [])
    services = request.services or company_config.get("default_services", [])

    # Build template list based on selections
    selected_templates = {}
    for template_id, template in TEMPLATE_CATALOG.items():
        if template.get("trade") in trades:
            selected_templates[template_id] = {
                **template,
                "enabled": True
            }

    # Count by category
    by_trade = {}
    for t in selected_templates.values():
        trade = t.get("trade", "other")
        by_trade[trade] = by_trade.get(trade, 0) + 1

    return {
        "company_name": request.company_name,
        "company_type": request.company_type,
        "configuration": {
            "trades": trades,
            "services": services,
            "market_segments": request.market_segments,
            "tud_focus": request.tud_focus
        },
        "templates": {
            "total": len(selected_templates),
            "by_trade": by_trade,
            "list": selected_templates
        },
        "next_steps": [
            "1. Review and toggle templates",
            "2. Upload CSV data (contacts, sites, assets)",
            "3. Start querying with AI agents"
        ]
    }

@app.post("/api/sandbox/{user_id}/create")
async def create_sandbox(user_id: str, vertical: str = "multi_trade"):
    """Create a new E2B sandbox for a user"""
    if not runtime:
        raise HTTPException(500, "E2B runtime not available")

    sandbox = runtime.create_sandbox(user_id, vertical)
    runtime.provision_schema(sandbox)

    return {
        "sandbox_id": sandbox.sandbox_id,
        "user_id": sandbox.user_id,
        "vertical": sandbox.vertical,
        "status": sandbox.status.value,
        "days_remaining": sandbox.days_remaining(),
        "expires_at": sandbox.expires_at.isoformat()
    }

@app.post("/api/sandbox/{user_id}/query")
async def query_sandbox(user_id: str, request: QueryRequest):
    """Run an agent query in the user's sandbox"""
    if not runtime:
        raise HTTPException(500, "E2B runtime not available")

    # Get or create sandbox
    sandbox = runtime.get_user_sandbox(user_id)
    if not sandbox:
        sandbox = runtime.create_sandbox(user_id, "multi_trade")
        runtime.provision_schema(sandbox)

    response = runtime.run_agent_query(sandbox, request.query, request.agent)

    return {
        "query": response.query,
        "response": response.response,
        "agent_used": response.agent_used,
        "execution_time_ms": response.execution_time_ms,
        "success": response.success,
        "error": response.error
    }

@app.get("/api/sandbox/{user_id}/stats")
async def get_sandbox_stats(user_id: str):
    """Get sandbox statistics for a user"""
    if not runtime:
        raise HTTPException(500, "E2B runtime not available")

    sandbox = runtime.get_user_sandbox(user_id)
    if not sandbox:
        raise HTTPException(404, f"No sandbox found for user: {user_id}")

    return {
        "sandbox_id": sandbox.sandbox_id,
        "status": sandbox.status.value,
        "query_count": sandbox.query_count,
        "days_remaining": sandbox.days_remaining(),
        "csv_imports": sandbox.csv_imports,
        "last_query": sandbox.last_query_at.isoformat() if sandbox.last_query_at else None
    }

@app.delete("/api/sandbox/{user_id}")
async def delete_sandbox(user_id: str):
    """Delete a user's sandbox"""
    if not runtime:
        raise HTTPException(500, "E2B runtime not available")

    sandbox = runtime.get_user_sandbox(user_id)
    if not sandbox:
        raise HTTPException(404, f"No sandbox found for user: {user_id}")

    result = runtime.delete_sandbox(sandbox)
    return result

@app.get("/api/tud-market")
async def get_tud_market():
    """Get TUD market segment information"""
    return {
        "segments": TUD_MARKET_SEGMENTS,
        "opportunity": {
            "homeowner_interest": "64% interested in renewables",
            "commercial_solar": "Major untapped opportunity",
            "esg_investment": "Increasingly driving decisions",
            "tenant_coinvest": "Innovative business models emerging"
        },
        "templates": {
            segment: [t for t_id, t in TEMPLATE_CATALOG.items() if t.get("tud_segment") == segment]
            for segment in TUD_MARKET_SEGMENTS.keys()
        }
    }

# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
