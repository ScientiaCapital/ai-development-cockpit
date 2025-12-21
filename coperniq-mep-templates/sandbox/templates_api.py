"""
MEP Templates API - FastAPI Server

Production-ready RESTful API for MEP template discovery and management.
Exposes template catalog loaded from YAML files with filtering and statistics.

Run: uvicorn sandbox.templates_api:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from sandbox.template_loader import (
    TemplateLoader,
    TemplateSpec,
    TradesResponse,
    TemplateListResponse,
    get_loader,
)

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ============================================================================
# FASTAPI APPLICATION
# ============================================================================

app = FastAPI(
    title="MEP Templates API",
    description="""
## MEP Template Catalog

Production-ready API for discovering, filtering, and retrieving MEP templates.

### Features
- Browse 60+ YAML templates across 12 trades (HVAC, Solar, Plumbing, Electrical, etc.)
- Filter by trade, phase, or search
- Get detailed template specifications with field definitions
- View trade statistics and template breakdown
- Full OpenAPI documentation with examples

### Trades
- **HVAC**: Lead intake, site survey, equipment proposals, commissioning, service
- **Solar**: Site assessment, proposals, commercial audits
- **Plumbing**: Service calls, inspections, installations, backflow testing
- **Electrical**: Panel inspection, circuit analysis, EV charger installation
- **Fire Protection**: Sprinkler inspection, fire extinguisher, alarm management
- **Service Plans**: Bronze/Silver/Gold HVAC plans, plumbing protection
- **TUD Market**: Heat pump, weatherization, EV chargers, energy audits
- **Controls**: Point verification, alarm management, energy dashboards
- **General**: Daily reports, roofing, low voltage systems

### Authentication
No authentication required for discovery endpoints. Sandbox execution requires API key.

### Rate Limiting
No rate limiting on discovery endpoints. Sandbox endpoints limited to 100 requests/hour per user.
""",
    version="1.0.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

# ============================================================================
# CORS MIDDLEWARE
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for discovery API
    allow_credentials=False,
    allow_methods=["GET", "HEAD", "OPTIONS"],
    allow_headers=["*"],
    max_age=86400,  # 24 hours
)

# ============================================================================
# RESPONSE MODELS
# ============================================================================


class TemplateFieldResponse(BaseModel):
    """Single field in a template"""

    name: str
    type: str
    required: bool = False
    options: Optional[List[str]] = None


class TemplateGroupResponse(BaseModel):
    """Group of fields in a template"""

    name: str
    order: int
    fields: List[TemplateFieldResponse]


class TemplateListItemResponse(BaseModel):
    """Minimal template information for list responses"""

    trade: str
    name: str
    file: str
    emoji: Optional[str] = None
    description: str
    phase: Optional[str] = None
    fields_count: int
    groups_count: int


class TemplateDetailResponse(BaseModel):
    """Complete template details"""

    trade: str
    name: str
    file: str
    emoji: Optional[str] = None
    description: str
    phase: Optional[str] = None
    category: str
    work_order_type: Optional[str] = None
    fields_count: int
    groups_count: int
    groups: List[TemplateGroupResponse]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TemplatesListResponse(BaseModel):
    """Response for listing templates"""

    total: int
    templates: List[TemplateListItemResponse]


class TemplatesByTradeResponse(BaseModel):
    """Response for trade-filtered templates"""

    trade: str
    total: int
    templates: List[TemplateListItemResponse]


class TradeStatsResponse(BaseModel):
    """Statistics for a single trade"""

    trade: str
    count: int
    phases: Dict[str, int]


class AllTradesResponse(BaseModel):
    """Response for all trades with statistics"""

    total_templates: int
    trades: List[TradeStatsResponse]


class HealthResponse(BaseModel):
    """Health check response"""

    status: str
    timestamp: str
    templates_loaded: int
    trades_available: int


class APIErrorResponse(BaseModel):
    """Error response"""

    error: str
    code: int
    timestamp: str


# ============================================================================
# INITIALIZATION
# ============================================================================

# Initialize template loader at module level
try:
    template_loader = get_loader()
    stats = template_loader.get_stats()
    logger.info(
        f"Loaded {stats['total_templates']} templates from {stats['total_trades']} trades"
    )
except Exception as e:
    logger.error(f"Failed to load templates: {e}")
    template_loader = None


@app.on_event("startup")
async def startup():
    """Reinitialize template loader on startup if needed"""
    global template_loader
    if template_loader is None:
        try:
            template_loader = get_loader()
            stats = template_loader.get_stats()
            logger.info(
                f"Loaded {stats['total_templates']} templates from {stats['total_trades']} trades"
            )
        except Exception as e:
            logger.error(f"Failed to load templates: {e}")
            raise


# ============================================================================
# ENDPOINT IMPLEMENTATIONS
# ============================================================================


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="Health check",
    responses={
        200: {
            "description": "API is healthy and templates are loaded",
            "example": {
                "status": "healthy",
                "timestamp": "2025-12-20T12:34:56Z",
                "templates_loaded": 60,
                "trades_available": 12,
            },
        }
    },
)
async def health_check() -> HealthResponse:
    """Check API health and template catalog status."""
    if not template_loader:
        raise HTTPException(status_code=503, detail="Template loader not initialized")

    stats = template_loader.get_stats()
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat() + "Z",
        templates_loaded=stats["total_templates"],
        trades_available=stats["total_trades"],
    )


@app.get(
    "/templates",
    response_model=TemplatesListResponse,
    tags=["Templates"],
    summary="List all templates",
    responses={
        200: {
            "description": "All templates with optional filtering",
            "example": {
                "total": 60,
                "templates": [
                    {
                        "trade": "hvac",
                        "name": "HVAC Lead Intake Form",
                        "file": "lead_intake.yaml",
                        "emoji": "❄️",
                        "description": "Sales lead capture form",
                        "phase": "sales",
                        "fields_count": 23,
                        "groups_count": 5,
                    }
                ],
            },
        }
    },
)
async def list_templates(
    trade: Optional[str] = Query(
        None, description="Filter by trade (e.g., hvac, solar, plumbing)"
    ),
    phase: Optional[str] = Query(
        None, description="Filter by phase (e.g., sales, install, service)"
    ),
) -> TemplatesListResponse:
    """
    List all templates with optional filtering.

    Query Parameters:
    - **trade**: Filter by trade name (optional)
    - **phase**: Filter by phase (optional)

    Returns a list of templates with basic information for each.
    """
    if not template_loader:
        raise HTTPException(status_code=503, detail="Template loader not initialized")

    templates = template_loader.filter_templates(trade=trade, phase=phase)

    items = [
        TemplateListItemResponse(
            trade=t.trade,
            name=t.name,
            file=t.file,
            emoji=t.emoji,
            description=t.description,
            phase=t.phase,
            fields_count=t.fields_count,
            groups_count=t.groups_count,
        )
        for t in templates
    ]

    return TemplatesListResponse(total=len(items), templates=items)


@app.get(
    "/templates/{trade}",
    response_model=TemplatesByTradeResponse,
    tags=["Templates"],
    summary="List templates by trade",
    responses={
        200: {
            "description": "All templates for a specific trade",
        },
        404: {
            "description": "Trade not found",
            "example": {"error": "Trade 'hvac' not found", "code": 404},
        },
    },
)
async def get_templates_by_trade(
    trade: str = "hvac",
) -> TemplatesByTradeResponse:
    """
    Get all templates for a specific trade.

    Path Parameters:
    - **trade**: Trade name (e.g., hvac, solar, plumbing, electrical)

    Returns all templates available for the requested trade.
    """
    if not template_loader:
        raise HTTPException(status_code=503, detail="Template loader not initialized")

    templates = template_loader.get_templates_by_trade(trade)

    if not templates:
        raise HTTPException(
            status_code=404,
            detail=f"Trade '{trade}' not found. Available trades: {', '.join(sorted(template_loader.get_trades().keys()))}",
        )

    items = [
        TemplateListItemResponse(
            trade=t.trade,
            name=t.name,
            file=t.file,
            emoji=t.emoji,
            description=t.description,
            phase=t.phase,
            fields_count=t.fields_count,
            groups_count=t.groups_count,
        )
        for t in templates
    ]

    return TemplatesByTradeResponse(trade=trade, total=len(items), templates=items)


@app.get(
    "/templates/{trade}/{template_name}",
    response_model=TemplateDetailResponse,
    tags=["Templates"],
    summary="Get template details",
    responses={
        200: {
            "description": "Complete template specification with all fields",
        },
        404: {
            "description": "Template not found",
        },
    },
)
async def get_template_details(
    trade: str,
    template_name: str,
) -> TemplateDetailResponse:
    """
    Get complete details for a specific template.

    Path Parameters:
    - **trade**: Trade name (e.g., hvac, solar, plumbing)
    - **template_name**: Template name without extension (e.g., lead_intake)

    Returns the full template specification including all field definitions and groups.
    """
    if not template_loader:
        raise HTTPException(status_code=503, detail="Template loader not initialized")

    template = template_loader.get_template_by_trade_and_name(trade, template_name)

    if not template:
        raise HTTPException(
            status_code=404,
            detail=f"Template '{template_name}' not found in trade '{trade}'",
        )

    groups = [
        TemplateGroupResponse(
            name=g.name,
            order=g.order,
            fields=[
                TemplateFieldResponse(
                    name=f.name,
                    type=f.type,
                    required=f.required,
                    options=f.options,
                )
                for f in g.fields
            ],
        )
        for g in template.groups
    ]

    return TemplateDetailResponse(
        trade=template.trade,
        name=template.name,
        file=template.file,
        emoji=template.emoji,
        description=template.description,
        phase=template.phase,
        category=template.category,
        work_order_type=template.work_order_type,
        fields_count=template.fields_count,
        groups_count=template.groups_count,
        groups=groups,
        metadata=template.metadata,
    )


@app.get(
    "/trades",
    response_model=AllTradesResponse,
    tags=["Trades"],
    summary="List all available trades",
    responses={
        200: {
            "description": "All available trades with template counts and phase breakdown",
            "example": {
                "total_templates": 60,
                "trades": [
                    {
                        "trade": "hvac",
                        "count": 10,
                        "phases": {"sales": 3, "install": 2, "service": 5},
                    },
                    {
                        "trade": "solar",
                        "count": 10,
                        "phases": {"sales": 2, "install": 3},
                    },
                ],
            },
        }
    },
)
async def get_all_trades() -> AllTradesResponse:
    """
    Get all available trades with statistics.

    Returns a list of all trades available in the template catalog,
    including template counts and breakdown by phase.
    """
    if not template_loader:
        raise HTTPException(status_code=503, detail="Template loader not initialized")

    response = template_loader.get_trades_with_stats()

    return AllTradesResponse(
        total_templates=response.total_templates,
        trades=[
            TradeStatsResponse(
                trade=t.trade,
                count=t.count,
                phases=t.phases,
            )
            for t in response.trades
        ],
    )


@app.post(
    "/templates/seed",
    tags=["Admin"],
    summary="Trigger template seeding (placeholder)",
    responses={
        200: {
            "description": "Seeding initiated",
            "example": {
                "status": "seeding_initiated",
                "message": "Coperniq template seeding initiated",
                "timestamp": "2025-12-20T12:34:56Z",
            },
        }
    },
)
async def seed_coperniq_templates() -> Dict[str, Any]:
    """
    Trigger seeding of templates to Coperniq.

    This endpoint is a placeholder for future integration with Coperniq's
    template import/seeding functionality.

    Returns:
        Dictionary with seeding status
    """
    if not template_loader:
        raise HTTPException(status_code=503, detail="Template loader not initialized")

    stats = template_loader.get_stats()

    return {
        "status": "seeding_initiated",
        "message": f"Template seeding initiated for {stats['total_templates']} templates",
        "templates_count": stats["total_templates"],
        "trades_count": stats["total_trades"],
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "note": "Actual Coperniq API integration coming soon",
    }


# ============================================================================
# ERROR HANDLING
# ============================================================================


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "code": exc.status_code,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Catch-all exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "code": 500,
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
    )
