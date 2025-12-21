#!/usr/bin/env python3
"""
Coperniq MEP Contractor Config Wizard

Interactive CLI tool for contractors to select trades, templates, and configurations.
Generates contractor config JSON with selected template dependencies.

Usage:
    python config_wizard.py                    # Interactive mode
    python config_wizard.py --preset hvac_residential  # Use preset
    python config_wizard.py --name "ABC HVAC"          # Custom name
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set, Optional, Any
from dataclasses import dataclass, asdict, field
from enum import Enum

import click
import yaml
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.columns import Columns


# ==============================================================================
# DATA MODELS & ENUMS
# ==============================================================================

class Trade(str, Enum):
    """Available MEP trades"""
    HVAC = "hvac"
    SOLAR = "solar"
    ELECTRICAL = "electrical"
    PLUMBING = "plumbing"
    FIRE_PROTECTION = "fire_protection"
    CONTROLS = "controls"
    LOW_VOLTAGE = "low_voltage"
    ROOFING = "roofing"
    GENERAL_CONTRACTOR = "general_contractor"


class Market(str, Enum):
    """Target market segments"""
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    C_AND_I = "c_and_i"
    UTILITY = "utility"
    MULTI_FAMILY = "multi_family"


class Phase(str, Enum):
    """Business lifecycle phases"""
    SALES = "sales"
    PRE_JOB = "pre_job"
    INSTALLATION = "installation"
    COMMISSIONING = "commissioning"
    SERVICE = "service"
    SERVICE_PLANS = "service_plans"
    CLOSEOUT = "closeout"


@dataclass
class ContractorInfo:
    """Contractor company information"""
    name: str
    legal_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    license_number: Optional[str] = None
    logo_url: Optional[str] = None


@dataclass
class ContractorConfig:
    """Complete contractor configuration"""
    contractor_name: str
    contractor_info: ContractorInfo
    trades: List[str]
    markets: List[str]
    phases: List[str]
    templates_enabled: List[str] = field(default_factory=list)
    template_counts: Dict[str, int] = field(default_factory=dict)
    certifications: Dict[str, List[str]] = field(default_factory=dict)
    compliance_requirements: List[str] = field(default_factory=list)
    preset_used: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())
    notes: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data["contractor_info"] = asdict(data["contractor_info"])
        return data


# ==============================================================================
# PRESET CONFIGURATIONS
# ==============================================================================

PRESETS: Dict[str, Dict[str, Any]] = {
    "hvac_residential": {
        "name": "HVAC - Residential Focus",
        "description": "Full residential HVAC service and replacement",
        "trades": [Trade.HVAC.value],
        "markets": [Market.RESIDENTIAL.value],
        "phases": [
            Phase.SALES.value,
            Phase.PRE_JOB.value,
            Phase.INSTALLATION.value,
            Phase.COMMISSIONING.value,
            Phase.SERVICE.value,
            Phase.SERVICE_PLANS.value,
        ],
    },
    "hvac_commercial": {
        "name": "HVAC - Commercial Focus",
        "description": "Commercial HVAC service and installation",
        "trades": [Trade.HVAC.value],
        "markets": [Market.COMMERCIAL.value, Market.C_AND_I.value],
        "phases": [
            Phase.SALES.value,
            Phase.PRE_JOB.value,
            Phase.INSTALLATION.value,
            Phase.COMMISSIONING.value,
            Phase.SERVICE.value,
        ],
    },
    "solar_residential": {
        "name": "Solar - Residential",
        "description": "Residential solar installation and service",
        "trades": [Trade.SOLAR.value],
        "markets": [Market.RESIDENTIAL.value],
        "phases": [Phase.SALES.value, Phase.INSTALLATION.value, Phase.COMMISSIONING.value],
    },
    "solar_commercial": {
        "name": "Solar - Commercial/Industrial",
        "description": "Commercial and utility-scale solar",
        "trades": [Trade.SOLAR.value],
        "markets": [Market.COMMERCIAL.value, Market.UTILITY.value],
        "phases": [
            Phase.SALES.value,
            Phase.PRE_JOB.value,
            Phase.INSTALLATION.value,
            Phase.COMMISSIONING.value,
        ],
    },
    "full_mep": {
        "name": "Full MEP Contractor",
        "description": "Multi-trade MEP contractor (HVAC + Electrical + Plumbing)",
        "trades": [Trade.HVAC.value, Trade.ELECTRICAL.value, Trade.PLUMBING.value],
        "markets": [Market.RESIDENTIAL.value, Market.COMMERCIAL.value],
        "phases": [
            Phase.SALES.value,
            Phase.PRE_JOB.value,
            Phase.INSTALLATION.value,
            Phase.COMMISSIONING.value,
            Phase.SERVICE.value,
            Phase.SERVICE_PLANS.value,
        ],
    },
    "fire_life_safety": {
        "name": "Fire & Life Safety",
        "description": "Fire protection, sprinklers, alarms",
        "trades": [Trade.FIRE_PROTECTION.value, Trade.LOW_VOLTAGE.value],
        "markets": [Market.COMMERCIAL.value, Market.C_AND_I.value],
        "phases": [Phase.INSTALLATION.value, Phase.SERVICE.value],
    },
    "energy_efficiency": {
        "name": "Energy Efficiency Specialist",
        "description": "HVAC + Solar for energy-focused contractors",
        "trades": [Trade.HVAC.value, Trade.SOLAR.value],
        "markets": [Market.RESIDENTIAL.value, Market.COMMERCIAL.value],
        "phases": [
            Phase.SALES.value,
            Phase.INSTALLATION.value,
            Phase.COMMISSIONING.value,
            Phase.SERVICE.value,
        ],
    },
    "om_service": {
        "name": "Operations & Maintenance Service",
        "description": "Service calls, maintenance, inspections",
        "trades": [Trade.HVAC.value, Trade.PLUMBING.value, Trade.ELECTRICAL.value],
        "markets": [Market.RESIDENTIAL.value, Market.COMMERCIAL.value],
        "phases": [Phase.SERVICE.value, Phase.SERVICE_PLANS.value],
    },
}

# Trade descriptions for help text
TRADE_DESCRIPTIONS: Dict[str, str] = {
    "hvac": "Heating, Ventilation, Air Conditioning - sizing, installation, service",
    "solar": "Solar PV installation, design, commissioning",
    "electrical": "Electrical services, panels, upgrades, EV charging",
    "plumbing": "Plumbing services, backflow testing, water heaters",
    "fire_protection": "Fire sprinklers, alarms, extinguishers (NFPA compliant)",
    "controls": "Building automation, IoT monitoring, HVAC controls",
    "low_voltage": "Data/security cabling, access control, network",
    "roofing": "Roof inspection and installation",
    "general_contractor": "General contracting, project coordination",
}

MARKET_DESCRIPTIONS: Dict[str, str] = {
    "residential": "Single family homes, townhomes, residential buildings",
    "commercial": "Office, retail, schools, medical facilities, hospitality",
    "c_and_i": "Industrial, warehouses, data centers, manufacturing",
    "utility": "Utility-scale solar and renewable energy projects",
    "multi_family": "Multi-family residential (2+ units)",
}

PHASE_DESCRIPTIONS: Dict[str, str] = {
    "sales": "Lead intake, site surveys, proposals, estimating",
    "pre_job": "Job planning, permits, material ordering, scheduling",
    "installation": "Equipment installation, checklists, daily logs",
    "commissioning": "System startup, testing, verification, handoff",
    "service": "Service calls, maintenance, inspections, repairs",
    "service_plans": "Recurring maintenance contracts and agreements",
    "closeout": "Final inspection, warranty, customer sign-off",
}


# ==============================================================================
# TEMPLATE REGISTRY LOADER
# ==============================================================================

class TemplateRegistry:
    """Load and manage template registry"""

    def __init__(self, registry_path: Optional[Path] = None):
        """
        Initialize template registry

        Args:
            registry_path: Path to template_registry.json. Defaults to config/ directory.
        """
        if registry_path is None:
            # Assume we're in sandbox/, registry is in config/
            registry_path = Path(__file__).parent.parent / "config" / "template_registry.json"

        self.registry_path = registry_path
        self.registry: Dict[str, Any] = {}
        self._load()

    def _load(self) -> None:
        """Load template registry from JSON file"""
        if not self.registry_path.exists():
            raise FileNotFoundError(f"Template registry not found: {self.registry_path}")

        with open(self.registry_path, "r") as f:
            self.registry = json.load(f)

    def get_templates_for_trade(self, trade: str) -> Dict[str, Any]:
        """Get all templates for a specific trade"""
        if "trades" not in self.registry:
            return {}
        trade_data = self.registry["trades"].get(trade, {})
        return trade_data.get("templates", {})

    def get_templates_by_phase(self, trade: str, phase: str) -> Dict[str, Any]:
        """Get templates for a specific trade and phase"""
        templates = self.get_templates_for_trade(trade)
        return templates.get(phase, {})

    def get_template_files(
        self, trades: List[str], phases: List[str], markets: List[str]
    ) -> List[str]:
        """
        Get all template files matching trades, phases, and markets

        Args:
            trades: List of trade names
            phases: List of phase names
            markets: List of market segments

        Returns:
            List of template file paths
        """
        template_files = []
        template_set = set()  # Avoid duplicates

        for trade in trades:
            trade_templates = self.get_templates_for_trade(trade)
            for phase_key, phase_templates in trade_templates.items():
                for template_id, template_data in phase_templates.items():
                    if isinstance(template_data, dict) and "file" in template_data:
                        template_segments = template_data.get("segments", [])
                        # Include if no segments specified or if market match
                        if not template_segments or any(m in template_segments for m in markets):
                            file_path = template_data["file"]
                            if file_path not in template_set:
                                template_files.append(file_path)
                                template_set.add(file_path)

        return sorted(template_files)

    def get_required_compliance(self, trades: List[str]) -> List[str]:
        """Get required compliance standards based on trades"""
        compliance = set()

        compliance_map = {
            "hvac": ["EPA 608", "OSHA"],
            "solar": ["NEC 2023", "OSHA"],
            "electrical": ["NEC 2023", "OSHA"],
            "plumbing": ["OSHA", "Local Code"],
            "fire_protection": ["NFPA 25", "NFPA 72", "OSHA"],
            "low_voltage": ["TIA-568", "OSHA"],
        }

        for trade in trades:
            if trade in compliance_map:
                compliance.update(compliance_map[trade])

        return sorted(list(compliance))


# ==============================================================================
# INTERACTIVE WIZARD
# ==============================================================================

class ConfigWizard:
    """Interactive configuration wizard for contractor onboarding"""

    def __init__(self, console: Optional[Console] = None):
        """
        Initialize the wizard

        Args:
            console: Optional Rich Console instance
        """
        self.console = console or Console()
        self.registry = TemplateRegistry()

    def print_header(self) -> None:
        """Print wizard header"""
        header = Panel(
            "[bold cyan]Coperniq MEP Contractor Config Wizard[/bold cyan]\n"
            "[dim]Set up templates and workflows for your business[/dim]",
            border_style="cyan",
            padding=(1, 2),
        )
        self.console.print(header)

    def print_presets(self) -> None:
        """Display available presets"""
        table = Table(title="Quick Setup Presets", show_header=True, header_style="bold magenta")
        table.add_column("Preset ID", style="cyan")
        table.add_column("Name", style="green")
        table.add_column("Description", style="dim")

        for preset_id, preset_data in PRESETS.items():
            table.add_row(preset_id, preset_data["name"], preset_data["description"])

        self.console.print(table)
        self.console.print()

    def get_company_info(self) -> ContractorInfo:
        """Interactively collect company information"""
        self.console.print(Panel("[bold]Company Information[/bold]", border_style="blue"))

        name = Prompt.ask("  Company Name", default="")
        if not name:
            self.console.print("[red]Company name is required[/red]")
            sys.exit(1)

        legal_name = Prompt.ask("  Legal Company Name (optional)", default=name)
        address = Prompt.ask("  Address (optional)", default="")
        city = Prompt.ask("  City (optional)", default="")
        state = Prompt.ask("  State (optional)", default="")
        zip_code = Prompt.ask("  ZIP Code (optional)", default="")
        phone = Prompt.ask("  Phone (optional)", default="")
        email = Prompt.ask("  Email (optional)", default="")
        website = Prompt.ask("  Website (optional)", default="")
        license_number = Prompt.ask("  License Number (optional)", default="")

        self.console.print()
        return ContractorInfo(
            name=name,
            legal_name=legal_name,
            address=address if address else None,
            city=city if city else None,
            state=state if state else None,
            zip_code=zip_code if zip_code else None,
            phone=phone if phone else None,
            email=email if email else None,
            website=website if website else None,
            license_number=license_number if license_number else None,
        )

    def select_trades(self) -> List[str]:
        """Interactively select trades"""
        self.console.print(Panel("[bold]Select Your Trades[/bold]", border_style="blue"))
        self.console.print("[dim]Check all that apply[/dim]\n")

        selected = []
        for trade in Trade:
            description = TRADE_DESCRIPTIONS.get(trade.value, "")
            selected_trade = Confirm.ask(
                f"  {trade.value:20} {description}",
                default=False,
                console=self.console,
            )
            if selected_trade:
                selected.append(trade.value)

        if not selected:
            self.console.print("[red]At least one trade is required[/red]")
            return self.select_trades()

        self.console.print()
        return selected

    def select_markets(self) -> List[str]:
        """Interactively select market segments"""
        self.console.print(Panel("[bold]Select Target Markets[/bold]", border_style="blue"))
        self.console.print("[dim]Where do you do business?[/dim]\n")

        selected = []
        for market in Market:
            description = MARKET_DESCRIPTIONS.get(market.value, "")
            selected_market = Confirm.ask(
                f"  {market.value:20} {description}",
                default=False,
                console=self.console,
            )
            if selected_market:
                selected.append(market.value)

        if not selected:
            self.console.print("[red]At least one market is required[/red]")
            return self.select_markets()

        self.console.print()
        return selected

    def select_phases(self) -> List[str]:
        """Interactively select business phases"""
        self.console.print(Panel("[bold]Select Business Phases[/bold]", border_style="blue"))
        self.console.print("[dim]Which phases apply to your business?[/dim]\n")

        selected = []
        for phase in Phase:
            description = PHASE_DESCRIPTIONS.get(phase.value, "")
            selected_phase = Confirm.ask(
                f"  {phase.value:20} {description}",
                default=False,
                console=self.console,
            )
            if selected_phase:
                selected.append(phase.value)

        if not selected:
            self.console.print("[red]At least one phase is required[/red]")
            return self.select_phases()

        self.console.print()
        return selected

    def use_preset(self) -> Optional[str]:
        """Ask if user wants to use a preset"""
        use_preset = Confirm.ask(
            "Use a quick setup preset? (answering 'no' goes to manual selection)",
            default=True,
            console=self.console,
        )

        if not use_preset:
            return None

        self.console.print()
        self.print_presets()

        preset_id = Prompt.ask(
            "Enter preset ID (or press Enter to skip)",
            default="",
            console=self.console,
        )

        if preset_id and preset_id in PRESETS:
            self.console.print(f"[green]✓ Using preset: {PRESETS[preset_id]['name']}[/green]\n")
            return preset_id

        if preset_id:
            self.console.print(f"[red]✗ Unknown preset: {preset_id}[/red]\n")
            return self.use_preset()

        return None

    def build_config(
        self,
        info: ContractorInfo,
        trades: List[str],
        markets: List[str],
        phases: List[str],
        preset_used: Optional[str] = None,
    ) -> ContractorConfig:
        """
        Build complete contractor configuration

        Args:
            info: Contractor company info
            trades: Selected trades
            markets: Selected markets
            phases: Selected phases
            preset_used: Name of preset if applicable

        Returns:
            Completed ContractorConfig
        """
        # Get templates for selected configuration
        template_files = self.registry.get_templates_by_phase(
            ",".join(trades), ",".join(phases)
        )

        # Better approach: collect templates from registry
        all_templates = []
        template_counts = {}

        for trade in trades:
            trade_templates = self.registry.get_templates_for_trade(trade)
            trade_count = 0
            for phase_key, phase_templates in trade_templates.items():
                if phase_key in phases:
                    for template_id, template_data in phase_templates.items():
                        if isinstance(template_data, dict) and "file" in template_data:
                            template_segments = template_data.get("segments", [])
                            # Include if segments match markets
                            if not template_segments or any(m in template_segments for m in markets):
                                all_templates.append(template_data["file"])
                                trade_count += 1
            if trade_count > 0:
                template_counts[trade] = trade_count

        # Get compliance requirements
        compliance = self.registry.get_required_compliance(trades)

        return ContractorConfig(
            contractor_name=info.name,
            contractor_info=info,
            trades=trades,
            markets=markets,
            phases=phases,
            templates_enabled=list(set(all_templates)),  # Remove duplicates
            template_counts=template_counts,
            compliance_requirements=compliance,
            preset_used=preset_used,
        )

    def run_interactive(self) -> ContractorConfig:
        """Run the full interactive wizard"""
        self.print_header()

        # Step 1: Preset or manual?
        preset_id = self.use_preset()

        if preset_id and preset_id in PRESETS:
            # Use preset
            preset = PRESETS[preset_id]
            info = self.get_company_info()
            config = self.build_config(
                info,
                preset["trades"],
                preset["markets"],
                preset["phases"],
                preset_used=preset_id,
            )
            return config
        else:
            # Manual selection
            info = self.get_company_info()
            trades = self.select_trades()
            markets = self.select_markets()
            phases = self.select_phases()

            config = self.build_config(info, trades, markets, phases)
            return config

    def print_summary(self, config: ContractorConfig) -> None:
        """Print configuration summary"""
        self.console.print(
            Panel("[bold green]Configuration Summary[/bold green]", border_style="green")
        )

        # Company info
        info = config.contractor_info
        company_table = Table(show_header=False, box=None)
        company_table.add_row("[bold]Company:[/bold]", info.name)
        if info.legal_name and info.legal_name != info.name:
            company_table.add_row("[bold]Legal Name:[/bold]", info.legal_name)
        if info.phone:
            company_table.add_row("[bold]Phone:[/bold]", info.phone)
        if info.email:
            company_table.add_row("[bold]Email:[/bold]", info.email)
        self.console.print(company_table)

        # Selections
        self.console.print(
            f"\n[bold]Trades:[/bold] {', '.join(config.trades)}\n"
            f"[bold]Markets:[/bold] {', '.join(config.markets)}\n"
            f"[bold]Phases:[/bold] {', '.join(config.phases)}\n"
        )

        # Templates
        total_templates = len(config.templates_enabled)
        self.console.print(f"[bold]Templates:[/bold] {total_templates} templates selected")
        if config.template_counts:
            for trade, count in sorted(config.template_counts.items()):
                self.console.print(f"  • {trade:20} {count} templates")

        # Compliance
        if config.compliance_requirements:
            self.console.print(f"\n[bold]Compliance:[/bold] {', '.join(config.compliance_requirements)}")

        # Preset
        if config.preset_used:
            preset = PRESETS[config.preset_used]
            self.console.print(f"\n[dim]Preset:[/dim] {preset['name']}")

        self.console.print()


# ==============================================================================
# FILE OPERATIONS
# ==============================================================================

def get_config_directory() -> Path:
    """Get or create contractor configs directory"""
    config_dir = Path(__file__).parent.parent / "config" / "contractor_configs"
    config_dir.mkdir(parents=True, exist_ok=True)
    return config_dir


def save_config(config: ContractorConfig, directory: Optional[Path] = None) -> Path:
    """
    Save contractor config to JSON file

    Args:
        config: ContractorConfig to save
        directory: Directory to save to. Defaults to config/contractor_configs/

    Returns:
        Path to saved file
    """
    if directory is None:
        directory = get_config_directory()

    # Generate filename from company name
    filename = config.contractor_name.lower().replace(" ", "_").replace(".", "") + ".json"
    filepath = directory / filename

    # Handle duplicates
    counter = 1
    base_path = filepath
    while filepath.exists():
        name, ext = base_path.stem, base_path.suffix
        filepath = base_path.parent / f"{name}_{counter}{ext}"
        counter += 1

    with open(filepath, "w") as f:
        json.dump(config.to_dict(), f, indent=2, default=str)

    return filepath


# ==============================================================================
# CLI INTERFACE
# ==============================================================================

@click.command()
@click.option(
    "--preset",
    type=click.Choice(list(PRESETS.keys())),
    help="Use a quick setup preset",
)
@click.option(
    "--name",
    type=str,
    help="Contractor name (skips interactive prompts)",
)
@click.option(
    "--trades",
    type=str,
    help="Comma-separated list of trades (e.g., hvac,solar,electrical)",
)
@click.option(
    "--markets",
    type=str,
    help="Comma-separated list of markets (e.g., residential,commercial)",
)
@click.option(
    "--phases",
    type=str,
    help="Comma-separated list of phases (e.g., sales,installation,service)",
)
@click.option(
    "--output",
    type=click.Path(),
    help="Output directory for config file",
)
@click.option(
    "--interactive/--no-interactive",
    default=True,
    help="Run in interactive mode (default)",
)
@click.option(
    "--show-presets",
    is_flag=True,
    help="Show available presets and exit",
)
def main(
    preset: Optional[str],
    name: Optional[str],
    trades: Optional[str],
    markets: Optional[str],
    phases: Optional[str],
    output: Optional[str],
    interactive: bool,
    show_presets: bool,
) -> None:
    """
    Coperniq MEP Contractor Configuration Wizard

    Interactive CLI tool for creating contractor configurations.
    """
    console = Console()

    if show_presets:
        """Show presets and exit"""
        wizard = ConfigWizard(console)
        wizard.print_presets()
        return

    # Run wizard
    wizard = ConfigWizard(console)

    if preset or (name and trades and markets and phases):
        # Non-interactive mode
        if not name or not trades or not markets or not phases:
            console.print("[red]Error: --name, --trades, --markets, and --phases required[/red]")
            sys.exit(1)

        # Parse trades, markets, phases
        trade_list = [t.strip() for t in trades.split(",")]
        market_list = [m.strip() for m in markets.split(",")]
        phase_list = [p.strip() for p in phases.split(",")]

        # Validate
        invalid_trades = [t for t in trade_list if t not in [tr.value for tr in Trade]]
        invalid_markets = [m for m in market_list if m not in [mk.value for mk in Market]]
        invalid_phases = [p for p in phase_list if p not in [ph.value for ph in Phase]]

        if invalid_trades or invalid_markets or invalid_phases:
            console.print(f"[red]Invalid selections:[/red]")
            if invalid_trades:
                console.print(f"  Trades: {', '.join(invalid_trades)}")
            if invalid_markets:
                console.print(f"  Markets: {', '.join(invalid_markets)}")
            if invalid_phases:
                console.print(f"  Phases: {', '.join(invalid_phases)}")
            sys.exit(1)

        info = ContractorInfo(name=name)
        config = wizard.build_config(info, trade_list, market_list, phase_list, preset_used=preset)
    else:
        # Interactive mode
        if not interactive:
            console.print("[red]Use --preset or --interactive mode[/red]")
            sys.exit(1)

        config = wizard.run_interactive()

    # Print summary
    wizard.print_summary(config)

    # Save config
    output_dir = Path(output) if output else None
    filepath = save_config(config, output_dir)

    console.print(
        Panel(
            f"[bold green]Configuration saved![/bold green]\n"
            f"[dim]{filepath}[/dim]",
            border_style="green",
        )
    )

    # Print next steps
    console.print("\n[bold]Next Steps:[/bold]")
    console.print("  1. Review the configuration JSON")
    console.print("  2. Upload to Coperniq Process Studio")
    console.print("  3. Run template builder to generate forms")
    console.print("  4. Import into your sandbox instance\n")


if __name__ == "__main__":
    main()
