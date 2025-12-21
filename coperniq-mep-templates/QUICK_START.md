# MEP Templates API - Quick Start Guide

Get the API running in 60 seconds.

## 1. Install Dependencies

```bash
pip install fastapi uvicorn pyyaml pydantic
```

Or use the full requirements:
```bash
pip install -r requirements.txt
```

## 2. Start the Server

### Option A: Python Script (Recommended)
```bash
cd coperniq-mep-templates
python sandbox/run_api.py dev 8000
```

### Option B: Bash Script
```bash
cd coperniq-mep-templates
./sandbox/run_templates_api.sh dev 8000
```

### Option C: Direct Uvicorn
```bash
cd coperniq-mep-templates
python -m uvicorn sandbox.templates_api:app --reload --port 8000
```

## 3. Access the API

Open your browser to:
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## 4. Test It Out

### Health Check
```bash
curl http://localhost:8000/health | jq
```

### List All Templates
```bash
curl http://localhost:8000/templates | jq
```

### List HVAC Templates
```bash
curl http://localhost:8000/templates/hvac | jq
```

### Get Specific Template
```bash
curl http://localhost:8000/templates/hvac/lead_intake | jq
```

### Filter by Trade
```bash
curl "http://localhost:8000/templates?trade=solar" | jq
```

### Get Trades Statistics
```bash
curl http://localhost:8000/trades | jq
```

## 5. Run Tests

```bash
python -m pytest sandbox/templates_api_test.py -v
```

All 36 tests should pass in ~2 seconds.

## 6. Production Deployment

### Multi-Worker Mode
```bash
python sandbox/run_api.py prod 8000
```

### With Gunicorn
```bash
gunicorn sandbox.templates_api:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Docker
```bash
docker build -t mep-templates-api .
docker run -p 8000:8000 mep-templates-api
```

## 7. Common Tasks

### View Available Trades
```bash
curl http://localhost:8000/trades | jq '.trades[].trade'
```

### Search Templates by Trade
```bash
# HVAC
curl http://localhost:8000/templates/hvac | jq '.templates[] | {name, fields_count}'

# Solar
curl http://localhost:8000/templates/solar | jq '.templates[] | {name, fields_count}'

# Plumbing
curl http://localhost:8000/templates/plumbing | jq '.templates[] | {name, fields_count}'
```

### Get Template Fields
```bash
curl http://localhost:8000/templates/hvac/lead_intake | jq '.groups[] | {name, fields: (.fields | map(.name))}'
```

## 8. API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check API health |
| `/templates` | GET | List all templates |
| `/templates/{trade}` | GET | Get templates by trade |
| `/templates/{trade}/{name}` | GET | Get template details |
| `/trades` | GET | List trades with stats |
| `/templates/seed` | POST | Seed to Coperniq (placeholder) |

## 9. Troubleshooting

### Port Already in Use
```bash
python sandbox/run_api.py dev 8001  # Use different port
```

### Import Error
```bash
pip install -r requirements.txt
python -m pip install --upgrade pip
```

### Templates Not Found
Make sure you're in the right directory:
```bash
cd coperniq-mep-templates
python sandbox/run_api.py dev 8000
```

## 10. Next Steps

1. **Explore the API**: Visit http://localhost:8000/docs
2. **Review Documentation**: Read `sandbox/API_README.md`
3. **Check Tests**: See `sandbox/templates_api_test.py` for examples
4. **Integrate**: Use `sandbox.template_loader.TemplateLoader` in your code

## Quick Reference: Python Usage

```python
from sandbox.template_loader import TemplateLoader

# Create loader
loader = TemplateLoader()

# Get all templates
all_templates = loader.get_all_templates()

# Get specific trade
hvac = loader.get_templates_by_trade("hvac")

# Get by phase
sales = loader.get_templates_by_phase("sales")

# Get single template
template = loader.get_template_by_trade_and_name("hvac", "lead_intake")

# Get stats
stats = loader.get_stats()
print(f"Total: {stats['total_templates']}")
```

## Template Directory Structure

```
templates/
├── hvac/           # 10 templates
├── solar/          # 10 templates
├── plumbing/       # 6 templates
├── electrical/     # 6 templates
├── fire_protection/ # 5 templates
├── controls/       # 5 templates
├── service_plans/  # 4 templates
├── tud_market/     # 8 templates
├── general_contractor/ # 1 template
├── roofing/        # 1 template
├── low_voltage/    # 2 templates
└── work_orders/    # 2 templates
```

## Example Response

```json
{
  "total": 60,
  "templates": [
    {
      "trade": "hvac",
      "name": "[HVAC] Lead Intake Form",
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

---

**That's it!** You now have a production-ready MEP Templates API running.

For more details, see `TEMPLATES_API_SUMMARY.md` and `sandbox/API_README.md`.
