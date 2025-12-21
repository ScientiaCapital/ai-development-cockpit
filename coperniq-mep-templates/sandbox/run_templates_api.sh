#!/bin/bash
# MEP Templates API - Startup Script
# Usage: ./run_templates_api.sh [dev|prod] [port]
# Examples:
#   ./run_templates_api.sh dev 8000           # Development with auto-reload
#   ./run_templates_api.sh prod 8000          # Production mode
#   ./run_templates_api.sh                    # Default: development on port 8000

set -e

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_MODULE="sandbox.templates_api:app"
MODE="${1:-dev}"
PORT="${2:-8000}"
HOST="0.0.0.0"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running from correct directory
if [ ! -f "$PROJECT_DIR/requirements.txt" ]; then
    log_error "requirements.txt not found in $PROJECT_DIR"
    log_error "Please run this script from the coperniq-mep-templates directory"
    exit 1
fi

cd "$PROJECT_DIR"

# Validate mode
if [ "$MODE" != "dev" ] && [ "$MODE" != "prod" ]; then
    log_error "Invalid mode: $MODE. Use 'dev' or 'prod'"
    exit 1
fi

# Validate port
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    log_error "Invalid port: $PORT"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    log_error "Python 3 is required but not installed"
    exit 1
fi

# Check if FastAPI/uvicorn is installed
if ! python3 -c "import fastapi, uvicorn" 2>/dev/null; then
    log_warn "FastAPI/uvicorn not installed. Installing from requirements.txt..."
    pip install -r requirements.txt
fi

# Print startup information
log_info "Starting MEP Templates API"
log_info "Mode: $MODE"
log_info "Host: $HOST"
log_info "Port: $PORT"
log_info "Working directory: $PROJECT_DIR"
echo ""
log_info "Available endpoints:"
echo "  - Health:        http://$HOST:$PORT/health"
echo "  - API Docs:      http://$HOST:$PORT/docs"
echo "  - ReDoc:         http://$HOST:$PORT/redoc"
echo "  - OpenAPI JSON:  http://$HOST:$PORT/openapi.json"
echo ""

# Start server based on mode
if [ "$MODE" = "dev" ]; then
    log_info "Development mode with auto-reload enabled"
    python3 -m uvicorn "$API_MODULE" \
        --host "$HOST" \
        --port "$PORT" \
        --reload \
        --log-level info
else
    log_info "Production mode with 4 workers"

    # Check if gunicorn is available
    if ! command -v gunicorn &> /dev/null; then
        log_warn "gunicorn not found. Using uvicorn with multiple workers via --workers flag"
        python3 -m uvicorn "$API_MODULE" \
            --host "$HOST" \
            --port "$PORT" \
            --workers 4 \
            --log-level warning
    else
        gunicorn "$API_MODULE" \
            --bind "$HOST:$PORT" \
            --workers 4 \
            --worker-class uvicorn.workers.UvicornWorker \
            --log-level warning \
            --access-logfile - \
            --error-logfile -
    fi
fi
