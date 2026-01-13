# Coperniq REST API Reference

**Created:** 2026-01-13
**Source:** https://docs.coperniq.io/api-reference
**Instance:** 388 (Kipper Energy Solutions)

---

## Authentication

All endpoints require the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     https://api.coperniq.io/v1/...
```

**API Key Location:** `.env` file → `COPERNIQ_API_KEY`

---

## Base URL

```
https://api.coperniq.io/v1
```

---

## Projects

### List Projects
```http
GET /v1/projects
```

### Search Projects
```http
GET /v1/projects/search
```

### Get Project
```http
GET /v1/projects/{projectId}
```

### Create Project
```http
POST /v1/projects
Content-Type: application/json

{
  "name": "Project Name",
  "clientId": 123,
  "workflowId": 456
}
```

### Update Project
```http
PATCH /v1/projects/{projectId}
```

### Delete Project
```http
DELETE /v1/projects/{projectId}
```

---

## Requests (Service Requests)

### List Requests
```http
GET /v1/requests
```

### Get Request
```http
GET /v1/requests/{requestId}
```

### Create Request
```http
POST /v1/requests
```

### Update Request
```http
PATCH /v1/requests/{requestId}
```

### Delete Request
```http
DELETE /v1/requests/{requestId}
```

---

## Clients (Contacts)

### List Clients
```http
GET /v1/clients
```

### Get Client
```http
GET /v1/clients/{clientId}
```

### Create Client
```http
POST /v1/clients
Content-Type: application/json

{
  "name": "Customer Name",
  "email": "customer@example.com",
  "phone": "+1234567890"
}
```

### Update Client
```http
PATCH /v1/clients/{clientId}
```

---

## Work Orders

### List Work Order Templates
```http
GET /v1/work-orders/templates
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "HVAC Service Call",
    "description": "Standard HVAC service work order"
  }
]
```

### List All Work Orders
```http
GET /v1/work-orders
```

### List Project Work Orders
```http
GET /v1/projects/{projectId}/work-orders
```

### List Request Work Orders
```http
GET /v1/requests/{requestId}/work-orders
```

### List Client Work Orders
```http
GET /v1/clients/{clientId}/work-orders
```

### Get Work Order
```http
GET /v1/work-orders/{workOrderId}
```

### Create Project Work Order
```http
POST /v1/projects/{projectId}/work-orders
Content-Type: application/json

{
  "templateId": 42,
  "phaseInstanceId": 7
}
```

**Parameters:**
- `templateId` (required): Work order template ID
- `phaseInstanceId` (optional): Phase to attach work order to

**Response:**
```json
{
  "id": 123,
  "createdAt": "2026-01-13T10:00:00Z",
  "updatedAt": "2026-01-13T10:00:00Z",
  "description": null,
  "position": 1,
  "phaseInstanceId": 7,
  "projectId": 456,
  "createdById": 789
}
```

### Create Request Work Order
```http
POST /v1/requests/{requestId}/work-orders
Content-Type: application/json

{
  "templateId": 42
}
```

### Create Client Work Order
```http
POST /v1/clients/{clientId}/work-orders
Content-Type: application/json

{
  "templateId": 42
}
```

### Update Work Orders
```http
PATCH /v1/projects/{projectId}/work-orders/{workOrderId}
PATCH /v1/requests/{requestId}/work-orders/{workOrderId}
PATCH /v1/clients/{clientId}/work-orders/{workOrderId}
```

### Delete Work Orders
```http
DELETE /v1/projects/{projectId}/work-orders/{workOrderId}
DELETE /v1/requests/{requestId}/work-orders/{workOrderId}
DELETE /v1/clients/{clientId}/work-orders/{workOrderId}
```

---

## Line Items (Catalog)

### List Project Line Items
```http
GET /v1/projects/{projectId}/line-items
```

**Response:**
```json
[
  {
    "id": 1,
    "quantity": 2,
    "description": "16 SEER AC Unit",
    "unitCost": 2500.00,
    "totalCost": 5000.00,
    "unitPrice": 4500.00,
    "totalPrice": 9000.00,
    "createdAt": "2026-01-13T10:00:00Z",
    "catalogItem": {
      "id": 42,
      "name": "Carrier 16 SEER AC",
      "type": "PRODUCT",
      "manufacturer": "Carrier",
      "sku": "24ACC636A003",
      "description": "3-ton 16 SEER air conditioner"
    }
  }
]
```

### Replace Project Line Items
```http
PUT /v1/projects/{projectId}/line-items
Content-Type: application/json

[
  {
    "catalogItemId": 42,
    "unitPrice": 4500.00,
    "unitCost": 2500.00,
    "quantity": 2,
    "description": "16 SEER AC Unit - 3 ton"
  }
]
```

**Required Fields:**
- `catalogItemId`: ID from catalog
- `unitPrice`: Customer price
- `unitCost`: Your cost
- `quantity`: Count
- `description`: Line item description

---

## Files

### Get Project Files
```http
GET /v1/projects/{projectId}/files
```

### Get Request Files
```http
GET /v1/requests/{requestId}/files
```

### Get Single File
```http
GET /v1/projects/{projectId}/files/{fileId}
GET /v1/requests/{requestId}/files/{fileId}
```

### Upload Project File
```http
POST /v1/projects/{projectId}/files/upload
Content-Type: multipart/form-data

file: <binary>
name: custom-filename.pdf (optional query param)
content_type: application/pdf (optional query param)
```

### Upload Request File
```http
POST /v1/requests/{requestId}/files/upload
Content-Type: multipart/form-data

file: <binary>
```

### Upload File from URL
```http
POST /v1/projects/{projectId}/files/upload-from-url
POST /v1/requests/{requestId}/files/upload-from-url
Content-Type: application/json

{
  "url": "https://example.com/document.pdf",
  "name": "document.pdf"
}
```

### Delete Files
```http
DELETE /v1/projects/{projectId}/files/{fileId}
DELETE /v1/requests/{requestId}/files/{fileId}
```

---

## Common Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Invalid request |
| 401 | Authentication failed |
| 404 | Resource not found |
| 500 | Internal server error |

---

## cURL Examples

### List Work Order Templates
```bash
curl -X GET "https://api.coperniq.io/v1/work-orders/templates" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -H "Content-Type: application/json"
```

### Create Work Order from Template
```bash
curl -X POST "https://api.coperniq.io/v1/projects/123/work-orders" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"templateId": 42}'
```

### Upload File
```bash
curl -X POST "https://api.coperniq.io/v1/projects/123/files/upload" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -F "file=@/path/to/document.pdf"
```

### Add Line Items to Project
```bash
curl -X PUT "https://api.coperniq.io/v1/projects/123/line-items" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "catalogItemId": 42,
      "unitPrice": 4500,
      "unitCost": 2500,
      "quantity": 1,
      "description": "HVAC Unit Installation"
    }
  ]'
```

---

## Python SDK Example

```python
import requests

API_KEY = "your-api-key"
BASE_URL = "https://api.coperniq.io/v1"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

# List work order templates
templates = requests.get(
    f"{BASE_URL}/work-orders/templates",
    headers=headers
).json()

# Create work order from template
work_order = requests.post(
    f"{BASE_URL}/projects/123/work-orders",
    headers=headers,
    json={"templateId": templates[0]["id"]}
).json()

print(f"Created work order: {work_order['id']}")
```

---

## Rate Limits

Check response headers for rate limit information:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

---

## Workflows

### List Workflows
```http
GET /v1/workflows
```

**Query Parameters:**
- `page_size`: Results per page
- `page`: Page number
- `order_by`: Sort field

**Response:**
```json
[
  {
    "id": 1,
    "name": "Solar Installation",
    "description": "Full solar project workflow",
    "type": "PROJECT",
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-13T00:00:00Z",
    "phases": [
      {
        "id": 1,
        "name": "Lead",
        "type": "LEAD",
        "redSla": 7,
        "yellowSla": 3
      }
    ]
  }
]
```

### Get Workflow
```http
GET /v1/workflows/{workflowId}
```

---

## Invoices

### List Invoices
```http
GET /v1/invoices
```

### Get Invoice
```http
GET /v1/invoices/{invoiceId}
```

### Get Project Invoices
```http
GET /v1/projects/{projectId}/invoices
```

### Get Client Invoices
```http
GET /v1/clients/{clientId}/invoices
```

### Create Invoice
```http
POST /v1/invoices
Content-Type: application/json

{
  "title": "Solar Installation Invoice",
  "type": "INVOICE",
  "recordId": 123,
  "calculationMethod": "LINE_ITEMS",
  "dueDate": "2026-02-13T00:00:00Z",
  "status": "DRAFT",
  "lineItems": [
    {
      "catalogItemId": 42,
      "quantity": 20,
      "unitCost": 250,
      "unitPrice": 400,
      "description": "Solar Panels - 400W"
    }
  ]
}
```

**Required Fields:**
- `title`: Invoice name
- `type`: `INVOICE` or `BILL`
- `recordId`: Project, request, or client ID
- `calculationMethod`: `LINE_ITEMS` or `PERCENTAGE`
- `dueDate`: ISO 8601 datetime
- `lineItems`: Array of line items (when LINE_ITEMS method)

**Status Options:**
- `DRAFT` (default)
- `SENT`
- `DECLINED`
- `PAID`
- `PARTIALLY_PAID`
- `OVERDUE`

### Update Invoice
```http
PATCH /v1/invoices/{invoiceId}
```

### Delete Invoice
```http
DELETE /v1/invoices/{invoiceId}
```

---

## Forms

### List Project Forms
```http
GET /v1/projects/{projectId}/forms
```

**Query Parameters:**
- `status`: Filter by status
  - `UNASSIGNED`
  - `ASSIGNED`
  - `REVIEW`
  - `CHANGES_REQUESTED`
  - `COMPLETED`
  - `CANCELLED`

**Response:**
```json
[
  {
    "id": 1,
    "name": "AC System Inspection",
    "description": "HVAC commissioning checklist",
    "isCompleted": false,
    "status": "ASSIGNED",
    "createdAt": "2026-01-13T00:00:00Z",
    "dueDate": "2026-01-20T00:00:00Z",
    "templateId": 42,
    "projectId": 123,
    "phaseName": "Install"
  }
]
```

### Get Form
```http
GET /v1/forms/{formId}
```

### Update Form
```http
PATCH /v1/forms/{formId}
```

### Attach File to Form Field from URL
```http
POST /v1/forms/{formId}/fields/{fieldId}/attach-from-url
Content-Type: application/json

{
  "url": "https://example.com/photo.jpg",
  "name": "installation-photo.jpg"
}
```

---

## Calls

### Create Project Call
```http
POST /v1/projects/{projectId}/calls
Content-Type: application/json

{
  "fromNumber": "+15551234567",
  "toNumber": "+15559876543",
  "isInbound": true,
  "startTime": "2026-01-13T10:00:00Z",
  "endTime": "2026-01-13T10:15:00Z",
  "reason": "SERVICE",
  "disposition": "VISIT_SCHEDULED",
  "outcome": "ANSWERED",
  "note": "Customer requested AC tune-up, scheduled for Friday"
}
```

**Required Fields:**
- `fromNumber`: Originating phone number
- `toNumber`: Receiving phone number
- `isInbound`: true/false
- `startTime`: ISO 8601 datetime
- `endTime`: ISO 8601 datetime
- `reason`: `PRODUCT`, `PROCESS`, `SERVICE`, `ACCOUNTING`, `REVENUE_OPPORTUNITY`, `FEEDBACK`, `OTHER`
- `disposition`: `INFO_PROVIDED`, `VISIT_SCHEDULED`, `ISSUE_RESOLVED`, `FOLLOW_UP`, `ESCALATION`, `NO_ACTION`, `UNRESPONSIVE`, `OTHER`

**Optional Fields:**
- `outcome`: `ANSWERED` or `MISSED`
- `note`: Call notes
- `recordingUrl`: URL to call recording
- `transcriptUrl`: URL to transcript

### Create Request Call
```http
POST /v1/requests/{requestId}/calls
```

### Create Client Call
```http
POST /v1/clients/{clientId}/calls
```

### List Calls
```http
GET /v1/projects/{projectId}/calls
GET /v1/requests/{requestId}/calls
GET /v1/clients/{clientId}/calls
```

---

## Users & Teams

### List Users
```http
GET /v1/users
```

### Invite User
```http
POST /v1/users/invite
Content-Type: application/json

{
  "email": "newuser@company.com",
  "roleId": 1,
  "teamIds": [1, 2]
}
```

### List Teams
```http
GET /v1/teams
```

### List Roles
```http
GET /v1/roles
```

---

## Properties (Custom Fields)

### List Properties
```http
GET /v1/properties
```

Returns all custom field definitions configured for the company.

---

## Full API Documentation

https://docs.coperniq.io/api-reference

---

## Instance 388 Quick Reference

**Company ID:** 388
**Company Name:** Kipper Energy Solutions
**API Base:** https://api.coperniq.io/v1
**API Key:** (stored in .env as COPERNIQ_API_KEY)

### Common Operations

```bash
# List all workflows for Instance 388
curl -X GET "https://api.coperniq.io/v1/workflows" \
  -H "x-api-key: $COPERNIQ_API_KEY"

# Create a new solar project
curl -X POST "https://api.coperniq.io/v1/projects" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Smith Residence Solar",
    "address": ["123 Main St, Austin TX 78701"],
    "trades": ["Solar"],
    "workflowId": "1",
    "primaryEmail": "smith@email.com"
  }'

# Create a service request
curl -X POST "https://api.coperniq.io/v1/requests" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "AC Not Cooling",
    "address": ["456 Oak Ave, Austin TX 78702"],
    "trades": ["HVAC"],
    "primaryPhone": "+15551234567"
  }'

# Log a customer call
curl -X POST "https://api.coperniq.io/v1/projects/123/calls" \
  -H "x-api-key: $COPERNIQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "fromNumber": "+15551234567",
    "toNumber": "+15559876543",
    "isInbound": true,
    "startTime": "2026-01-13T10:00:00Z",
    "endTime": "2026-01-13T10:15:00Z",
    "reason": "SERVICE",
    "disposition": "VISIT_SCHEDULED"
  }'
```

---

*Last updated: 2026-01-13*
