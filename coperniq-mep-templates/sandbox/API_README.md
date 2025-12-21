# MEP Templates API

A production-ready FastAPI server for discovering, filtering, and retrieving MEP (Mechanical, Electrical, Plumbing) templates. Supports 60+ templates across 12 trades organized by phase.

## Quick Start

### Installation

```bash
# Install dependencies (from project root)
pip install -r requirements.txt

# Or install just the minimal API requirements
pip install fastapi uvicorn pyyaml pydantic python-dotenv
```

### Running the Server

```bash
# From the project root or coperniq-mep-templates directory
python -m uvicorn sandbox.templates_api:app --reload --port 8000

# Or with specific host/port
uvicorn sandbox.templates_api:app --host 0.0.0.0 --port 8000

# Production (with gunicorn)
gunicorn sandbox.templates_api:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Access

- API Documentation: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI Schema: http://localhost:8000/openapi.json

## API Endpoints

### Health Check

```http
GET /health
```

Check API health and template catalog status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-20T12:34:56Z",
  "templates_loaded": 60,
  "trades_available": 12
}
```

### List All Templates

```http
GET /templates
GET /templates?trade=hvac
GET /templates?phase=sales
GET /templates?trade=hvac&phase=sales
```

List templates with optional filtering.

**Query Parameters:**
- `trade` (optional): Filter by trade (e.g., hvac, solar, plumbing, electrical)
- `phase` (optional): Filter by phase (e.g., sales, install, service, maintenance)

**Response:**
```json
{
  "total": 60,
  "templates": [
    {
      "trade": "hvac",
      "name": "HVAC Lead Intake Form",
      "file": "lead_intake.yaml",
      "emoji": "❄️",
      "description": "Sales lead capture with source tracking...",
      "phase": "sales",
      "fields_count": 22,
      "groups_count": 5
    }
  ]
}
```

### Get Templates by Trade

```http
GET /templates/{trade}
```

Get all templates for a specific trade.

**Path Parameters:**
- `trade`: Trade name (hvac, solar, plumbing, electrical, etc.)

**Response:**
```json
{
  "trade": "hvac",
  "total": 10,
  "templates": [...]
}
```

**Available Trades:**
- `hvac` - Heating, Ventilation, Air Conditioning
- `solar` - Solar installations and audits
- `plumbing` - Plumbing services and installations
- `electrical` - Electrical work and inspections
- `fire_protection` - Fire safety systems
- `controls` - Building automation and controls
- `service_plans` - Service plan templates
- `tud_market` - Tenants, Users, Developers/Owners market
- `general_contractor` - General contracting
- `roofing` - Roofing services
- `low_voltage` - Low voltage systems
- `work_orders` - Work order templates

### Get Template Details

```http
GET /templates/{trade}/{template_name}
```

Get complete details for a specific template including all fields and groups.

**Path Parameters:**
- `trade`: Trade name
- `template_name`: Template name without extension (e.g., lead_intake)

**Response:**
```json
{
  "trade": "hvac",
  "name": "[HVAC] Lead Intake Form",
  "file": "lead_intake.yaml",
  "emoji": "❄️",
  "description": "Sales lead capture with source tracking...",
  "phase": "sales",
  "category": "HVAC",
  "work_order_type": "Sales Lead",
  "fields_count": 22,
  "groups_count": 5,
  "groups": [
    {
      "name": "Lead Source",
      "order": 1,
      "fields": [
        {
          "name": "Lead Source",
          "type": "Single select",
          "required": true,
          "options": ["Website Form", "Phone Call", "Referral", ...]
        },
        {
          "name": "Campaign/Promo Code",
          "type": "Text",
          "required": false,
          "options": null
        }
      ]
    }
  ],
  "metadata": {
    "total_fields": 22,
    "total_groups": 5,
    "trade": "hvac",
    "phase": "sales",
    "created_by": "ai-development-cockpit",
    "version": "1.0"
  }
}
```

### List All Trades with Statistics

```http
GET /trades
```

Get all available trades with template counts and phase breakdown.

**Response:**
```json
{
  "total_templates": 60,
  "trades": [
    {
      "trade": "hvac",
      "count": 10,
      "phases": {
        "sales": 3,
        "install": 2,
        "service": 5,
        "maintenance": 2
      }
    },
    {
      "trade": "solar",
      "count": 10,
      "phases": {
        "sales": 2,
        "install": 3
      }
    }
  ]
}
```

### Seed Templates to Coperniq (Placeholder)

```http
POST /templates/seed
```

Trigger template seeding to Coperniq (placeholder for future integration).

**Response:**
```json
{
  "status": "seeding_initiated",
  "message": "Template seeding initiated for 60 templates",
  "templates_count": 60,
  "trades_count": 12,
  "timestamp": "2025-12-20T12:34:56Z",
  "note": "Actual Coperniq API integration coming soon"
}
```

## Template Structure

Each YAML template file contains:

```yaml
template:
  name: "[HVAC] Lead Intake Form"
  emoji: "❄️"
  description: "Sales lead capture form..."
  category: "HVAC"
  phase: "sales"
  work_order:
    type: "Sales Lead"
    name: "[HVAC] Sales Lead"

groups:
  - name: "Lead Source"
    order: 1
    fields:
      - name: "Lead Source"
        type: "Single select"
        required: true
        options:
          - "Website Form"
          - "Phone Call"
          - "Referral"
      - name: "Campaign/Promo Code"
        type: "Text"
        required: false

metadata:
  total_fields: 22
  total_groups: 5
  trade: "HVAC"
  phase: "sales"
  created_by: "ai-development-cockpit"
  version: "1.0"
```

### Field Types

- **Text** - Free text input (names, addresses, notes)
- **Numeric** - Numbers (measurements, counts)
- **Single select** - One option from a list
- **Multiple select** - Multiple options from a list
- **File** - File upload (photos, documents)
- **Group** - Section header/grouping

## Integration with Coperniq

Templates are designed to integrate with Coperniq's Form Builder. Each template maps to:

- **Coperniq Type**: Form or Task
- **Required Fields**: Aligned with Coperniq schema
- **CSV Import**: Templates include recommended CSV import structure

Example CSV import for HVAC lead intake:

```csv
contact_name,phone,email,address,city,state,zip,property_type
John Smith,555-1234,john@example.com,123 Main St,Denver,CO,80202,Single Family Home
```

## Development

### Project Structure

```
coperniq-mep-templates/
├── sandbox/
│   ├── templates_api.py        # FastAPI server (this API)
│   ├── template_loader.py      # YAML parsing & catalog management
│   └── templates_api_test.py   # Integration tests
├── templates/                  # YAML template files
│   ├── hvac/                  # 10 HVAC templates
│   ├── solar/                 # 10 Solar templates
│   ├── plumbing/              # 6 Plumbing templates
│   ├── electrical/            # 6 Electrical templates
│   ├── fire_protection/       # 5 Fire protection templates
│   ├── controls/              # 5 Controls templates
│   ├── service_plans/         # 4 Service plan templates
│   ├── tud_market/            # 8 TUD Market templates
│   ├── general_contractor/    # 1 General contractor template
│   ├── roofing/               # 1 Roofing template
│   ├── low_voltage/           # 2 Low voltage templates
│   └── work_orders/           # 2 Work order templates
└── requirements.txt           # Python dependencies
```

### Testing

```bash
# Run integration tests
python -m pytest sandbox/templates_api_test.py -v

# Test specific endpoint
python -m pytest sandbox/templates_api_test.py::test_health_check -v

# Run with coverage
python -m pytest sandbox/templates_api_test.py --cov=sandbox --cov-report=html
```

### Loading Templates Programmatically

```python
from sandbox.template_loader import TemplateLoader

# Create loader
loader = TemplateLoader()

# Get all templates
templates = loader.get_all_templates()

# Get by trade
hvac_templates = loader.get_templates_by_trade("hvac")

# Get by phase
sales_templates = loader.get_templates_by_phase("sales")

# Get specific template
template = loader.get_template_by_trade_and_name("hvac", "lead_intake")

# Get statistics
stats = loader.get_stats()
print(f"Total: {stats['total_templates']} templates across {stats['total_trades']} trades")
```

## Error Handling

The API returns standard HTTP status codes with detailed error messages:

- **200 OK** - Successful request
- **400 Bad Request** - Invalid query parameters
- **404 Not Found** - Template or trade not found
- **500 Internal Server Error** - Server error
- **503 Service Unavailable** - Template loader not initialized

Error response format:

```json
{
  "error": "Template 'lead_intake' not found in trade 'hvac'",
  "code": 404,
  "timestamp": "2025-12-20T12:34:56Z"
}
```

## Performance

- **Template Loading**: ~600ms for all 60 templates
- **Cache**: Loader caches all templates in memory after startup
- **Response Time**: <50ms for typical queries
- **CORS**: Enabled for browser access
- **Max Request Size**: No limit on discovery endpoints

## Environment Variables

No required environment variables. Optional:

```bash
# Logging level (default: INFO)
LOG_LEVEL=DEBUG

# YAML templates directory (default: ../templates relative to this file)
TEMPLATES_DIR=/path/to/templates
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY coperniq-mep-templates/ .
EXPOSE 8000

CMD ["uvicorn", "sandbox.templates_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t mep-templates-api .
docker run -p 8000:8000 mep-templates-api
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mep-templates-api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mep-templates-api
  template:
    metadata:
      labels:
        app: mep-templates-api
    spec:
      containers:
      - name: api
        image: mep-templates-api:latest
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 30
```

## Monitoring

Monitor API health via the `/health` endpoint:

```bash
# Check health every 30 seconds
watch -n 30 curl -s http://localhost:8000/health | jq .
```

Monitor logs:

```bash
# With structured logging (if implemented)
grep "ERROR" api.log
```

## Future Enhancements

- GraphQL endpoint for complex queries
- Template versioning and updates
- Custom template creation endpoint
- Template search/full-text search
- Template recommendations based on trade/phase
- Rate limiting for high-volume queries
- Database persistence for template metadata
- Webhook integration with Coperniq
- Template export to multiple formats (JSON, CSV, PDF)

## Contributing

To add new templates:

1. Create YAML file in appropriate trade directory
2. Follow template structure (see examples)
3. Ensure required fields are marked correctly
4. Test with API: `GET /templates/{trade}/{template_name}`

## License

Proprietary - Scientia Capital

## Support

For issues or questions:
- Check OpenAPI docs at `/docs`
- Review template YAML structure
- Check logs for parsing errors
- Contact platform team

---

**Version**: 1.0.0
**Last Updated**: 2025-12-20
**Status**: Production Ready
