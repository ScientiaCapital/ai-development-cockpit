"""
E2B Sandbox Runtime for Coperniq GTM Motion

Provides isolated sandboxes for Academy graduates to experience
Coperniq's AI capabilities with their own data.

Lifecycle:
- Day 0: Create sandbox, load vertical, import CSVs
- Day 1-30: Full access (queries, agents, analysis)
- Day 25: Warning email (5 days left)
- Day 30: Freeze (read-only)
- Day 60: Delete sandbox and data
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from pathlib import Path
from enum import Enum

# E2B imports (requires: pip install e2b-code-interpreter)
try:
    from e2b_code_interpreter import Sandbox, AsyncSandbox
    E2B_AVAILABLE = True
except ImportError:
    E2B_AVAILABLE = False
    print("Warning: e2b_code_interpreter not installed. Run: pip install e2b-code-interpreter")


class TrialStatus(Enum):
    """Trial lifecycle status"""
    ACTIVE = "active"           # Day 1-30: Full access
    WARNING = "warning"         # Day 25-30: Warning sent
    FROZEN = "frozen"           # Day 30-60: Read-only
    EXPIRED = "expired"         # Day 60+: Deleted


@dataclass
class SandboxInstance:
    """Represents a user's E2B sandbox instance"""
    sandbox_id: str
    user_id: str
    vertical: str
    created_at: datetime
    expires_at: datetime
    frozen_at: Optional[datetime] = None
    status: TrialStatus = TrialStatus.ACTIVE
    query_count: int = 0
    last_query_at: Optional[datetime] = None
    csv_imports: List[Dict] = field(default_factory=list)

    def days_remaining(self) -> int:
        """Days until sandbox freezes"""
        if self.status == TrialStatus.FROZEN:
            return 0
        delta = self.expires_at - datetime.now()
        return max(0, delta.days)

    def should_warn(self) -> bool:
        """Should we send a warning email?"""
        return self.days_remaining() <= 5 and self.status == TrialStatus.ACTIVE

    def should_freeze(self) -> bool:
        """Should the sandbox be frozen?"""
        return self.days_remaining() <= 0 and self.status != TrialStatus.FROZEN

    def should_delete(self) -> bool:
        """Should the sandbox be deleted?"""
        if self.frozen_at is None:
            return False
        days_frozen = (datetime.now() - self.frozen_at).days
        return days_frozen >= 30  # Delete 30 days after freeze

    def to_dict(self) -> Dict:
        """Serialize to dictionary"""
        return {
            "sandbox_id": self.sandbox_id,
            "user_id": self.user_id,
            "vertical": self.vertical,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
            "frozen_at": self.frozen_at.isoformat() if self.frozen_at else None,
            "status": self.status.value,
            "query_count": self.query_count,
            "last_query_at": self.last_query_at.isoformat() if self.last_query_at else None,
            "csv_imports": self.csv_imports
        }


@dataclass
class AgentResponse:
    """Response from an agent query"""
    query: str
    response: str
    agent_used: Optional[str] = None
    execution_time_ms: int = 0
    tokens_used: int = 0
    success: bool = True
    error: Optional[str] = None


class E2BSandboxRuntime:
    """
    E2B Sandbox Runtime Manager

    Handles creation, lifecycle management, and query execution
    for user sandboxes in the GTM motion.
    """

    # Trial configuration
    TRIAL_DAYS = 30
    FREEZE_DAYS = 30  # Days to keep frozen before deletion
    WARNING_DAYS = 5  # Days before expiry to warn

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize E2B runtime

        Args:
            api_key: E2B API key (or set E2B_API_KEY env var)
        """
        self.api_key = api_key or os.getenv("E2B_API_KEY")
        if not self.api_key:
            raise ValueError("E2B_API_KEY not found. Set in environment or pass to constructor.")

        # Active sandboxes (in production, this would be in Supabase)
        self._sandboxes: Dict[str, SandboxInstance] = {}
        self._active_e2b_sandboxes: Dict[str, Any] = {}

        # Load vertical configs
        self._vertical_configs = self._load_vertical_configs()

    def _load_vertical_configs(self) -> Dict[str, Dict]:
        """Load all GTM vertical configurations"""
        configs = {}
        verticals_dir = Path(__file__).parent.parent / "config" / "gtm_verticals"

        if verticals_dir.exists():
            for json_file in verticals_dir.glob("*.json"):
                vertical_name = json_file.stem
                with open(json_file, 'r') as f:
                    configs[vertical_name] = json.load(f)

        return configs

    # =========================================================================
    # SANDBOX LIFECYCLE
    # =========================================================================

    def create_sandbox(
        self,
        user_id: str,
        vertical: str,
        trial_days: int = None
    ) -> SandboxInstance:
        """
        Create a new sandbox for a user

        Args:
            user_id: Unique user identifier (from Academy)
            vertical: One of solar_epc, hvac_mep, om_service, multi_trade
            trial_days: Override default trial duration

        Returns:
            SandboxInstance with sandbox details
        """
        if vertical not in self._vertical_configs:
            available = list(self._vertical_configs.keys())
            raise ValueError(f"Unknown vertical: {vertical}. Available: {available}")

        # Check if user already has a sandbox
        existing = self.get_user_sandbox(user_id)
        if existing:
            print(f"User {user_id} already has sandbox: {existing.sandbox_id}")
            return existing

        # Create E2B sandbox
        sandbox_id = f"coperniq-{user_id}-{int(datetime.now().timestamp())}"

        trial_duration = trial_days or self.TRIAL_DAYS
        now = datetime.now()

        instance = SandboxInstance(
            sandbox_id=sandbox_id,
            user_id=user_id,
            vertical=vertical,
            created_at=now,
            expires_at=now + timedelta(days=trial_duration),
            status=TrialStatus.ACTIVE
        )

        # Store instance
        self._sandboxes[sandbox_id] = instance

        print(f"Created sandbox: {sandbox_id}")
        print(f"  Vertical: {vertical}")
        print(f"  Expires: {instance.expires_at.strftime('%Y-%m-%d')}")
        print(f"  Days remaining: {instance.days_remaining()}")

        return instance

    def get_user_sandbox(self, user_id: str) -> Optional[SandboxInstance]:
        """Get a user's active sandbox"""
        for sandbox in self._sandboxes.values():
            if sandbox.user_id == user_id and sandbox.status != TrialStatus.EXPIRED:
                return sandbox
        return None

    def get_sandbox(self, sandbox_id: str) -> Optional[SandboxInstance]:
        """Get sandbox by ID"""
        return self._sandboxes.get(sandbox_id)

    def provision_schema(self, sandbox: SandboxInstance) -> Dict:
        """
        Provision Supabase schema for the sandbox based on vertical

        Args:
            sandbox: The sandbox instance

        Returns:
            Schema provisioning result
        """
        vertical_config = self._vertical_configs.get(sandbox.vertical)
        if not vertical_config:
            raise ValueError(f"Vertical config not found: {sandbox.vertical}")

        schema = vertical_config.get("schema", {})
        tables = schema.get("tables", [])
        views = schema.get("views", [])

        # In production, this would create actual Supabase tables
        # For now, we return the schema that would be created

        result = {
            "sandbox_id": sandbox.sandbox_id,
            "vertical": sandbox.vertical,
            "tables_created": tables,
            "views_created": views,
            "status": "provisioned"
        }

        print(f"Provisioned schema for {sandbox.sandbox_id}")
        print(f"  Tables: {', '.join(tables)}")
        print(f"  Views: {', '.join(views)}")

        return result

    def freeze_sandbox(self, sandbox: SandboxInstance) -> Dict:
        """
        Freeze a sandbox (read-only mode)

        Args:
            sandbox: The sandbox to freeze

        Returns:
            Freeze result
        """
        if sandbox.status == TrialStatus.FROZEN:
            return {"status": "already_frozen", "sandbox_id": sandbox.sandbox_id}

        sandbox.status = TrialStatus.FROZEN
        sandbox.frozen_at = datetime.now()

        print(f"Froze sandbox: {sandbox.sandbox_id}")
        print(f"  Will be deleted: {(sandbox.frozen_at + timedelta(days=self.FREEZE_DAYS)).strftime('%Y-%m-%d')}")

        return {
            "status": "frozen",
            "sandbox_id": sandbox.sandbox_id,
            "frozen_at": sandbox.frozen_at.isoformat(),
            "delete_at": (sandbox.frozen_at + timedelta(days=self.FREEZE_DAYS)).isoformat()
        }

    def delete_sandbox(self, sandbox: SandboxInstance) -> Dict:
        """
        Delete a sandbox and all its data

        Args:
            sandbox: The sandbox to delete

        Returns:
            Deletion result
        """
        sandbox_id = sandbox.sandbox_id

        # Kill E2B sandbox if active (using kill() for newer API)
        if sandbox_id in self._active_e2b_sandboxes:
            try:
                self._active_e2b_sandboxes[sandbox_id].kill()
            except:
                pass
            del self._active_e2b_sandboxes[sandbox_id]

        # Mark as expired
        sandbox.status = TrialStatus.EXPIRED

        # In production, also:
        # - Delete Supabase tables
        # - Delete any stored files
        # - Send confirmation email

        print(f"Deleted sandbox: {sandbox_id}")

        return {
            "status": "deleted",
            "sandbox_id": sandbox_id,
            "deleted_at": datetime.now().isoformat()
        }

    def check_trial_status(self, sandbox: SandboxInstance) -> TrialStatus:
        """
        Check and update trial status

        Args:
            sandbox: The sandbox to check

        Returns:
            Current trial status
        """
        if sandbox.status == TrialStatus.EXPIRED:
            return TrialStatus.EXPIRED

        if sandbox.should_delete():
            self.delete_sandbox(sandbox)
            return TrialStatus.EXPIRED

        if sandbox.should_freeze():
            self.freeze_sandbox(sandbox)
            return TrialStatus.FROZEN

        if sandbox.should_warn() and sandbox.status == TrialStatus.ACTIVE:
            sandbox.status = TrialStatus.WARNING
            print(f"Warning: Sandbox {sandbox.sandbox_id} expires in {sandbox.days_remaining()} days")
            # In production, send warning email

        return sandbox.status

    # =========================================================================
    # AGENT QUERIES
    # =========================================================================

    def run_agent_query(
        self,
        sandbox: SandboxInstance,
        query: str,
        agent_name: Optional[str] = None
    ) -> AgentResponse:
        """
        Run an agent query in the sandbox

        Args:
            sandbox: The sandbox instance
            query: Natural language query
            agent_name: Specific agent to use (optional)

        Returns:
            AgentResponse with results
        """
        # Check if sandbox is active
        status = self.check_trial_status(sandbox)
        if status == TrialStatus.FROZEN:
            return AgentResponse(
                query=query,
                response="Your trial has expired. Your sandbox is now read-only. Contact sales to go live with Coperniq.",
                success=False,
                error="sandbox_frozen"
            )

        if status == TrialStatus.EXPIRED:
            return AgentResponse(
                query=query,
                response="Your sandbox has been deleted. Please contact sales to create a new trial.",
                success=False,
                error="sandbox_expired"
            )

        start_time = datetime.now()

        # Get vertical config
        vertical_config = self._vertical_configs.get(sandbox.vertical, {})
        available_agents = vertical_config.get("agents", {})
        sample_queries = vertical_config.get("sample_queries", [])

        # Determine which agent to use
        if agent_name and agent_name in available_agents:
            agent_desc = available_agents[agent_name]
        else:
            # Auto-select based on query
            agent_name = self._select_agent(query, available_agents)
            agent_desc = available_agents.get(agent_name, "General assistant")

        # Build the agent code to execute in E2B
        agent_code = self._build_agent_code(
            query=query,
            vertical=sandbox.vertical,
            agent_name=agent_name,
            agent_description=agent_desc,
            sample_queries=sample_queries
        )

        # Execute in E2B sandbox
        try:
            if E2B_AVAILABLE:
                result = self._execute_in_e2b(sandbox.sandbox_id, agent_code)
            else:
                # Mock execution for development
                result = self._mock_execute(query, agent_name, agent_desc)

            execution_time = int((datetime.now() - start_time).total_seconds() * 1000)

            # Update sandbox stats
            sandbox.query_count += 1
            sandbox.last_query_at = datetime.now()

            return AgentResponse(
                query=query,
                response=result.get("response", "No response generated"),
                agent_used=agent_name,
                execution_time_ms=execution_time,
                tokens_used=result.get("tokens", 0),
                success=True
            )

        except Exception as e:
            return AgentResponse(
                query=query,
                response=f"Error executing query: {str(e)}",
                agent_used=agent_name,
                success=False,
                error=str(e)
            )

    def _select_agent(self, query: str, available_agents: Dict[str, str]) -> str:
        """Select the best agent for a query based on keywords"""
        query_lower = query.lower()

        # Keyword matching for agent selection
        agent_keywords = {
            "fleet_performance": ["production", "performance", "vs design", "underperforming"],
            "permit_tracker": ["permit", "overdue", "ahj", "approval"],
            "install_scheduler": ["schedule", "crew", "install", "next week"],
            "interconnection_status": ["interconnection", "pto", "utility"],
            "job_profitability": ["margin", "profit", "budget", "cost"],
            "crew_scheduler": ["technician", "dispatch", "assign"],
            "equipment_tracker": ["equipment", "warranty", "asset"],
            "maintenance_scheduler": ["maintenance", "service", "pm", "due"],
            "warranty_tracker": ["warranty", "expiration", "claim"],
            "asset_health": ["health", "predict", "failure"],
            "cross_trade_profitability": ["compare", "trade", "solar vs", "hvac vs"],
            "resource_optimizer": ["optimize", "resource", "allocation"],
            "unified_scheduler": ["all trades", "unified", "combined"]
        }

        for agent, keywords in agent_keywords.items():
            if agent in available_agents:
                if any(kw in query_lower for kw in keywords):
                    return agent

        # Default to first available agent
        return list(available_agents.keys())[0] if available_agents else "general"

    def _build_agent_code(
        self,
        query: str,
        vertical: str,
        agent_name: str,
        agent_description: str,
        sample_queries: List[str]
    ) -> str:
        """Build Python code to execute the agent query in E2B"""

        code = f'''
import json

# Agent Configuration
VERTICAL = "{vertical}"
AGENT_NAME = "{agent_name}"
AGENT_DESCRIPTION = "{agent_description}"
QUERY = """{query}"""
SAMPLE_QUERIES = {json.dumps(sample_queries)}

# Simulate agent response (in production, this calls the actual agent)
def process_query(query, agent_name, agent_desc):
    """Process query using MEP domain knowledge"""

    # Build response based on query type
    response = f"[{{agent_name}}] Processing: {{query}}\\n\\n"
    response += f"Agent: {{agent_desc}}\\n\\n"
    response += "Analysis:\\n"
    response += "- Query received and parsed\\n"
    response += "- Relevant data identified\\n"
    response += "- Results computed\\n\\n"
    response += "Ready to provide insights based on your data."

    return {{
        "response": response,
        "tokens": len(query.split()) * 10,
        "agent": agent_name
    }}

# Execute
result = process_query(QUERY, AGENT_NAME, AGENT_DESCRIPTION)
print(json.dumps(result))
'''
        return code

    def _execute_in_e2b(self, sandbox_id: str, code: str) -> Dict:
        """Execute code in E2B sandbox"""
        if not E2B_AVAILABLE:
            raise RuntimeError("E2B not available")

        # Get or create E2B sandbox (using create() for newer API)
        if sandbox_id not in self._active_e2b_sandboxes:
            self._active_e2b_sandboxes[sandbox_id] = Sandbox.create()

        sandbox = self._active_e2b_sandboxes[sandbox_id]

        # Execute the code
        execution = sandbox.run_code(code)

        # Parse output
        if execution.logs.stdout:
            output = execution.logs.stdout[-1] if execution.logs.stdout else "{}"
            try:
                return json.loads(output)
            except:
                return {"response": output, "tokens": 0}

        return {"response": "No output", "tokens": 0}

    def _mock_execute(self, query: str, agent_name: str, agent_desc: str) -> Dict:
        """Mock execution for development without E2B"""
        response = f"[{agent_name}] Processing: {query}\n\n"
        response += f"Agent: {agent_desc}\n\n"
        response += "This is a mock response. In production:\n"
        response += "- Query would be processed in isolated E2B sandbox\n"
        response += "- Actual data from your CSV imports would be analyzed\n"
        response += "- Claude would generate insights based on your data\n"

        return {
            "response": response,
            "tokens": len(query.split()) * 10
        }

    # =========================================================================
    # MANAGEMENT
    # =========================================================================

    def run_lifecycle_check(self) -> Dict:
        """
        Run lifecycle check on all sandboxes

        Should be called by a cron job daily

        Returns:
            Summary of actions taken
        """
        summary = {
            "checked": 0,
            "warned": 0,
            "frozen": 0,
            "deleted": 0
        }

        for sandbox in list(self._sandboxes.values()):
            summary["checked"] += 1

            old_status = sandbox.status
            new_status = self.check_trial_status(sandbox)

            if old_status != new_status:
                if new_status == TrialStatus.WARNING:
                    summary["warned"] += 1
                elif new_status == TrialStatus.FROZEN:
                    summary["frozen"] += 1
                elif new_status == TrialStatus.EXPIRED:
                    summary["deleted"] += 1

        print(f"Lifecycle check complete:")
        print(f"  Checked: {summary['checked']}")
        print(f"  Warned: {summary['warned']}")
        print(f"  Frozen: {summary['frozen']}")
        print(f"  Deleted: {summary['deleted']}")

        return summary

    def get_all_sandboxes(self) -> List[Dict]:
        """Get all sandboxes with their current status"""
        return [s.to_dict() for s in self._sandboxes.values()]

    def get_stats(self) -> Dict:
        """Get runtime statistics"""
        total = len(self._sandboxes)
        by_status = {}
        by_vertical = {}
        total_queries = 0

        for sandbox in self._sandboxes.values():
            status = sandbox.status.value
            by_status[status] = by_status.get(status, 0) + 1

            by_vertical[sandbox.vertical] = by_vertical.get(sandbox.vertical, 0) + 1
            total_queries += sandbox.query_count

        return {
            "total_sandboxes": total,
            "by_status": by_status,
            "by_vertical": by_vertical,
            "total_queries": total_queries,
            "available_verticals": list(self._vertical_configs.keys())
        }


# =============================================================================
# CONVENIENCE FUNCTIONS
# =============================================================================

def create_trial_sandbox(user_id: str, vertical: str) -> SandboxInstance:
    """
    Quick function to create a trial sandbox

    Usage:
        sandbox = create_trial_sandbox("user123", "hvac_mep")
    """
    runtime = E2BSandboxRuntime()
    sandbox = runtime.create_sandbox(user_id, vertical)
    runtime.provision_schema(sandbox)
    return sandbox


def query_sandbox(sandbox_id: str, query: str) -> AgentResponse:
    """
    Quick function to query a sandbox

    Usage:
        response = query_sandbox("coperniq-user123-1234567890", "What's my margin by job type?")
    """
    runtime = E2BSandboxRuntime()
    sandbox = runtime.get_sandbox(sandbox_id)
    if not sandbox:
        raise ValueError(f"Sandbox not found: {sandbox_id}")
    return runtime.run_agent_query(sandbox, query)


# =============================================================================
# DEMO
# =============================================================================

def demo_e2b_runtime():
    """Demonstrate the E2B runtime capabilities"""
    print("\n" + "="*60)
    print("E2B SANDBOX RUNTIME DEMO")
    print("="*60 + "\n")

    # Create runtime (will use mock if E2B not available)
    try:
        runtime = E2BSandboxRuntime()
    except ValueError as e:
        print(f"Note: {e}")
        print("Running in mock mode for demonstration.\n")
        os.environ["E2B_API_KEY"] = "mock-key-for-demo"
        runtime = E2BSandboxRuntime()

    # Show available verticals
    print("Available Verticals:")
    for name, config in runtime._vertical_configs.items():
        print(f"  - {name}: {config.get('display_name', name)}")
    print()

    # Create a sandbox
    print("Creating sandbox for demo user...")
    sandbox = runtime.create_sandbox("demo-user-001", "hvac_mep")
    print()

    # Provision schema
    print("Provisioning schema...")
    runtime.provision_schema(sandbox)
    print()

    # Run some queries
    queries = [
        "What's my margin by job type?",
        "Schedule next week's installs",
        "Which jobs are over budget?"
    ]

    print("Running sample queries...")
    print("-" * 40)
    for query in queries:
        response = runtime.run_agent_query(sandbox, query)
        print(f"\nQ: {query}")
        print(f"Agent: {response.agent_used}")
        print(f"Time: {response.execution_time_ms}ms")
        print(f"Response preview: {response.response[:100]}...")

    print("\n" + "-" * 40)

    # Show stats
    print("\nRuntime Statistics:")
    stats = runtime.get_stats()
    print(f"  Total sandboxes: {stats['total_sandboxes']}")
    print(f"  Total queries: {stats['total_queries']}")
    print(f"  By vertical: {stats['by_vertical']}")

    print("\n" + "="*60)
    print("DEMO COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    demo_e2b_runtime()
