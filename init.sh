#!/bin/bash
# Coperniq MEP Agent - Session Initialization
# Run this script at the start of each session

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "      COPERNIQ MEP AGENT - SESSION INITIALIZATION"
echo "      Instance: 388 (Kipper Energy Solutions)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check for .env file
if [ -f .env ]; then
    echo "✓ Loading environment from .env"
    export $(grep -v '^#' .env | xargs)
else
    echo "✗ WARNING: .env file not found"
    echo "  Create .env with required keys:"
    echo "  - COPERNIQ_API_KEY"
    echo "  - ANTHROPIC_API_KEY"
    echo "  - OPENROUTER_API_KEY"
    exit 1
fi

# Verify required environment variables
echo ""
echo "Checking required environment variables..."
REQUIRED_VARS=("COPERNIQ_API_KEY" "ANTHROPIC_API_KEY" "OPENROUTER_API_KEY")
MISSING=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING+=("$var")
        echo "  ✗ $var: NOT SET"
    else
        echo "  ✓ $var: SET (${!var:0:10}...)"
    fi
done

if [ ${#MISSING[@]} -ne 0 ]; then
    echo ""
    echo "ERROR: Missing required environment variables: ${MISSING[*]}"
    exit 1
fi

# Verify Coperniq API connectivity
echo ""
echo "Testing Coperniq API connection..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "x-api-key: $COPERNIQ_API_KEY" \
    -H "Content-Type: application/json" \
    "https://api.coperniq.io/v1/work-orders/templates" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "  ✓ Coperniq API: CONNECTED (HTTP $HTTP_STATUS)"
else
    echo "  ✗ Coperniq API: FAILED (HTTP $HTTP_STATUS)"
    echo "    Check COPERNIQ_API_KEY"
fi

# Load previous session state
echo ""
echo "Loading previous session state..."
if [ -f progress.txt ]; then
    echo "  ✓ Found progress.txt"
    echo ""
    echo "=== PREVIOUS SESSION SUMMARY ==="
    head -50 progress.txt
    echo ""
    echo "=== PENDING TASKS ==="
    grep -E "^\- \[ \]" progress.txt 2>/dev/null || echo "  No pending tasks"
else
    echo "  No previous session state found"
fi

# Check MCP configuration
echo ""
echo "Checking MCP configuration..."
if [ -f .mcp/config.json ]; then
    echo "  ✓ .mcp/config.json found"
    AGENT_COUNT=$(cat .mcp/config.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('agents', [])))" 2>/dev/null || echo "0")
    TOOL_COUNT=$(cat .mcp/config.json | python3 -c "import sys, json; print(len(json.load(sys.stdin).get('tools', [])))" 2>/dev/null || echo "0")
    echo "    - Agents defined: $AGENT_COUNT"
    echo "    - Tools defined: $TOOL_COUNT"
else
    echo "  ✗ .mcp/config.json not found"
fi

# Check agent prompts
echo ""
echo "Checking agent prompts..."
AGENT_DIR=".mcp/agents"
if [ -d "$AGENT_DIR" ]; then
    PROMPT_COUNT=$(ls -1 "$AGENT_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✓ $PROMPT_COUNT agent prompts found:"
    for f in "$AGENT_DIR"/*.md; do
        [ -e "$f" ] && echo "    - $(basename "$f" .md)"
    done
fi

# Check review gates
echo ""
echo "Checking review gates..."
GATE_DIR=".mcp/gates"
if [ -d "$GATE_DIR" ]; then
    GATE_COUNT=$(ls -1 "$GATE_DIR"/*.yaml 2>/dev/null | wc -l | tr -d ' ')
    echo "  ✓ $GATE_COUNT review gates found:"
    for f in "$GATE_DIR"/*.yaml; do
        [ -e "$f" ] && echo "    - $(basename "$f" .yaml)"
    done
fi

# Git status
echo ""
echo "Git repository status..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current)
    UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
    echo "  ✓ Branch: $BRANCH"
    echo "  ✓ Uncommitted changes: $UNCOMMITTED"
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo ""
        echo "=== UNCOMMITTED FILES ==="
        git status --short
    fi
else
    echo "  ✗ Not a git repository"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "      SESSION READY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Available commands:"
echo "  python .mcp/tools/coperniq.py   # Test Coperniq tools"
echo "  cat progress.txt                # View session progress"
echo "  cat tests.json                  # View test definitions"
echo ""
echo "MCP Agents available:"
echo "  - voice-ai     : Inbound call handling"
echo "  - dispatch     : Technician assignment"
echo "  - collections  : Invoice follow-up"
echo "  - pm-scheduler : Preventive maintenance"
echo "  - quote-builder: Proposal generation"
echo ""
