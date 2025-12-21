"""
Integration tests for MEP Templates API

Run: pytest sandbox/templates_api_test.py -v
Or: python -m pytest sandbox/templates_api_test.py -v --cov=sandbox
"""

import pytest
from fastapi.testclient import TestClient
from sandbox.templates_api import app, TemplateLoader


@pytest.fixture(scope="session")
def client():
    """Create FastAPI test client"""
    return TestClient(app)


@pytest.fixture(scope="session")
def loader():
    """Create template loader"""
    return TemplateLoader()


# ============================================================================
# HEALTH CHECK TESTS
# ============================================================================


def test_health_check(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["templates_loaded"] == 60
    assert data["trades_available"] == 12
    assert "timestamp" in data


# ============================================================================
# LIST TEMPLATES TESTS
# ============================================================================


def test_list_all_templates(client):
    """Test listing all templates"""
    response = client.get("/templates")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 60
    assert len(data["templates"]) == 60
    assert all("trade" in t for t in data["templates"])
    assert all("name" in t for t in data["templates"])
    assert all("file" in t for t in data["templates"])


def test_list_templates_by_trade(client):
    """Test filtering templates by trade"""
    response = client.get("/templates?trade=hvac")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 10
    assert all(t["trade"] == "hvac" for t in data["templates"])


def test_list_templates_by_phase(client):
    """Test filtering templates by phase"""
    response = client.get("/templates?phase=sales")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert all(t["phase"] == "sales" for t in data["templates"])


def test_list_templates_by_trade_and_phase(client):
    """Test filtering templates by both trade and phase"""
    response = client.get("/templates?trade=hvac&phase=sales")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert all(t["trade"] == "hvac" and t["phase"] == "sales" for t in data["templates"])


def test_list_templates_empty_filter(client):
    """Test filtering with no results"""
    response = client.get("/templates?trade=nonexistent")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["templates"] == []


# ============================================================================
# GET TEMPLATES BY TRADE TESTS
# ============================================================================


def test_get_templates_hvac(client):
    """Test getting HVAC templates"""
    response = client.get("/templates/hvac")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "hvac"
    assert data["total"] == 10
    assert len(data["templates"]) == 10


def test_get_templates_solar(client):
    """Test getting Solar templates"""
    response = client.get("/templates/solar")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "solar"
    assert data["total"] == 10


def test_get_templates_plumbing(client):
    """Test getting Plumbing templates"""
    response = client.get("/templates/plumbing")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "plumbing"
    assert data["total"] == 6


def test_get_templates_electrical(client):
    """Test getting Electrical templates"""
    response = client.get("/templates/electrical")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "electrical"
    assert data["total"] == 6


def test_get_templates_fire_protection(client):
    """Test getting Fire Protection templates"""
    response = client.get("/templates/fire_protection")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "fire_protection"
    assert data["total"] == 5


def test_get_templates_invalid_trade(client):
    """Test getting templates for non-existent trade"""
    response = client.get("/templates/invalid_trade")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "not found" in data["error"].lower()


# ============================================================================
# GET TEMPLATE DETAILS TESTS
# ============================================================================


def test_get_template_hvac_lead_intake(client):
    """Test getting HVAC Lead Intake template details"""
    response = client.get("/templates/hvac/lead_intake")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "hvac"
    assert data["file"] == "lead_intake.yaml"
    assert "name" in data
    assert "description" in data
    assert "fields_count" in data
    assert "groups_count" in data
    assert "groups" in data
    assert len(data["groups"]) == data["groups_count"]


def test_get_template_has_fields(client):
    """Test that template has proper field structure"""
    response = client.get("/templates/hvac/lead_intake")
    assert response.status_code == 200
    data = response.json()

    # Check group structure
    for group in data["groups"]:
        assert "name" in group
        assert "order" in group
        assert "fields" in group
        assert isinstance(group["fields"], list)

        # Check field structure
        for field in group["fields"]:
            assert "name" in field
            assert "type" in field
            assert "required" in field
            assert field["type"] in [
                "Text",
                "Numeric",
                "Single select",
                "Multiple select",
                "File",
                "Group",
            ]


def test_get_template_solar_panel_install(client):
    """Test getting Solar Panel Install template"""
    response = client.get("/templates/solar/panel_install")
    assert response.status_code == 200
    data = response.json()
    assert data["trade"] == "solar"
    assert data["fields_count"] > 0


def test_get_template_not_found(client):
    """Test getting non-existent template"""
    response = client.get("/templates/hvac/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data


# ============================================================================
# GET TRADES TESTS
# ============================================================================


def test_get_all_trades(client):
    """Test getting all trades with statistics"""
    response = client.get("/trades")
    assert response.status_code == 200
    data = response.json()
    assert data["total_templates"] == 60
    assert len(data["trades"]) == 12

    # Check trades list
    trade_names = [t["trade"] for t in data["trades"]]
    expected_trades = [
        "controls",
        "electrical",
        "fire_protection",
        "general_contractor",
        "hvac",
        "low_voltage",
        "plumbing",
        "roofing",
        "service_plans",
        "solar",
        "tud_market",
        "work_orders",
    ]
    assert sorted(trade_names) == sorted(expected_trades)


def test_get_trades_has_statistics(client):
    """Test that trade statistics are correct"""
    response = client.get("/trades")
    assert response.status_code == 200
    data = response.json()

    for trade in data["trades"]:
        assert "trade" in trade
        assert "count" in trade
        assert "phases" in trade
        assert trade["count"] > 0
        assert isinstance(trade["phases"], dict)


def test_trades_total_matches_sum(client):
    """Test that total templates equals sum of all trade counts"""
    response = client.get("/trades")
    assert response.status_code == 200
    data = response.json()

    total_from_trades = sum(t["count"] for t in data["trades"])
    assert total_from_trades == data["total_templates"]
    assert total_from_trades == 60


# ============================================================================
# SEED TEMPLATES TESTS
# ============================================================================


def test_seed_templates(client):
    """Test seed templates endpoint"""
    response = client.post("/templates/seed")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "seeding_initiated"
    assert data["templates_count"] == 60
    assert data["trades_count"] == 12
    assert "timestamp" in data


# ============================================================================
# RESPONSE FORMAT TESTS
# ============================================================================


def test_template_list_response_format(client):
    """Test template list response has correct structure"""
    response = client.get("/templates/hvac")
    assert response.status_code == 200
    data = response.json()

    # Check required fields in each template
    for template in data["templates"]:
        required_fields = [
            "trade",
            "name",
            "file",
            "description",
            "fields_count",
            "groups_count",
        ]
        for field in required_fields:
            assert field in template, f"Missing field: {field}"


def test_template_detail_response_format(client):
    """Test template detail response has correct structure"""
    response = client.get("/templates/hvac/lead_intake")
    assert response.status_code == 200
    data = response.json()

    # Check required fields
    required_fields = [
        "trade",
        "name",
        "file",
        "description",
        "fields_count",
        "groups_count",
        "groups",
        "metadata",
    ]
    for field in required_fields:
        assert field in data, f"Missing field: {field}"


# ============================================================================
# LOADER TESTS
# ============================================================================


def test_loader_loads_all_templates(loader):
    """Test that loader loads all 60 templates"""
    templates = loader.get_all_templates()
    assert len(templates) == 60


def test_loader_organizes_by_trade(loader):
    """Test that loader correctly organizes templates by trade"""
    trades = loader.get_trades()
    assert len(trades) == 12
    assert trades["hvac"] == 10
    assert trades["solar"] == 10
    assert trades["plumbing"] == 6
    assert trades["electrical"] == 6


def test_loader_filter_by_trade(loader):
    """Test loader trade filtering"""
    hvac_templates = loader.get_templates_by_trade("hvac")
    assert len(hvac_templates) == 10
    assert all(t.trade == "hvac" for t in hvac_templates)


def test_loader_filter_by_phase(loader):
    """Test loader phase filtering"""
    sales_templates = loader.get_templates_by_phase("sales")
    assert len(sales_templates) > 0
    assert all(t.phase == "sales" for t in sales_templates)


def test_loader_get_by_trade_and_name(loader):
    """Test loader get by trade and name"""
    template = loader.get_template_by_trade_and_name("hvac", "lead_intake")
    assert template is not None
    assert template.trade == "hvac"
    assert "lead_intake" in template.file


def test_loader_returns_none_for_invalid(loader):
    """Test loader returns None for invalid template"""
    template = loader.get_template_by_trade_and_name("hvac", "nonexistent")
    assert template is None


def test_loader_statistics(loader):
    """Test loader statistics"""
    stats = loader.get_stats()
    assert stats["total_templates"] == 60
    assert stats["total_trades"] == 12


# ============================================================================
# INTEGRATION TESTS
# ============================================================================


def test_template_details_match_list(client, loader):
    """Test that template details match list summary"""
    # Get from list
    list_response = client.get("/templates/hvac")
    list_data = list_response.json()
    first_template_from_list = list_data["templates"][0]

    # Get details
    template_name = first_template_from_list["file"].replace(".yaml", "")
    detail_response = client.get(f"/templates/hvac/{template_name}")
    detail_data = detail_response.json()

    # Compare
    assert first_template_from_list["name"] == detail_data["name"]
    assert first_template_from_list["trade"] == detail_data["trade"]
    assert first_template_from_list["fields_count"] == detail_data["fields_count"]
    assert first_template_from_list["groups_count"] == detail_data["groups_count"]


def test_all_templates_accessible(client, loader):
    """Test that all templates are accessible via API"""
    all_templates = loader.get_all_templates()

    for template in all_templates[:10]:  # Test first 10
        response = client.get(
            f"/templates/{template.trade}/{template.file.replace('.yaml', '')}"
        )
        assert response.status_code == 200


# ============================================================================
# ERROR HANDLING TESTS
# ============================================================================


def test_invalid_trade_error_includes_suggestions(client):
    """Test that invalid trade error includes available trades"""
    response = client.get("/templates/invalid")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "Available trades:" in data["error"]


def test_template_not_found_error(client):
    """Test template not found error response"""
    response = client.get("/templates/hvac/nonexistent")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert "code" in data
    assert data["code"] == 404
    assert "timestamp" in data


# ============================================================================
# EDGE CASES
# ============================================================================


def test_filter_with_no_results_returns_empty_list(client):
    """Test filtering with no matching templates returns empty list"""
    response = client.get("/templates?phase=future_phase")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["templates"] == []


def test_case_sensitive_trade_names(client):
    """Test that trade names are case-sensitive"""
    # Lowercase should work
    response = client.get("/templates/hvac")
    assert response.status_code == 200

    # Uppercase should fail
    response = client.get("/templates/HVAC")
    assert response.status_code == 404


def test_template_name_with_yaml_extension(client):
    """Test template endpoint handles names with/without .yaml"""
    # Without extension should work
    response = client.get("/templates/hvac/lead_intake")
    assert response.status_code == 200

    # With extension should also work (loader handles it)
    response = client.get("/templates/hvac/lead_intake.yaml")
    assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
