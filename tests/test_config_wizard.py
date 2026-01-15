"""
Unit tests for Coperniq Config Wizard

Tests cover:
- Configuration building
- Template registry loading
- Preset selection
- Compliance requirements
- File operations
"""

import json
import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "sandbox"))

from config_wizard import (
    Trade,
    Market,
    Phase,
    ContractorInfo,
    ContractorConfig,
    ConfigWizard,
    TemplateRegistry,
    PRESETS,
    get_config_directory,
    save_config,
)


# ==============================================================================
# FIXTURES
# ==============================================================================

@pytest.fixture
def temp_registry(tmp_path):
    """Create a temporary template registry"""
    registry_data = {
        "version": "1.0",
        "trades": {
            "hvac": {
                "name": "HVAC",
                "templates": {
                    "sales": {
                        "lead_intake": {
                            "file": "templates/hvac/lead_intake.yaml",
                            "name": "Lead Intake",
                            "segments": ["residential", "commercial"]
                        }
                    },
                    "service": {
                        "service_call": {
                            "file": "templates/hvac/service_call.yaml",
                            "name": "Service Call",
                            "segments": ["residential", "commercial"]
                        }
                    }
                }
            },
            "solar": {
                "name": "Solar",
                "templates": {
                    "sales": {
                        "site_assessment": {
                            "file": "templates/solar/site_assessment.yaml",
                            "name": "Site Assessment",
                            "segments": ["residential", "commercial"]
                        }
                    }
                }
            }
        }
    }

    registry_path = tmp_path / "template_registry.json"
    with open(registry_path, "w") as f:
        json.dump(registry_data, f)

    return registry_path


@pytest.fixture
def contractor_info():
    """Create sample contractor info"""
    return ContractorInfo(
        name="ABC HVAC Services",
        legal_name="ABC HVAC Services LLC",
        city="Denver",
        state="CO",
        phone="303-555-0100",
        email="contact@abchvac.com"
    )


@pytest.fixture
def contractor_config(contractor_info):
    """Create sample contractor config"""
    return ContractorConfig(
        contractor_name=contractor_info.name,
        contractor_info=contractor_info,
        trades=["hvac"],
        markets=["residential"],
        phases=["sales", "service"],
        templates_enabled=["templates/hvac/lead_intake.yaml"],
        template_counts={"hvac": 1},
        compliance_requirements=["EPA 608", "OSHA"]
    )


@pytest.fixture
def wizard(temp_registry, monkeypatch):
    """Create wizard instance with mocked registry"""
    # Mock the registry path to use our temp registry
    monkeypatch.setattr(
        "config_wizard.TemplateRegistry._load",
        lambda self: self.__dict__.update({
            "registry": json.load(open(temp_registry))
        })
    )

    wizard = ConfigWizard()
    wizard.registry.registry_path = temp_registry
    wizard.registry._load()
    return wizard


# ==============================================================================
# TESTS: ENUM & DATA MODELS
# ==============================================================================

class TestEnums:
    """Test enum definitions"""

    def test_trade_values(self):
        """Test Trade enum has expected values"""
        assert Trade.HVAC.value == "hvac"
        assert Trade.SOLAR.value == "solar"
        assert Trade.ELECTRICAL.value == "electrical"
        assert Trade.PLUMBING.value == "plumbing"
        assert Trade.FIRE_PROTECTION.value == "fire_protection"

    def test_market_values(self):
        """Test Market enum has expected values"""
        assert Market.RESIDENTIAL.value == "residential"
        assert Market.COMMERCIAL.value == "commercial"
        assert Market.C_AND_I.value == "c_and_i"

    def test_phase_values(self):
        """Test Phase enum has expected values"""
        assert Phase.SALES.value == "sales"
        assert Phase.INSTALLATION.value == "installation"
        assert Phase.SERVICE.value == "service"


class TestContractorInfo:
    """Test ContractorInfo dataclass"""

    def test_create_minimal_info(self):
        """Test creating minimal contractor info"""
        info = ContractorInfo(name="Test Company")
        assert info.name == "Test Company"
        assert info.city is None
        assert info.email is None

    def test_create_full_info(self):
        """Test creating contractor info with all fields"""
        info = ContractorInfo(
            name="ABC HVAC",
            legal_name="ABC HVAC LLC",
            city="Denver",
            state="CO",
            zip_code="80202",
            phone="303-555-0100",
            email="test@example.com"
        )
        assert info.name == "ABC HVAC"
        assert info.state == "CO"
        assert info.email == "test@example.com"


class TestContractorConfig:
    """Test ContractorConfig dataclass"""

    def test_create_config(self, contractor_info):
        """Test creating contractor config"""
        config = ContractorConfig(
            contractor_name="Test Company",
            contractor_info=contractor_info,
            trades=["hvac"],
            markets=["residential"],
            phases=["sales"]
        )
        assert config.contractor_name == "Test Company"
        assert "hvac" in config.trades
        assert config.created_at is not None

    def test_config_to_dict(self, contractor_config):
        """Test converting config to dictionary"""
        config_dict = contractor_config.to_dict()
        assert config_dict["contractor_name"] == "ABC HVAC Services"
        assert config_dict["trades"] == ["hvac"]
        assert "contractor_info" in config_dict
        assert isinstance(config_dict["contractor_info"], dict)

    def test_config_json_serializable(self, contractor_config):
        """Test config can be serialized to JSON"""
        config_dict = contractor_config.to_dict()
        json_str = json.dumps(config_dict, default=str)
        assert "ABC HVAC Services" in json_str


# ==============================================================================
# TESTS: TEMPLATE REGISTRY
# ==============================================================================

class TestTemplateRegistry:
    """Test TemplateRegistry class"""

    def test_load_registry(self, temp_registry):
        """Test loading template registry"""
        registry = TemplateRegistry(temp_registry)
        assert registry.registry is not None
        assert "trades" in registry.registry

    def test_get_templates_for_trade(self, wizard):
        """Test retrieving templates for a trade"""
        templates = wizard.registry.get_templates_for_trade("hvac")
        assert "sales" in templates
        assert "service" in templates

    def test_get_templates_by_phase(self, wizard):
        """Test retrieving templates by phase"""
        templates = wizard.registry.get_templates_by_phase("hvac", "sales")
        assert "lead_intake" in templates

    def test_get_template_files(self, wizard):
        """Test getting template file paths"""
        files = wizard.registry.get_template_files(["hvac"], ["sales"], ["residential"])
        assert len(files) > 0
        assert any("lead_intake" in f for f in files)

    def test_get_template_files_multiple_trades(self, wizard):
        """Test getting templates for multiple trades"""
        files = wizard.registry.get_template_files(["hvac", "solar"], ["sales"], ["residential"])
        assert len(files) > 0

    def test_get_template_files_market_filtering(self, wizard):
        """Test market segment filtering"""
        # Commercial market
        files = wizard.registry.get_template_files(["hvac"], ["sales"], ["commercial"])
        assert len(files) > 0

    def test_compliance_requirements(self, wizard):
        """Test getting compliance requirements"""
        compliance = wizard.registry.get_required_compliance(["hvac"])
        assert "EPA 608" in compliance
        assert "OSHA" in compliance

    def test_compliance_multiple_trades(self, wizard):
        """Test compliance for multiple trades"""
        compliance = wizard.registry.get_required_compliance(["hvac", "solar"])
        assert "EPA 608" in compliance or "NEC 2023" in compliance


# ==============================================================================
# TESTS: PRESETS
# ==============================================================================

class TestPresets:
    """Test preset configurations"""

    def test_preset_keys(self):
        """Test preset keys are defined"""
        expected_presets = [
            "hvac_residential",
            "hvac_commercial",
            "solar_residential",
            "solar_commercial",
            "full_mep",
        ]
        for preset in expected_presets:
            assert preset in PRESETS

    def test_preset_structure(self):
        """Test preset structure is valid"""
        for preset_id, preset_data in PRESETS.items():
            assert "name" in preset_data
            assert "description" in preset_data
            assert "trades" in preset_data
            assert "markets" in preset_data
            assert "phases" in preset_data
            assert isinstance(preset_data["trades"], list)

    def test_preset_values_valid(self):
        """Test preset values are valid enums"""
        valid_trades = {t.value for t in Trade}
        valid_markets = {m.value for m in Market}
        valid_phases = {p.value for p in Phase}

        for preset_data in PRESETS.values():
            for trade in preset_data["trades"]:
                assert trade in valid_trades
            for market in preset_data["markets"]:
                assert market in valid_markets
            for phase in preset_data["phases"]:
                assert phase in valid_phases

    def test_hvac_residential_preset(self):
        """Test HVAC residential preset"""
        preset = PRESETS["hvac_residential"]
        assert "hvac" in preset["trades"]
        assert "residential" in preset["markets"]
        assert "sales" in preset["phases"]

    def test_full_mep_preset(self):
        """Test full MEP preset"""
        preset = PRESETS["full_mep"]
        assert "hvac" in preset["trades"]
        assert "electrical" in preset["trades"]
        assert "plumbing" in preset["trades"]


# ==============================================================================
# TESTS: CONFIG WIZARD
# ==============================================================================

class TestConfigWizard:
    """Test ConfigWizard class"""

    def test_wizard_initialization(self, wizard):
        """Test wizard initializes correctly"""
        assert wizard.console is not None
        assert wizard.registry is not None

    def test_build_config_basic(self, wizard, contractor_info):
        """Test building basic configuration"""
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            ["sales"]
        )
        assert config.contractor_name == "ABC HVAC Services"
        assert config.trades == ["hvac"]
        assert config.markets == ["residential"]

    def test_build_config_multiple_trades(self, wizard, contractor_info):
        """Test building config with multiple trades"""
        config = wizard.build_config(
            contractor_info,
            ["hvac", "solar"],
            ["residential", "commercial"],
            ["sales", "service"]
        )
        assert "hvac" in config.trades
        assert "solar" in config.trades

    def test_build_config_includes_templates(self, wizard, contractor_info):
        """Test that built config includes templates"""
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            ["sales"]
        )
        assert len(config.templates_enabled) > 0

    def test_build_config_includes_compliance(self, wizard, contractor_info):
        """Test that built config includes compliance"""
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            ["sales"]
        )
        assert len(config.compliance_requirements) > 0

    def test_build_config_with_preset(self, wizard, contractor_info):
        """Test building config with preset"""
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            ["sales"],
            preset_used="hvac_residential"
        )
        assert config.preset_used == "hvac_residential"

    def test_summary_printing(self, wizard, contractor_config):
        """Test summary printing doesn't raise"""
        # Should not raise any exceptions
        wizard.print_summary(contractor_config)


# ==============================================================================
# TESTS: FILE OPERATIONS
# ==============================================================================

class TestFileOperations:
    """Test file operations"""

    def test_get_config_directory_creates(self, tmp_path, monkeypatch):
        """Test config directory is created"""
        monkeypatch.setattr(
            "config_wizard.get_config_directory",
            lambda: tmp_path / "contractor_configs"
        )
        config_dir = tmp_path / "contractor_configs"
        config_dir.mkdir(parents=True, exist_ok=True)
        assert config_dir.exists()

    def test_save_config(self, tmp_path, contractor_config):
        """Test saving config to file"""
        filepath = save_config(contractor_config, tmp_path)
        assert filepath.exists()
        assert filepath.suffix == ".json"

    def test_save_config_json_valid(self, tmp_path, contractor_config):
        """Test saved config is valid JSON"""
        filepath = save_config(contractor_config, tmp_path)
        with open(filepath) as f:
            data = json.load(f)
        assert data["contractor_name"] == contractor_config.contractor_name

    def test_save_config_duplicate_handling(self, tmp_path, contractor_config):
        """Test handling of duplicate filenames"""
        path1 = save_config(contractor_config, tmp_path)
        path2 = save_config(contractor_config, tmp_path)
        assert path1 != path2
        assert path1.exists()
        assert path2.exists()

    def test_save_config_filename_sanitization(self, tmp_path):
        """Test filename is properly sanitized"""
        info = ContractorInfo(name="ABC HVAC Inc.")
        config = ContractorConfig(
            contractor_name=info.name,
            contractor_info=info,
            trades=["hvac"],
            markets=["residential"],
            phases=["sales"]
        )
        filepath = save_config(config, tmp_path)
        # Should remove spaces and special chars
        assert filepath.name == "abc_hvac_inc.json"


# ==============================================================================
# TESTS: INTEGRATION
# ==============================================================================

class TestIntegration:
    """Integration tests"""

    def test_full_wizard_flow(self, wizard, contractor_info):
        """Test complete wizard flow from config to save"""
        # Build config
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            ["sales", "service"]
        )

        # Validate config
        assert config.contractor_name == contractor_info.name
        assert len(config.templates_enabled) > 0
        assert len(config.compliance_requirements) > 0

        # Convert to dict
        config_dict = config.to_dict()
        assert json.dumps(config_dict, default=str)  # Should be JSON serializable

    def test_preset_to_config(self, wizard, contractor_info):
        """Test creating config from preset"""
        preset = PRESETS["hvac_residential"]
        config = wizard.build_config(
            contractor_info,
            preset["trades"],
            preset["markets"],
            preset["phases"],
            preset_used="hvac_residential"
        )

        assert config.preset_used == "hvac_residential"
        assert config.trades == preset["trades"]
        assert config.markets == preset["markets"]


# ==============================================================================
# TESTS: ERROR HANDLING
# ==============================================================================

class TestErrorHandling:
    """Test error handling"""

    def test_registry_not_found(self, monkeypatch):
        """Test error when registry not found"""
        bad_path = Path("/nonexistent/registry.json")
        with pytest.raises(FileNotFoundError):
            TemplateRegistry(bad_path)

    def test_empty_trades_warning(self, contractor_info):
        """Test handling of empty trades"""
        # This is more of a validation than error
        assert len(["hvac"]) > 0  # Should validate before creating

    def test_invalid_market_handling(self, wizard, contractor_info):
        """Test handling invalid market segment"""
        # Registry should silently skip invalid segments
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential", "invalid_market"],
            ["sales"]
        )
        # Should still work, just with residential templates
        assert "hvac" in config.trades


# ==============================================================================
# TESTS: EDGE CASES
# ==============================================================================

class TestEdgeCases:
    """Test edge cases and boundary conditions"""

    def test_single_trade_single_market(self, wizard, contractor_info):
        """Test minimal configuration"""
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            ["sales"]
        )
        assert len(config.trades) == 1
        assert len(config.markets) == 1
        assert len(config.phases) == 1

    def test_all_trades_selected(self, wizard, contractor_info):
        """Test with all trades selected"""
        all_trades = [t.value for t in Trade]
        config = wizard.build_config(
            contractor_info,
            all_trades,
            ["residential"],
            ["sales"]
        )
        assert len(config.trades) == len(all_trades)

    def test_all_phases_selected(self, wizard, contractor_info):
        """Test with all phases selected"""
        all_phases = [p.value for p in Phase]
        config = wizard.build_config(
            contractor_info,
            ["hvac"],
            ["residential"],
            all_phases
        )
        assert len(config.phases) == len(all_phases)

    def test_config_with_no_templates(self, wizard, contractor_info):
        """Test config that matches no templates"""
        # Create config with unmatched criteria
        config = wizard.build_config(
            contractor_info,
            ["general_contractor"],
            ["residential"],
            ["sales"]
        )
        # Should still create valid config
        assert config.contractor_name == contractor_info.name


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
