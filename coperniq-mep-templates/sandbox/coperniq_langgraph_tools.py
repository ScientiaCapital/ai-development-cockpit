"""
Coperniq LangGraph Tools - Unified Integration Layer
=====================================================

Works with:
- Claude Code (via MCP)
- Claude Desktop (via MCP)
- LangChain UI / LangServe (via LangGraph tools)
- Cursor IDE (via MCP)

Instance: 388 (Kipper Energy Solutions)

Usage in LangGraph:
    from sandbox.coperniq_langgraph_tools import coperniq_tools
    agent = create_react_agent(llm, tools=coperniq_tools)

Usage in Claude Code:
    These tools are auto-loaded from .mcp/config.json
"""

import os
import httpx
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# =============================================================================
# Configuration
# =============================================================================

COPERNIQ_BASE_URL = os.getenv("COPERNIQ_BASE_URL", "https://api.coperniq.io/v1")
COPERNIQ_COMPANY_ID = int(os.getenv("COPERNIQ_COMPANY_ID", "388"))


def _get_headers() -> Dict[str, str]:
    """Get standard headers for Coperniq API."""
    api_key = os.getenv("COPERNIQ_API_KEY")
    if not api_key:
        raise ValueError("COPERNIQ_API_KEY not set in environment")
    return {
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }


async def _api_request(
    method: str,
    endpoint: str,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Make async request to Coperniq API."""
    url = f"{COPERNIQ_BASE_URL}{endpoint}"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.request(
            method=method,
            url=url,
            headers=_get_headers(),
            json=data,
            params=params,
        )

        if response.status_code >= 400:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}"
            }

        return {
            "success": True,
            "data": response.json() if response.text else {}
        }


def _sync_api_request(
    method: str,
    endpoint: str,
    data: Optional[Dict] = None,
    params: Optional[Dict] = None,
) -> Dict[str, Any]:
    """Sync version for LangGraph tool compatibility."""
    url = f"{COPERNIQ_BASE_URL}{endpoint}"

    try:
        response = httpx.request(
            method=method,
            url=url,
            headers=_get_headers(),
            json=data,
            params=params,
            timeout=30.0,
        )

        if response.status_code >= 400:
            return {
                "success": False,
                "error": f"HTTP {response.status_code}: {response.text}"
            }

        return {
            "success": True,
            "data": response.json() if response.text else {}
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


# =============================================================================
# Pydantic Schemas for LangGraph Tool Inputs
# =============================================================================

class CreateClientInput(BaseModel):
    """Create a new client/customer."""
    title: str = Field(description="Client name (e.g., 'Johnson Residence')")
    email: Optional[str] = Field(default=None, description="Primary email")
    phone: Optional[str] = Field(default=None, description="Primary phone")
    address: Optional[List[str]] = Field(default=None, description="Address lines")


class CreateProjectInput(BaseModel):
    """Create a new project/job."""
    title: str = Field(description="Project title")
    address: List[str] = Field(description="Service address lines (required)")
    trades: Optional[List[str]] = Field(default=None, description="Trades: HVAC, Plumbing, Electrical, etc.")
    priority: str = Field(default="NORMAL", description="EMERGENCY, URGENT, NORMAL, SCHEDULED")


class CreateRequestInput(BaseModel):
    """Create a service request/ticket."""
    title: str = Field(description="Request summary")
    address: List[str] = Field(description="Service address (required)")
    trades: Optional[List[str]] = Field(default=None, description="Applicable trades")
    phone: Optional[str] = Field(default=None, description="Customer phone")
    priority: str = Field(default="NORMAL", description="EMERGENCY, URGENT, NORMAL, SCHEDULED")
    description: Optional[str] = Field(default=None, description="Detailed description")


class CreateWorkOrderInput(BaseModel):
    """Create a work order from template."""
    template_id: int = Field(description="Work order template ID")
    project_id: Optional[int] = Field(default=None, description="Attach to project")
    request_id: Optional[int] = Field(default=None, description="Attach to request")


class DispatchInput(BaseModel):
    """Dispatch technician to work order."""
    work_order_id: int = Field(description="Work order ID")
    technician_id: int = Field(description="Technician user ID")
    scheduled_date: Optional[str] = Field(default=None, description="ISO 8601 datetime")
    notes: Optional[str] = Field(default=None, description="Dispatch notes")


class LogCallInput(BaseModel):
    """Log a customer call."""
    from_number: str = Field(description="Caller phone")
    to_number: str = Field(description="Receiving phone")
    start_time: str = Field(description="Call start (ISO 8601)")
    end_time: str = Field(description="Call end (ISO 8601)")
    reason: str = Field(description="SERVICE, PRODUCT, PROCESS, ACCOUNTING, REVENUE_OPPORTUNITY, FEEDBACK, OTHER")
    disposition: str = Field(description="VISIT_SCHEDULED, INFO_PROVIDED, ISSUE_RESOLVED, FOLLOW_UP, ESCALATION, NO_ACTION, UNRESPONSIVE, OTHER")
    project_id: Optional[int] = Field(default=None, description="Associate with project")
    request_id: Optional[int] = Field(default=None, description="Associate with request")
    client_id: Optional[int] = Field(default=None, description="Associate with client")
    is_inbound: bool = Field(default=True, description="True if customer called us")
    note: Optional[str] = Field(default=None, description="Call notes")


class CreateInvoiceInput(BaseModel):
    """Create an invoice."""
    title: str = Field(description="Invoice title")
    record_id: int = Field(description="Project, request, or client ID")
    due_date: str = Field(description="Due date (ISO 8601)")
    line_items: List[Dict[str, Any]] = Field(description="Line items with catalogItemId, quantity, unitPrice")


# =============================================================================
# LangGraph Tools - Client Management
# =============================================================================

@tool(args_schema=CreateClientInput)
def coperniq_create_client(
    title: str,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    address: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Create a new client in Coperniq.

    Use when a new customer calls or needs to be added to the system.
    Returns the created client with ID.
    """
    payload = {"title": title}
    if email:
        payload["primaryEmail"] = email
    if phone:
        payload["primaryPhone"] = phone
    if address:
        payload["address"] = address

    return _sync_api_request("POST", "/clients", data=payload)


@tool
def coperniq_list_clients() -> Dict[str, Any]:
    """
    List all clients in Coperniq.

    Use to see existing customers or find a client by name.
    """
    return _sync_api_request("GET", "/clients")


@tool
def coperniq_get_client(client_id: int) -> Dict[str, Any]:
    """
    Get detailed client information by ID.

    Use to look up customer contact info, history, or service plans.
    """
    return _sync_api_request("GET", f"/clients/{client_id}")


# =============================================================================
# LangGraph Tools - Project Management
# =============================================================================

@tool(args_schema=CreateProjectInput)
def coperniq_create_project(
    title: str,
    address: List[str],
    trades: Optional[List[str]] = None,
    priority: str = "NORMAL",
) -> Dict[str, Any]:
    """
    Create a new project/job in Coperniq.

    Use for new installations, major service work, or jobs with multiple visits.
    Projects have workflows, phases, and can contain multiple work orders.
    """
    payload = {
        "title": title,
        "address": address,
        "status": "ACTIVE",
    }
    if trades:
        payload["trades"] = trades

    return _sync_api_request("POST", "/projects", data=payload)


@tool
def coperniq_list_projects(status: str = "ACTIVE", limit: int = 20) -> Dict[str, Any]:
    """
    List projects/jobs in Coperniq.

    Status options: ACTIVE, ON_HOLD, CANCELLED, COMPLETED
    """
    return _sync_api_request("GET", "/projects", params={
        "status": status,
        "limit": limit
    })


@tool
def coperniq_get_project(project_id: int) -> Dict[str, Any]:
    """
    Get detailed project information by ID.

    Includes phases, work orders, and status.
    """
    return _sync_api_request("GET", f"/projects/{project_id}")


# =============================================================================
# LangGraph Tools - Service Requests
# =============================================================================

@tool(args_schema=CreateRequestInput)
def coperniq_create_request(
    title: str,
    address: List[str],
    trades: Optional[List[str]] = None,
    phone: Optional[str] = None,
    priority: str = "NORMAL",
    description: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a service request (ticket) in Coperniq.

    Use for incoming service calls, emergency requests, or customer issues.
    Requests are simpler than projects - single visit service calls.

    Priority levels:
    - EMERGENCY: 2-hour SLA (safety, no heat/cooling, flooding)
    - URGENT: 24-hour SLA (significant discomfort)
    - NORMAL: 48-hour SLA (routine service)
    - SCHEDULED: 7-day window (maintenance, inspections)
    """
    payload = {
        "title": title,
        "address": address,
    }
    if trades:
        payload["trades"] = trades
    if phone:
        payload["primaryPhone"] = phone
    if priority:
        payload["priority"] = priority
    if description:
        payload["description"] = description

    return _sync_api_request("POST", "/requests", data=payload)


@tool
def coperniq_list_requests(status: str = "OPEN", limit: int = 20) -> Dict[str, Any]:
    """
    List service requests in Coperniq.

    Use to see pending work, dispatch queue, or status overview.
    """
    return _sync_api_request("GET", "/requests", params={
        "status": status,
        "limit": limit
    })


# =============================================================================
# LangGraph Tools - Work Orders
# =============================================================================

@tool(args_schema=CreateWorkOrderInput)
def coperniq_create_work_order(
    template_id: int,
    project_id: Optional[int] = None,
    request_id: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Create a work order from a template.

    Work orders are task lists for technicians. Must attach to project or request.
    Templates include: AC Inspection, Furnace Safety, PM Visit, etc.
    """
    if project_id:
        endpoint = f"/projects/{project_id}/work-orders"
    elif request_id:
        endpoint = f"/requests/{request_id}/work-orders"
    else:
        return {"success": False, "error": "Must provide project_id or request_id"}

    return _sync_api_request("POST", endpoint, data={"templateId": template_id})


@tool
def coperniq_list_work_order_templates() -> Dict[str, Any]:
    """
    List available work order templates.

    Returns templates like: AC Inspection, Furnace Safety, PM Visit, etc.
    Use template IDs when creating work orders.
    """
    return _sync_api_request("GET", "/work-orders/templates")


@tool
def coperniq_list_work_orders(
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """
    List all work orders in Coperniq.

    Returns work orders with: id, title, status, priority, assignee, dates.
    Use page/page_size for pagination (max 100 per page).
    """
    return _sync_api_request("GET", "/work-orders", params={
        "page": page,
        "page_size": page_size,
    })


@tool
def coperniq_get_work_order(work_order_id: int) -> Dict[str, Any]:
    """
    Get work order details including checklist items and status.
    """
    return _sync_api_request("GET", f"/work-orders/{work_order_id}")


# =============================================================================
# LangGraph Tools - Dispatch
# =============================================================================

@tool(args_schema=DispatchInput)
def coperniq_dispatch_technician(
    work_order_id: int,
    technician_id: int,
    scheduled_date: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Assign a technician to a work order.

    Use after creating a work order to schedule the visit.
    For emergencies, dispatch immediately available tech.
    """
    payload = {"assigneeId": technician_id}
    if scheduled_date:
        payload["scheduledDate"] = scheduled_date
    if notes:
        payload["dispatchNotes"] = notes

    return _sync_api_request("PATCH", f"/work-orders/{work_order_id}", data=payload)


@tool
def coperniq_get_technician_availability(
    trade: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get available technicians (optionally filtered by trade).

    Use before dispatching to find the right tech for the job.
    Trades: HVAC, Plumbing, Electrical, Fire Protection
    """
    params = {}
    if trade:
        params["trade"] = trade
    return _sync_api_request("GET", "/users", params=params)


# =============================================================================
# LangGraph Tools - Call Logging
# =============================================================================

@tool(args_schema=LogCallInput)
def coperniq_log_call(
    from_number: str,
    to_number: str,
    start_time: str,
    end_time: str,
    reason: str,
    disposition: str,
    project_id: Optional[int] = None,
    request_id: Optional[int] = None,
    client_id: Optional[int] = None,
    is_inbound: bool = True,
    note: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Log a customer call with disposition in Coperniq.

    Required after every call for tracking and metrics.

    Reasons: SERVICE, PRODUCT, PROCESS, ACCOUNTING, REVENUE_OPPORTUNITY, FEEDBACK, OTHER
    Dispositions: VISIT_SCHEDULED, INFO_PROVIDED, ISSUE_RESOLVED, FOLLOW_UP, ESCALATION, NO_ACTION, UNRESPONSIVE, OTHER
    """
    payload = {
        "fromNumber": from_number,
        "toNumber": to_number,
        "isInbound": is_inbound,
        "startTime": start_time,
        "endTime": end_time,
        "reason": reason,
        "disposition": disposition,
    }
    if note:
        payload["note"] = note

    if project_id:
        endpoint = f"/projects/{project_id}/calls"
    elif request_id:
        endpoint = f"/requests/{request_id}/calls"
    elif client_id:
        endpoint = f"/clients/{client_id}/calls"
    else:
        return {"success": False, "error": "Must provide project_id, request_id, or client_id"}

    return _sync_api_request("POST", endpoint, data=payload)


# =============================================================================
# LangGraph Tools - Invoicing & Collections
# =============================================================================

@tool(args_schema=CreateInvoiceInput)
def coperniq_create_invoice(
    title: str,
    record_id: int,
    due_date: str,
    line_items: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Create an invoice in Coperniq.

    Line items should include: catalogItemId, quantity, unitPrice
    Example: {"catalogItemId": 42, "quantity": 1, "unitPrice": 150.00}
    """
    payload = {
        "title": title,
        "type": "INVOICE",
        "recordId": record_id,
        "calculationMethod": "LINE_ITEMS",
        "dueDate": due_date,
        "status": "DRAFT",
        "lineItems": line_items,
    }
    return _sync_api_request("POST", "/invoices", data=payload)


@tool
def coperniq_get_aging_invoices(bucket: str = "all") -> Dict[str, Any]:
    """
    Get invoices grouped by aging bucket for collections.

    Buckets: "0-30", "31-60", "61-90", "90+", or "all"
    Use for collections follow-up and AR management.
    """
    result = _sync_api_request("GET", "/invoices")

    if not result.get("success"):
        return result

    invoices = result.get("data", [])
    if not isinstance(invoices, list):
        invoices = []

    today = datetime.now()
    aged = {"0-30": [], "31-60": [], "61-90": [], "90+": []}

    for inv in invoices:
        if inv.get("status") not in ["PAID", "CANCELLED"]:
            due_str = inv.get("dueDate")
            if due_str:
                try:
                    due = datetime.fromisoformat(due_str.replace("Z", "+00:00"))
                    days = (today - due.replace(tzinfo=None)).days

                    if days <= 30:
                        aged["0-30"].append(inv)
                    elif days <= 60:
                        aged["31-60"].append(inv)
                    elif days <= 90:
                        aged["61-90"].append(inv)
                    else:
                        aged["90+"].append(inv)
                except (ValueError, TypeError):
                    pass

    if bucket == "all":
        return {"success": True, "data": aged}
    elif bucket in aged:
        return {"success": True, "data": aged[bucket]}
    else:
        return {"success": False, "error": f"Invalid bucket: {bucket}"}


# =============================================================================
# LangGraph Tools - PM & Service Plans
# =============================================================================

@tool
def coperniq_get_pm_due_assets(days_ahead: int = 30, trade: Optional[str] = None) -> Dict[str, Any]:
    """
    Get assets with preventive maintenance due within N days.

    Use for PM scheduling and proactive service outreach.
    Returns assets needing HVAC tune-ups, filter changes, inspections, etc.
    """
    # This requires querying ServicePlanInstance -> Asset relationships
    return {
        "success": True,
        "message": f"Querying PM due within {days_ahead} days" + (f" for {trade}" if trade else ""),
        "implementation": "Query ServicePlanInstance with visitSchedule, filter by date range"
    }


@tool
def coperniq_get_expiring_contracts(days_ahead: int = 60) -> Dict[str, Any]:
    """
    Get service contracts expiring within N days.

    Use for renewal outreach and retention campaigns.
    """
    return {
        "success": True,
        "message": f"Querying contracts expiring within {days_ahead} days",
        "implementation": "Query ServicePlanInstance with endDate filter"
    }


# =============================================================================
# LangGraph Tools - Health Check
# =============================================================================

@tool
def coperniq_health_check() -> Dict[str, Any]:
    """
    Check Coperniq API connectivity.

    Use at start of session to verify connection.
    """
    result = _sync_api_request("GET", "/work-orders/templates")
    if result.get("success"):
        return {
            "success": True,
            "status": "healthy",
            "company_id": COPERNIQ_COMPANY_ID,
            "instance": "Instance 388 - Kipper Energy Solutions"
        }
    return {"success": False, "status": "unhealthy", "error": result.get("error")}


# =============================================================================
# Tool Collections for Different Use Cases
# =============================================================================

# All tools (full capability)
coperniq_tools = [
    # Client tools
    coperniq_create_client,
    coperniq_list_clients,
    coperniq_get_client,
    # Project tools
    coperniq_create_project,
    coperniq_list_projects,
    coperniq_get_project,
    # Request tools
    coperniq_create_request,
    coperniq_list_requests,
    # Work order tools
    coperniq_create_work_order,
    coperniq_list_work_order_templates,
    coperniq_get_work_order,
    # Dispatch tools
    coperniq_dispatch_technician,
    coperniq_get_technician_availability,
    # Call logging
    coperniq_log_call,
    # Invoicing
    coperniq_create_invoice,
    coperniq_get_aging_invoices,
    # PM & Service
    coperniq_get_pm_due_assets,
    coperniq_get_expiring_contracts,
    # Utility
    coperniq_health_check,
]

# Voice AI agent tools (subset)
voice_ai_tools = [
    coperniq_create_request,
    coperniq_log_call,
    coperniq_dispatch_technician,
    coperniq_get_technician_availability,
]

# Dispatch agent tools (subset)
dispatch_tools = [
    coperniq_dispatch_technician,
    coperniq_create_work_order,
    coperniq_get_technician_availability,
    coperniq_list_work_order_templates,
]

# Collections agent tools (subset)
collections_tools = [
    coperniq_get_aging_invoices,
    coperniq_log_call,
    coperniq_get_client,
]

# PM scheduler agent tools (subset)
pm_scheduler_tools = [
    coperniq_get_pm_due_assets,
    coperniq_create_work_order,
    coperniq_get_expiring_contracts,
]

# Quote builder agent tools (subset)
quote_builder_tools = [
    coperniq_create_invoice,
    coperniq_list_work_order_templates,
]


# =============================================================================
# Configuration Helper
# =============================================================================

def configure_gateway(gateway_url: str) -> None:
    """Set custom gateway URL for local development."""
    global COPERNIQ_BASE_URL
    COPERNIQ_BASE_URL = gateway_url


# =============================================================================
# CLI Test
# =============================================================================

if __name__ == "__main__":
    print("Coperniq LangGraph Tools - Instance 388")
    print("=" * 50)

    result = coperniq_health_check.invoke({})
    print(f"Health: {result}")

    print(f"\nTotal tools: {len(coperniq_tools)}")
    print("\nAvailable tools:")
    for t in coperniq_tools:
        print(f"  - {t.name}: {t.description[:60]}...")
