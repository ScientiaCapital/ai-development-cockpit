# JSON Validator Service

FastAPI-based Python service that validates orchestrator plans and agent outputs using Pydantic v2 schemas.

## Overview

This service ensures all AI-generated plans and code conform to strict schemas before execution, preventing runtime errors and ensuring data consistency across the AI Development Cockpit.

## Features

- **Pydantic v2 Validation**: Robust JSON schema validation with detailed error messages
- **FastAPI**: High-performance async API with automatic OpenAPI documentation
- **CORS Support**: Configured for Next.js integration
- **Health Checks**: Built-in health monitoring endpoint
- **Comprehensive Testing**: 15+ tests covering all validation scenarios

## Validation Endpoints

### 1. Validate Orchestrator Plan
**POST** `/validate/plan`

Validates complete project plans from the orchestrator.

**Request Body:**
```json
{
  "project_name": "user-management-api",
  "language": "python",
  "framework": "fastapi",
  "tasks": [
    {
      "agent_type": "CodeArchitect",
      "description": "Design architecture",
      "dependencies": [],
      "estimated_duration": 30
    }
  ],
  "total_estimated_time": 30
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "validated_data": { ... }
}
```

### 2. Validate Agent Output
**POST** `/validate/agent-output`

Validates output from individual agents.

**Request Body:**
```json
{
  "agent_type": "BackendDeveloper",
  "files_created": [
    {
      "path": "src/api/users.py",
      "content": "from fastapi import APIRouter...",
      "description": "User API endpoints"
    }
  ],
  "warnings": [],
  "errors": []
}
```

### 3. Validate Generated File
**POST** `/validate/file`

Validates individual generated files.

**Request Body:**
```json
{
  "path": "src/main.py",
  "content": "print('Hello, World!')",
  "description": "Main entry point"
}
```

### 4. Health Check
**GET** `/health`

Returns service health status.

## Installation

### Prerequisites
- Python 3.9+
- pip

### Setup

```bash
# 1. Navigate to the service directory
cd python-validator

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Configure environment (optional)
cp .env.example .env
# Edit .env if needed
```

## Running the Service

### Development Mode

```bash
# Start the server
python -m app.main

# Or use uvicorn directly
uvicorn app.main:app --reload --port 8001
```

The service will be available at:
- API: http://localhost:8001
- Interactive Docs: http://localhost:8001/docs
- ReDoc: http://localhost:8001/redoc

### Production Mode

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/test_validator.py

# Run with verbose output
pytest -v
```

**Test Coverage:**
- Health checks
- Valid plan validation
- Invalid plan validation
- Agent output validation
- File validation
- All supported languages (TypeScript, Python, Go, Rust)
- All agent types (CodeArchitect, BackendDeveloper, etc.)

## Integration with Next.js

### TypeScript Client

See `/src/services/validation/JSONValidationClient.ts` for the TypeScript client implementation.

**Usage Example:**

```typescript
import { JSONValidationClient } from '@/services/validation/JSONValidationClient'

const validator = new JSONValidationClient('http://localhost:8001')

// Validate a plan
const result = await validator.validatePlan({
  project_name: "my-app",
  language: "python",
  framework: "fastapi",
  tasks: [...],
  total_estimated_time: 90
})

if (!result.valid) {
  console.error("Validation failed:", result.errors)
}
```

## Schemas

### Supported Languages
- `typescript`
- `python`
- `go`
- `rust`

### Supported Agent Types
- `CodeArchitect`
- `BackendDeveloper`
- `FrontendDeveloper`
- `Tester`
- `DevOpsEngineer`

## API Documentation

Once the service is running, visit:
- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Deployment

### Docker (Coming Soon)

```bash
# Build image
docker build -t json-validator .

# Run container
docker run -p 8001:8001 json-validator
```

### RunPod (Task 4.2)

This service is designed to be deployed on RunPod for production use. See Task 4.2 documentation for deployment instructions.

## Error Handling

The service returns detailed validation errors:

```json
{
  "valid": false,
  "errors": [
    "language: Input should be 'typescript', 'python', 'go' or 'rust'",
    "tasks: Field required"
  ],
  "validated_data": null
}
```

## Performance

- **Async/await**: Non-blocking I/O for high concurrency
- **Pydantic v2**: 5-50x faster than v1
- **FastAPI**: One of the fastest Python frameworks

## Monitoring

The service includes:
- Health check endpoint for monitoring
- Structured logging
- Request/response logging
- Error tracking

## Security

- **CORS**: Configured for specific origins
- **Input Validation**: Strict schema enforcement
- **Error Messages**: Sanitized error responses

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8001
lsof -i :8001

# Kill the process
kill -9 <PID>
```

### Import Errors
```bash
# Ensure you're in the virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

## Development

### Adding New Schemas

1. Edit `app/schemas.py`
2. Add new Pydantic model
3. Create validation endpoint in `app/main.py`
4. Add tests in `tests/test_validator.py`

### Running Linters

```bash
# Install dev dependencies
pip install black flake8 mypy

# Format code
black app/ tests/

# Lint
flake8 app/ tests/

# Type check
mypy app/
```

## License

Part of AI Development Cockpit - See main project LICENSE

## Support

For issues or questions, please refer to the main project documentation.
