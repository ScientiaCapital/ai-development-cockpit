#!/usr/bin/env python3
"""
Config Wizard Examples

Demonstrates various usage patterns for the Coperniq Config Wizard.
Run these examples to see the wizard in action.
"""

from pathlib import Path
import sys
import json

# Add sandbox to path
sys.path.insert(0, str(Path(__file__).parent.parent / "sandbox"))

from config_wizard import (
    ConfigWizard,
    ContractorInfo,
    ContractorConfig,
    PRESETS,
    save_config,
    TemplateRegistry,
)


def example_1_simple_hvac_residential():
    """
    Example 1: Simple HVAC Residential Contractor

    Use case: A small HVAC company focused on residential service.
    """
    print("\n" + "=" * 70)
    print("Example 1: Simple HVAC Residential Contractor")
    print("=" * 70)

    info = ContractorInfo(
        name="Bob's HVAC Services",
        legal_name="Bob's HVAC Services LLC",
        city="Denver",
        state="CO",
        phone="303-555-0100",
        email="bob@bobshvac.com",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["hvac"],
        markets=["residential"],
        phases=["sales", "pre_job", "installation", "commissioning", "service", "service_plans"],
        preset_used="hvac_residential",
    )

    wizard.print_summary(config)

    # Show template details
    print(f"\nTotal templates selected: {len(config.templates_enabled)}")
    print("\nSelected templates:")
    for template in sorted(config.templates_enabled):
        print(f"  - {template}")

    return config


def example_2_multi_trade_mep():
    """
    Example 2: Multi-Trade MEP Contractor

    Use case: A commercial MEP contractor doing HVAC, electrical, and plumbing.
    """
    print("\n" + "=" * 70)
    print("Example 2: Multi-Trade MEP Contractor (Full Capabilities)")
    print("=" * 70)

    info = ContractorInfo(
        name="ABC Sheet Metal & Mechanical",
        legal_name="ABC Sheet Metal & Mechanical Inc.",
        city="Chicago",
        state="IL",
        phone="312-555-0200",
        email="contracts@abcsheetmetal.com",
        website="www.abcsheetmetal.com",
        license_number="IL-GC-98765",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["hvac", "electrical", "plumbing"],
        markets=["residential", "commercial"],
        phases=["sales", "pre_job", "installation", "commissioning", "service", "service_plans"],
        preset_used="full_mep",
    )

    wizard.print_summary(config)

    # Show breakdown by trade
    print("\nTemplate breakdown by trade:")
    for trade, count in sorted(config.template_counts.items()):
        print(f"  {trade:20} {count:3} templates")

    print(f"\nCompliance requirements:")
    for compliance in sorted(config.compliance_requirements):
        print(f"  - {compliance}")

    return config


def example_3_solar_commercial():
    """
    Example 3: Commercial Solar EPC

    Use case: A solar company doing utility-scale and commercial installations.
    """
    print("\n" + "=" * 70)
    print("Example 3: Commercial Solar EPC (Engineering, Procurement, Construction)")
    print("=" * 70)

    info = ContractorInfo(
        name="SunRay Energy Solutions",
        legal_name="SunRay Energy Solutions LLC",
        city="Phoenix",
        state="AZ",
        phone="602-555-0300",
        email="projects@sunrayenergy.com",
        website="www.sunrayenergy.com",
        license_number="AZ-SOLAR-54321",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["solar"],
        markets=["commercial", "utility"],
        phases=["sales", "pre_job", "installation", "commissioning"],
        preset_used="solar_commercial",
    )

    wizard.print_summary(config)
    return config


def example_4_energy_efficiency():
    """
    Example 4: Energy Efficiency Specialist

    Use case: Contractor combining HVAC and Solar for energy efficiency projects.
    """
    print("\n" + "=" * 70)
    print("Example 4: Energy Efficiency Specialist (HVAC + Solar)")
    print("=" * 70)

    info = ContractorInfo(
        name="GreenTech Solutions",
        legal_name="GreenTech Solutions Corp.",
        city="Boulder",
        state="CO",
        phone="303-555-0400",
        email="info@greentechco.com",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["hvac", "solar"],
        markets=["residential", "commercial"],
        phases=["sales", "installation", "commissioning", "service"],
        preset_used="energy_efficiency",
    )

    wizard.print_summary(config)
    return config


def example_5_service_only():
    """
    Example 5: Service and Maintenance Only

    Use case: Company focused on maintenance contracts and service calls.
    """
    print("\n" + "=" * 70)
    print("Example 5: Service & Maintenance Operations")
    print("=" * 70)

    info = ContractorInfo(
        name="24/7 Maintenance Services",
        legal_name="24/7 Maintenance Services LLC",
        city="Atlanta",
        state="GA",
        phone="404-555-0500",
        email="dispatch@247maintenance.com",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["hvac", "plumbing"],
        markets=["residential", "commercial"],
        phases=["service", "service_plans"],
        preset_used="om_service",
    )

    wizard.print_summary(config)
    return config


def example_6_fire_life_safety():
    """
    Example 6: Fire Protection & Life Safety

    Use case: Specialized contractor for fire protection and security systems.
    """
    print("\n" + "=" * 70)
    print("Example 6: Fire Protection & Life Safety")
    print("=" * 70)

    info = ContractorInfo(
        name="SecureGuard Fire Systems",
        legal_name="SecureGuard Fire Systems Inc.",
        city="Los Angeles",
        state="CA",
        phone="213-555-0600",
        email="projects@secureguard.com",
        license_number="CA-FP-11111",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["fire_protection", "low_voltage"],
        markets=["commercial", "c_and_i"],
        phases=["installation", "service"],
        preset_used="fire_life_safety",
    )

    wizard.print_summary(config)
    return config


def example_7_all_presets():
    """
    Example 7: Show all available presets

    Demonstrates all preset configurations and their compositions.
    """
    print("\n" + "=" * 70)
    print("Example 7: All Available Presets")
    print("=" * 70)

    print("\nAvailable Presets:\n")

    for preset_id, preset_data in PRESETS.items():
        print(f"  [{preset_id}]")
        print(f"    Name: {preset_data['name']}")
        print(f"    Description: {preset_data['description']}")
        print(f"    Trades: {', '.join(preset_data['trades'])}")
        print(f"    Markets: {', '.join(preset_data['markets'])}")
        print(f"    Phases: {', '.join(preset_data['phases'])}")
        print()


def example_8_template_registry():
    """
    Example 8: Template Registry Interaction

    Shows how to query the template registry directly.
    """
    print("\n" + "=" * 70)
    print("Example 8: Template Registry - Direct Queries")
    print("=" * 70)

    registry = TemplateRegistry()

    # Get templates for HVAC trade
    hvac_templates = registry.get_templates_for_trade("hvac")
    print(f"\nHVAC Trade has {len(hvac_templates)} phases:")
    for phase_name, phase_templates in hvac_templates.items():
        print(f"  - {phase_name}: {len(phase_templates)} templates")

    # Get templates for specific phase
    sales_templates = registry.get_templates_by_phase("hvac", "sales")
    print(f"\nHVAC Sales Phase templates ({len(sales_templates)}):")
    for template_id, template_data in sales_templates.items():
        if isinstance(template_data, dict) and "name" in template_data:
            print(f"  - {template_data['name']}")

    # Get compliance requirements
    hvac_compliance = registry.get_required_compliance(["hvac"])
    print(f"\nHVAC Compliance Requirements: {', '.join(hvac_compliance)}")

    multi_compliance = registry.get_required_compliance(["hvac", "solar", "electrical"])
    print(f"Multi-Trade Compliance: {', '.join(multi_compliance)}")


def example_9_programmatic_building():
    """
    Example 9: Build Config Programmatically

    Shows non-interactive config building for automation.
    """
    print("\n" + "=" * 70)
    print("Example 9: Programmatic Configuration Building")
    print("=" * 70)

    # Create from scratch
    info = ContractorInfo(
        name="Custom Config Example",
        city="San Francisco",
        state="CA",
    )

    wizard = ConfigWizard()

    # Build config with specific selections
    config = wizard.build_config(
        info,
        trades=["electrical", "low_voltage"],
        markets=["commercial"],
        phases=["installation", "service"],
    )

    print(f"\nProgrammatically built config for: {config.contractor_name}")
    print(f"  Trades: {', '.join(config.trades)}")
    print(f"  Markets: {', '.join(config.markets)}")
    print(f"  Phases: {', '.join(config.phases)}")
    print(f"  Templates: {len(config.templates_enabled)}")

    return config


def example_10_config_export():
    """
    Example 10: Config Export and Inspection

    Shows how to export and inspect the generated configuration.
    """
    print("\n" + "=" * 70)
    print("Example 10: Config Export and Inspection")
    print("=" * 70)

    info = ContractorInfo(
        name="Export Example",
        email="test@example.com",
    )

    wizard = ConfigWizard()
    config = wizard.build_config(
        info,
        trades=["hvac", "solar"],
        markets=["residential"],
        phases=["sales", "installation"],
    )

    # Export to dictionary
    config_dict = config.to_dict()

    print("\nConfiguration as Dictionary:")
    print(json.dumps(config_dict, indent=2, default=str))

    # Show file size estimate
    json_str = json.dumps(config_dict, default=str)
    print(f"\nJSON size: {len(json_str)} bytes")

    return config


def run_all_examples():
    """Run all examples in sequence"""
    print("\n" + "=" * 70)
    print("COPERNIQ CONFIG WIZARD - USAGE EXAMPLES")
    print("=" * 70)

    try:
        # Run all examples
        config1 = example_1_simple_hvac_residential()
        config2 = example_2_multi_trade_mep()
        config3 = example_3_solar_commercial()
        config4 = example_4_energy_efficiency()
        config5 = example_5_service_only()
        config6 = example_6_fire_life_safety()

        example_7_all_presets()
        example_8_template_registry()

        config9 = example_9_programmatic_building()
        config10 = example_10_config_export()

        # Summary
        print("\n" + "=" * 70)
        print("EXAMPLES COMPLETED SUCCESSFULLY")
        print("=" * 70)
        print("\nGenerated configurations:")
        print(f"  1. {config1.contractor_name}")
        print(f"  2. {config2.contractor_name}")
        print(f"  3. {config3.contractor_name}")
        print(f"  4. {config4.contractor_name}")
        print(f"  5. {config5.contractor_name}")
        print(f"  6. {config6.contractor_name}")
        print(f"  9. {config9.contractor_name}")
        print(f" 10. {config10.contractor_name}")

        print("\nAll examples ran successfully!")
        print("\nNext steps:")
        print("  1. Run the interactive wizard: python sandbox/config_wizard.py")
        print("  2. Use a preset: python sandbox/config_wizard.py --preset hvac_residential")
        print("  3. See all presets: python sandbox/config_wizard.py --show-presets")

    except Exception as e:
        print(f"\nError running examples: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    run_all_examples()
