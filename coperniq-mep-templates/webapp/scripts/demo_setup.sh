#!/bin/bash
# Contractor Command Center - Demo Setup Script
# Usage: ./scripts/demo_setup.sh --trade=hvac --name="Tim's HVAC"

set -e  # Exit on error

# Default values
TRADE="hvac"
NAME="Demo Contractor"
EMAIL=""
PHONE=""
MARKETS="residential,commercial"
PRESET=""

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEMO_DATA_DIR="$PROJECT_ROOT/config/demo_data"
CONTRACTOR_JSON="$DEMO_DATA_DIR/contractor.json"

# Color output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --trade=*) TRADE="${1#*=}" ;;
        --name=*) NAME="${1#*=}" ;;
        --email=*) EMAIL="${1#*=}" ;;
        --phone=*) PHONE="${1#*=}" ;;
        --markets=*) MARKETS="${1#*=}" ;;
        --preset=*) PRESET="${1#*=}" ;;
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --trade=TRADE          Trade type (hvac, solar, plumbing, electrical, fire-protection)"
            echo "  --name=NAME            Company name"
            echo "  --email=EMAIL          Contact email"
            echo "  --phone=PHONE          Contact phone"
            echo "  --markets=MARKETS      Comma-separated markets (residential,commercial)"
            echo "  --preset=PRESET        Configuration preset"
            echo "  -h, --help             Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown parameter: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
    shift
done

# Validate trade
VALID_TRADES=("hvac" "solar" "plumbing" "electrical" "fire-protection")
if [[ ! " ${VALID_TRADES[@]} " =~ " ${TRADE} " ]]; then
    echo -e "${RED}Invalid trade: $TRADE${NC}"
    echo "Valid trades: ${VALID_TRADES[*]}"
    exit 1
fi

# Set defaults based on trade if not provided
if [ -z "$EMAIL" ]; then
    EMAIL="${NAME// /}@example.com"
    EMAIL=$(echo "$EMAIL" | tr '[:upper:]' '[:lower:]')
fi

if [ -z "$PHONE" ]; then
    PHONE="(512) 555-0100"
fi

if [ -z "$PRESET" ]; then
    case $TRADE in
        hvac) PRESET="hvac_commercial" ;;
        solar) PRESET="solar_epc" ;;
        plumbing) PRESET="plumbing_service" ;;
        electrical) PRESET="electrical_commercial" ;;
        fire-protection) PRESET="fire_protection_service" ;;
    esac
fi

# Convert markets string to JSON array
IFS=',' read -ra MARKETS_ARRAY <<< "$MARKETS"
MARKETS_JSON="["
for i in "${!MARKETS_ARRAY[@]}"; do
    if [ $i -gt 0 ]; then
        MARKETS_JSON+=", "
    fi
    MARKETS_JSON+="\"${MARKETS_ARRAY[$i]}\""
done
MARKETS_JSON+="]"

# Set templates based on trade
case $TRADE in
    hvac)
        TEMPLATES='[
    "hvac/ac_inspection",
    "hvac/furnace_safety",
    "hvac/maintenance_report",
    "hvac/equipment_proposal",
    "hvac/refrigerant_log"
  ]'
        PHASES='["sales", "install", "service"]'
        ;;
    solar)
        TEMPLATES='[
    "solar/site_survey",
    "solar/installation_checklist",
    "solar/commissioning_report",
    "solar/interconnect_request"
  ]'
        PHASES='["sales", "design", "permitting", "install", "interconnect"]'
        ;;
    plumbing)
        TEMPLATES='[
    "plumbing/backflow_test",
    "plumbing/camera_inspection",
    "plumbing/water_heater_install",
    "plumbing/leak_detection"
  ]'
        PHASES='["service", "install", "inspection"]'
        ;;
    electrical)
        TEMPLATES='[
    "electrical/panel_inspection",
    "electrical/circuit_load_analysis",
    "electrical/ev_charger_install",
    "electrical/generator_service"
  ]'
        PHASES='["service", "install", "inspection"]'
        ;;
    fire-protection)
        TEMPLATES='[
    "fire/sprinkler_inspection",
    "fire/extinguisher_service",
    "fire/alarm_test",
    "fire/quarterly_maintenance"
  ]'
        PHASES='["inspection", "testing", "service"]'
        ;;
esac

echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}  Contractor Command Center - Demo Setup${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Trade:    ${GREEN}$TRADE${NC}"
echo -e "Company:  ${GREEN}$NAME${NC}"
echo -e "Email:    ${GREEN}$EMAIL${NC}"
echo -e "Phone:    ${GREEN}$PHONE${NC}"
echo -e "Markets:  ${GREEN}$MARKETS${NC}"
echo -e "Preset:   ${GREEN}$PRESET${NC}"
echo ""

# Create demo_data directory if it doesn't exist
mkdir -p "$DEMO_DATA_DIR"

# Generate contractor.json
echo -e "${YELLOW}Creating contractor configuration...${NC}"
cat > "$CONTRACTOR_JSON" <<EOF
{
  "id": "contractor-001",
  "name": "$NAME",
  "trade": "$TRADE",
  "email": "$EMAIL",
  "phone": "$PHONE",
  "markets": $MARKETS_JSON,
  "phases": $PHASES,
  "templatesEnabled": $TEMPLATES,
  "preset": "$PRESET"
}
EOF

echo -e "  ${GREEN}✓${NC} contractor.json created"

# Verify demo data files exist (optional - create if missing)
echo ""
echo -e "${YELLOW}Checking demo data files...${NC}"

DEMO_FILES=("contacts.json" "sites.json" "assets.json" "tasks.json" "contractor.json")
ALL_FILES_EXIST=true

for file in "${DEMO_FILES[@]}"; do
    FILE_PATH="$DEMO_DATA_DIR/$file"
    if [ -f "$FILE_PATH" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file missing (will be created on first run)"
        ALL_FILES_EXIST=false
    fi
done

# Create placeholder files if they don't exist
if [ ! -f "$DEMO_DATA_DIR/contacts.json" ]; then
    echo '[]' > "$DEMO_DATA_DIR/contacts.json"
fi
if [ ! -f "$DEMO_DATA_DIR/sites.json" ]; then
    echo '[]' > "$DEMO_DATA_DIR/sites.json"
fi
if [ ! -f "$DEMO_DATA_DIR/assets.json" ]; then
    echo '[]' > "$DEMO_DATA_DIR/assets.json"
fi
if [ ! -f "$DEMO_DATA_DIR/tasks.json" ]; then
    echo '[]' > "$DEMO_DATA_DIR/tasks.json"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Demo setup complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. cd $(basename "$PROJECT_ROOT")"
echo "  2. npm run dev"
echo "  3. Open http://localhost:3000"
echo ""
echo "Configuration saved to:"
echo "  $CONTRACTOR_JSON"
echo ""
