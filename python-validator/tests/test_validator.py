"""
Tests for JSON validation endpoints
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import OrchestratorPlan, AgentOutput, GeneratedFile

client = TestClient(app)


def test_root_endpoint():
    """Test root endpoint returns service info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "json-validator"
    assert data["version"] == "1.0.0"
    assert "endpoints" in data


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "json-validator"
    assert "timestamp" in data


def test_validate_plan_valid():
    """Test validating a valid orchestrator plan"""
    plan_data = {
        "project_name": "test-project",
        "language": "python",
        "framework": "fastapi",
        "tasks": [
            {
                "agent_type": "CodeArchitect",
                "description": "Design architecture",
                "dependencies": [],
                "estimated_duration": 30
            },
            {
                "agent_type": "BackendDeveloper",
                "description": "Implement API endpoints",
                "dependencies": ["CodeArchitect"],
                "estimated_duration": 60
            }
        ],
        "total_estimated_time": 90
    }

    response = client.post("/validate/plan", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0
    assert data["validated_data"] is not None
    assert data["validated_data"]["project_name"] == "test-project"
    assert data["validated_data"]["language"] == "python"


def test_validate_plan_invalid_missing_fields():
    """Test validating an invalid plan (missing required fields)"""
    plan_data = {
        "project_name": "test-project",
        # Missing language, framework, tasks, total_estimated_time
    }

    response = client.post("/validate/plan", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0
    assert data["validated_data"] is None


def test_validate_plan_invalid_language():
    """Test validating a plan with invalid language"""
    plan_data = {
        "project_name": "test-project",
        "language": "javascript",  # Invalid - should be typescript
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

    response = client.post("/validate/plan", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_validate_plan_invalid_agent_type():
    """Test validating a plan with invalid agent type"""
    plan_data = {
        "project_name": "test-project",
        "language": "python",
        "framework": "fastapi",
        "tasks": [
            {
                "agent_type": "InvalidAgent",  # Invalid agent type
                "description": "Do something",
                "dependencies": [],
                "estimated_duration": 30
            }
        ],
        "total_estimated_time": 30
    }

    response = client.post("/validate/plan", json=plan_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_validate_agent_output_valid():
    """Test validating valid agent output"""
    output_data = {
        "agent_type": "BackendDeveloper",
        "files_created": [
            {
                "path": "src/api/users.py",
                "content": "from fastapi import APIRouter\n\nrouter = APIRouter()",
                "description": "User API endpoints"
            }
        ],
        "files_modified": [],
        "warnings": ["Consider adding rate limiting"],
        "errors": [],
        "metadata": {
            "duration_seconds": 45,
            "model_used": "claude-3-5-sonnet"
        }
    }

    response = client.post("/validate/agent-output", json=output_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0
    assert data["validated_data"] is not None
    assert data["validated_data"]["agent_type"] == "BackendDeveloper"


def test_validate_agent_output_minimal():
    """Test validating agent output with minimal fields"""
    output_data = {
        "agent_type": "FrontendDeveloper",
        "files_created": [
            {
                "path": "src/components/Header.tsx",
                "content": "export const Header = () => <header>App</header>",
                "description": "Header component"
            }
        ]
    }

    response = client.post("/validate/agent-output", json=output_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0


def test_validate_agent_output_invalid():
    """Test validating invalid agent output (missing required fields)"""
    output_data = {
        "agent_type": "Tester",
        # Missing files_created
    }

    response = client.post("/validate/agent-output", json=output_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_validate_file_valid():
    """Test validating a valid generated file"""
    file_data = {
        "path": "src/main.py",
        "content": "print('Hello, World!')",
        "description": "Main entry point"
    }

    response = client.post("/validate/file", json=file_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert len(data["errors"]) == 0
    assert data["validated_data"]["path"] == "src/main.py"


def test_validate_file_invalid():
    """Test validating an invalid file (missing required fields)"""
    file_data = {
        "path": "src/main.py",
        # Missing content and description
    }

    response = client.post("/validate/file", json=file_data)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0


def test_validate_multiple_languages():
    """Test validating plans for all supported languages"""
    languages = ["typescript", "python", "go", "rust"]

    for language in languages:
        plan_data = {
            "project_name": f"test-{language}-project",
            "language": language,
            "framework": "test-framework",
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

        response = client.post("/validate/plan", json=plan_data)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True, f"Failed for language: {language}"


def test_validate_all_agent_types():
    """Test validating tasks for all agent types"""
    agent_types = [
        "CodeArchitect",
        "BackendDeveloper",
        "FrontendDeveloper",
        "Tester",
        "DevOpsEngineer"
    ]

    for agent_type in agent_types:
        plan_data = {
            "project_name": "test-project",
            "language": "python",
            "framework": "fastapi",
            "tasks": [
                {
                    "agent_type": agent_type,
                    "description": f"Task for {agent_type}",
                    "dependencies": [],
                    "estimated_duration": 30
                }
            ],
            "total_estimated_time": 30
        }

        response = client.post("/validate/plan", json=plan_data)
        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True, f"Failed for agent type: {agent_type}"
