"""
MEP Template Loader - Parse YAML templates and build catalog

Loads YAML templates from the templates/ directory and provides
a queryable catalog with Pydantic models for type safety.

Run: python -c "from sandbox.template_loader import TemplateLoader; loader = TemplateLoader(); print(loader.get_stats())"
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml
import logging

logger = logging.getLogger(__name__)

# ============================================================================
# PYDANTIC MODELS FOR TYPE SAFETY
# ============================================================================

from pydantic import BaseModel, Field


class TemplateField(BaseModel):
    """Single form field specification"""
    name: str
    type: str  # Text, Numeric, Single select, Multiple select, File, Group
    required: bool = False
    options: Optional[List[str]] = None


class TemplateGroup(BaseModel):
    """Group of fields within a template"""
    name: str
    order: int
    fields: List[TemplateField]


class TemplateMetadata(BaseModel):
    """Template metadata extracted from YAML"""
    total_fields: int
    total_groups: int
    trade: str
    phase: Optional[str] = None
    created_by: Optional[str] = None
    version: Optional[str] = None


class TemplateSpec(BaseModel):
    """Complete template specification"""
    name: str
    description: str
    emoji: Optional[str] = None
    category: str
    phase: Optional[str] = None
    work_order_type: Optional[str] = None
    fields_count: int
    groups_count: int
    trade: str
    file: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    groups: List[TemplateGroup] = Field(default_factory=list)


class TemplateListResponse(BaseModel):
    """Response for listing templates"""
    total: int
    templates: List[Dict[str, Any]]


class TradeStats(BaseModel):
    """Statistics for a single trade"""
    trade: str
    count: int
    phases: Dict[str, int]


class TradesResponse(BaseModel):
    """Response for listing available trades"""
    total_templates: int
    trades: List[TradeStats]


# ============================================================================
# TEMPLATE LOADER
# ============================================================================


class TemplateLoader:
    """Load and manage YAML templates from filesystem"""

    def __init__(self, templates_dir: Optional[Path] = None):
        """
        Initialize loader with templates directory.

        Args:
            templates_dir: Path to templates directory.
                          Defaults to ../templates relative to this file.
        """
        if templates_dir is None:
            # Default to templates directory relative to this file
            templates_dir = Path(__file__).parent.parent / "templates"

        self.templates_dir = templates_dir
        self._catalog: Dict[str, TemplateSpec] = {}
        self._trades: Dict[str, int] = {}
        self._phases: Dict[str, int] = {}

        # Load all templates
        self._load_all_templates()

    def _load_all_templates(self) -> None:
        """Load all YAML templates from templates directory"""
        if not self.templates_dir.exists():
            logger.warning(f"Templates directory not found: {self.templates_dir}")
            return

        logger.info(f"Loading templates from {self.templates_dir}")

        # Iterate through all trade subdirectories
        for trade_dir in self.templates_dir.iterdir():
            if not trade_dir.is_dir() or trade_dir.name.startswith("."):
                continue

            trade_name = trade_dir.name
            logger.debug(f"Processing trade: {trade_name}")

            # Load all YAML files in the trade directory
            for yaml_file in trade_dir.glob("*.yaml"):
                try:
                    template = self._load_template_file(yaml_file, trade_name)
                    if template:
                        # Use filename without extension as key
                        template_key = yaml_file.stem
                        self._catalog[template_key] = template

                        # Update statistics
                        self._trades[trade_name] = self._trades.get(trade_name, 0) + 1
                        phase = template.phase or "unknown"
                        self._phases[phase] = self._phases.get(phase, 0) + 1

                        logger.debug(f"Loaded template: {template.name}")

                except Exception as e:
                    logger.error(f"Error loading {yaml_file}: {e}")

        logger.info(
            f"Loaded {len(self._catalog)} templates from {len(self._trades)} trades"
        )

    def _load_template_file(self, yaml_path: Path, trade_name: str) -> Optional[TemplateSpec]:
        """
        Load and parse a single YAML template file.

        Args:
            yaml_path: Path to the YAML file
            trade_name: Name of the trade (from directory)

        Returns:
            TemplateSpec or None if parsing fails
        """
        with open(yaml_path, "r") as f:
            data = yaml.safe_load(f)

        if not data:
            return None

        template_data = data.get("template", {})
        metadata = data.get("metadata", {})
        groups = data.get("groups", [])

        # Parse groups and count fields
        parsed_groups = []
        total_fields = 0

        for group_data in groups:
            fields = []
            for field_data in group_data.get("fields", []):
                field = TemplateField(
                    name=field_data.get("name", ""),
                    type=field_data.get("type", "Text"),
                    required=field_data.get("required", False),
                    options=field_data.get("options"),
                )
                fields.append(field)
                total_fields += 1

            group = TemplateGroup(
                name=group_data.get("name", ""),
                order=group_data.get("order", 0),
                fields=fields,
            )
            parsed_groups.append(group)

        # Extract work order info if present
        work_order = template_data.get("work_order", {})

        # Create metadata model and convert to dict
        metadata_obj = TemplateMetadata(
            total_fields=total_fields,
            total_groups=len(groups),
            trade=trade_name,
            phase=template_data.get("phase"),
            created_by=metadata.get("created_by"),
            version=metadata.get("version"),
        )

        spec = TemplateSpec(
            name=template_data.get("name", ""),
            description=template_data.get("description", ""),
            emoji=template_data.get("emoji"),
            category=template_data.get("category", trade_name),
            phase=template_data.get("phase"),
            work_order_type=work_order.get("type"),
            fields_count=total_fields,
            groups_count=len(groups),
            trade=trade_name,
            file=yaml_path.name,
            metadata=metadata_obj.model_dump() if metadata_obj else {},
            groups=parsed_groups,
        )

        return spec

    # ========================================================================
    # PUBLIC QUERY METHODS
    # ========================================================================

    def get_all_templates(self) -> List[TemplateSpec]:
        """Get all loaded templates"""
        return list(self._catalog.values())

    def get_templates_by_trade(self, trade: str) -> List[TemplateSpec]:
        """Get all templates for a specific trade"""
        return [t for t in self._catalog.values() if t.trade == trade]

    def get_templates_by_phase(self, phase: str) -> List[TemplateSpec]:
        """Get all templates for a specific phase"""
        return [t for t in self._catalog.values() if t.phase == phase]

    def get_template(self, template_key: str) -> Optional[TemplateSpec]:
        """Get a specific template by key (filename without extension)"""
        return self._catalog.get(template_key)

    def get_template_by_trade_and_name(
        self, trade: str, template_name: str
    ) -> Optional[TemplateSpec]:
        """Get a specific template by trade and template name

        Args:
            trade: Trade name (e.g., "hvac")
            template_name: Template name with or without .yaml extension (e.g., "lead_intake" or "lead_intake.yaml")
        """
        # Normalize template name - remove .yaml extension if present
        if template_name.endswith(".yaml"):
            template_name = template_name[:-5]

        for template in self._catalog.values():
            # Match both by filename and trade
            template_file_name = template.file.replace(".yaml", "")
            if template.trade == trade and template_file_name == template_name:
                return template
        return None

    def get_trades(self) -> Dict[str, int]:
        """Get count of templates by trade"""
        return self._trades.copy()

    def get_phases(self) -> Dict[str, int]:
        """Get count of templates by phase"""
        return self._phases.copy()

    def get_stats(self) -> Dict[str, Any]:
        """Get overall statistics"""
        return {
            "total_templates": len(self._catalog),
            "total_trades": len(self._trades),
            "total_phases": len(self._phases),
            "templates_by_trade": self._trades,
            "templates_by_phase": self._phases,
            "templates_dir": str(self.templates_dir),
        }

    def get_trades_with_stats(self) -> TradesResponse:
        """Get detailed statistics by trade"""
        trades_list = []

        for trade_name in sorted(self._trades.keys()):
            trade_templates = self.get_templates_by_trade(trade_name)
            phases_in_trade: Dict[str, int] = {}

            for template in trade_templates:
                phase = template.phase or "unspecified"
                phases_in_trade[phase] = phases_in_trade.get(phase, 0) + 1

            trades_list.append(
                TradeStats(
                    trade=trade_name,
                    count=len(trade_templates),
                    phases=phases_in_trade,
                )
            )

        return TradesResponse(
            total_templates=len(self._catalog), trades=trades_list
        )

    def filter_templates(
        self,
        trade: Optional[str] = None,
        phase: Optional[str] = None,
    ) -> List[TemplateSpec]:
        """
        Filter templates by multiple criteria.

        Args:
            trade: Filter by trade name
            phase: Filter by phase

        Returns:
            List of matching templates
        """
        results = self.get_all_templates()

        if trade:
            results = [t for t in results if t.trade == trade]

        if phase:
            results = [t for t in results if t.phase == phase]

        return results


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================

_loader_instance: Optional[TemplateLoader] = None


def get_loader() -> TemplateLoader:
    """Get or create the global template loader instance"""
    global _loader_instance
    if _loader_instance is None:
        _loader_instance = TemplateLoader()
    return _loader_instance


if __name__ == "__main__":
    # Development/testing: print loader stats
    loader = TemplateLoader()
    stats = loader.get_stats()
    print(json.dumps(stats, indent=2))
