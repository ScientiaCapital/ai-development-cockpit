"""
FastAPI application for JSON validation
Validates orchestrator plans and agent outputs using Pydantic schemas
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from typing import Any, Dict
import logging
from datetime import datetime

from .schemas import (
    OrchestratorPlan,
    AgentOutput,
    GeneratedFile,
    ValidationResponse
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="AI Development Cockpit - JSON Validator",
    description="Validates orchestrator plans and agent outputs using Pydantic schemas",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for Next.js integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3001",
        "http://localhost:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "json-validator",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "validate_plan": "/validate/plan",
            "validate_agent_output": "/validate/agent-output",
            "validate_file": "/validate/file"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "json-validator",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }


@app.post("/validate/plan", response_model=ValidationResponse)
async def validate_plan(data: Dict[str, Any]):
    """
    Validate orchestrator plan

    Validates that the plan conforms to OrchestratorPlan schema:
    - project_name: required string
    - language: one of typescript, python, go, rust
    - framework: required string
    - tasks: list of AgentTask objects
    - total_estimated_time: positive integer
    """
    logger.info(f"Validating orchestrator plan: {data.get('project_name', 'unknown')}")

    try:
        validated = OrchestratorPlan(**data)
        logger.info("Plan validation successful")
        return ValidationResponse(
            valid=True,
            errors=[],
            validated_data=validated.model_dump()
        )
    except ValidationError as e:
        error_messages = [
            f"{err['loc'][0]}: {err['msg']}" for err in e.errors()
        ]
        logger.warning(f"Plan validation failed: {error_messages}")
        return ValidationResponse(
            valid=False,
            errors=error_messages,
            validated_data=None
        )
    except Exception as e:
        logger.error(f"Unexpected error during plan validation: {str(e)}")
        return ValidationResponse(
            valid=False,
            errors=[f"Unexpected error: {str(e)}"],
            validated_data=None
        )


@app.post("/validate/agent-output", response_model=ValidationResponse)
async def validate_agent_output(data: Dict[str, Any]):
    """
    Validate agent output

    Validates that the output conforms to AgentOutput schema:
    - agent_type: required string
    - files_created: list of GeneratedFile objects
    - files_modified: optional list of GeneratedFile objects
    - warnings: optional list of strings
    - errors: optional list of strings
    - metadata: optional dictionary
    """
    logger.info(f"Validating agent output: {data.get('agent_type', 'unknown')}")

    try:
        validated = AgentOutput(**data)
        logger.info("Agent output validation successful")
        return ValidationResponse(
            valid=True,
            errors=[],
            validated_data=validated.model_dump()
        )
    except ValidationError as e:
        error_messages = [
            f"{err['loc'][0]}: {err['msg']}" for err in e.errors()
        ]
        logger.warning(f"Agent output validation failed: {error_messages}")
        return ValidationResponse(
            valid=False,
            errors=error_messages,
            validated_data=None
        )
    except Exception as e:
        logger.error(f"Unexpected error during agent output validation: {str(e)}")
        return ValidationResponse(
            valid=False,
            errors=[f"Unexpected error: {str(e)}"],
            validated_data=None
        )


@app.post("/validate/file", response_model=ValidationResponse)
async def validate_file(data: Dict[str, Any]):
    """
    Validate generated file

    Validates that the file conforms to GeneratedFile schema:
    - path: required string (file path)
    - content: required string (file content)
    - description: required string (what the file does)
    """
    logger.info(f"Validating generated file: {data.get('path', 'unknown')}")

    try:
        validated = GeneratedFile(**data)
        logger.info("File validation successful")
        return ValidationResponse(
            valid=True,
            errors=[],
            validated_data=validated.model_dump()
        )
    except ValidationError as e:
        error_messages = [
            f"{err['loc'][0]}: {err['msg']}" for err in e.errors()
        ]
        logger.warning(f"File validation failed: {error_messages}")
        return ValidationResponse(
            valid=False,
            errors=error_messages,
            validated_data=None
        )
    except Exception as e:
        logger.error(f"Unexpected error during file validation: {str(e)}")
        return ValidationResponse(
            valid=False,
            errors=[f"Unexpected error: {str(e)}"],
            validated_data=None
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8001,
        log_level="info"
    )
