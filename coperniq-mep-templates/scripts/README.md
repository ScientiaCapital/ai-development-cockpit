# Coperniq MEP Scripts

Scripts for automating Coperniq instance configuration via REST API.

## Prerequisites

```bash
pip install httpx python-dotenv
```

## Scripts

### `import_catalog.py` - Bulk Catalog Import

Imports 115 catalog items from `config/master-catalog/catalog-items.json` to Coperniq via REST API.

#### Configuration

1. Add your Coperniq API key to `.env`:
   ```
   COPERNIQ_API_KEY=your_api_key_here
   ```

2. Or generate a new API key:
   ```bash
   python import_catalog.py --generate-key \
       --email kipperenergysolutions@coperniq.io \
       --password YOUR_PASSWORD
   ```

#### Usage

```bash
# Preview what will be imported (dry run)
python import_catalog.py --dry-run

# Import all catalog items
python import_catalog.py

# Import with explicit API key
python import_catalog.py --api-key YOUR_API_KEY

# Don't skip existing items (will cause conflicts)
python import_catalog.py --no-skip
```

#### Output Example

```
============================================================
🏗️  Coperniq Catalog Import Tool
============================================================
📦 Loaded 115 catalog items from JSON
📋 Found 0 existing catalog items

🚀 Starting import...

  [  1/115] ✅ Solar Installer - Standard Rate
  [  2/115] ✅ Solar Installer - Emergency Rate
  [  3/115] ✅ Battery System Technician
  ...

============================================================
📊 Import Summary
============================================================
   Total items:     115
   Created:         115
   Skipped:         0
   Failed:          0
```

## Catalog Structure

The master catalog contains 115 items across 7 trades:

| Trade | Items | Description |
|-------|-------|-------------|
| ENERGY | 19 | Solar, battery, EV, generator |
| MECHANICAL | 15 | HVAC systems and services |
| ELECTRICAL | 16 | Panels, circuits, outlets |
| PLUMBING | 16 | Water heaters, drains, fixtures |
| LOW_VOLTAGE | 15 | Security, cameras, networking |
| FIRE_SAFETY | 16 | Sprinklers, alarms, extinguishers |
| ROOFING | 15 | Shingles, gutters, inspections |

## API Reference

- **Base URL:** `https://api.coperniq.io/v1`
- **Auth Header:** `x-api-key: YOUR_KEY`
- **Docs:** https://docs.coperniq.io/api-reference/catalog-items

### Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api-keys` | Generate API key (Basic Auth) |
| GET | `/catalog-items` | List existing items |
| POST | `/catalog-items` | Create new item |

## Troubleshooting

### "No API key found"
Add `COPERNIQ_API_KEY` to `.env` or pass `--api-key` argument.

### "Conflict (may already exist)"
Item with same name exists. Use `--no-skip` to force (will error).

### "Validation error"
Check that required fields are present: name, type, category, cost, price.
