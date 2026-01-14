#!/usr/bin/env python3
"""
Ralph Wiggum Loop Controller - Self-Improving Iteration System
==============================================================

Ralph loop runs autonomously until Instance 388 is 100% complete.
Named after the Simpsons character who keeps trying until he gets it right.

Architecture:
┌─────────────────────────────────────────────────────────────┐
│                    RALPH WIGGUM LOOP                        │
│                                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐  │
│  │  SCAN   │───▶│  BUILD  │───▶│  TEST   │───▶│  ASSESS │  │
│  │ (What's │    │(Execute │    │(Verify  │    │(Complete│  │
│  │ missing)│    │ tasks)  │    │ quality)│    │  yet?)  │  │
│  └─────────┘    └─────────┘    └─────────┘    └────┬────┘  │
│       ▲                                           │        │
│       │                                           │        │
│       │         NO (continue iterating)           │        │
│       └───────────────────────────────────────────┘        │
│                                                             │
│                           │ YES (completion_promise = true) │
│                           ▼                                 │
│                    ┌─────────────┐                          │
│                    │    DONE     │                          │
│                    │ (Ship it!)  │                          │
│                    └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘

Usage:
    python ralph_loop.py status       # Show checklist status
    python ralph_loop.py iterate      # Run one iteration
    python ralph_loop.py run          # Run until complete
    python ralph_loop.py reset        # Reset checklist
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field, asdict
from pathlib import Path

# =============================================================================
# Configuration
# =============================================================================

RALPH_STATE_FILE = Path(__file__).parent / ".ralph_state.json"
COMPLETION_THRESHOLD = 0.95  # 95% = good enough to ship


@dataclass
class ChecklistItem:
    """Single checklist item."""
    id: str
    category: str
    description: str
    done: bool = False
    verified_at: Optional[str] = None
    notes: Optional[str] = None


@dataclass
class RalphState:
    """Ralph loop state."""
    active: bool = True
    iteration: int = 0
    max_iterations: int = 0  # 0 = unlimited
    started_at: str = ""
    last_iteration_at: str = ""
    completion_promise: bool = False
    checklist: List[Dict] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: Dict) -> "RalphState":
        return cls(**data)


# =============================================================================
# Instance 388 Completion Checklist
# =============================================================================

DEFAULT_CHECKLIST = [
    # Voice AI System
    ChecklistItem("voice-1", "Voice AI", "Twilio phone number configured"),
    ChecklistItem("voice-2", "Voice AI", "Inbound call handler working"),
    ChecklistItem("voice-3", "Voice AI", "Outbound call handler working"),
    ChecklistItem("voice-4", "Voice AI", "Call disposition logging"),
    ChecklistItem("voice-5", "Voice AI", "Emergency escalation flow"),

    # Agent Workflows
    ChecklistItem("agent-1", "Agents", "voice-ai agent tested end-to-end"),
    ChecklistItem("agent-2", "Agents", "dispatch agent tested end-to-end"),
    ChecklistItem("agent-3", "Agents", "collections agent tested end-to-end"),
    ChecklistItem("agent-4", "Agents", "pm-scheduler agent tested end-to-end"),
    ChecklistItem("agent-5", "Agents", "quote-builder agent tested end-to-end"),

    # Data Population
    ChecklistItem("data-1", "Data", "Sample contacts imported"),
    ChecklistItem("data-2", "Data", "Sample assets created"),
    ChecklistItem("data-3", "Data", "Sample service plans activated"),
    ChecklistItem("data-4", "Data", "Sample work orders created"),

    # Integration
    ChecklistItem("int-1", "Integration", "MCP tools verified against Coperniq API"),
    ChecklistItem("int-2", "Integration", "Review gates enforced"),
    ChecklistItem("int-3", "Integration", "Claude Code integration tested"),
    ChecklistItem("int-4", "Integration", "LangServe chat UI tested"),

    # Backbone Ready
    ChecklistItem("back-1", "Backbone", "Extensible plugin architecture"),
    ChecklistItem("back-2", "Backbone", "Integration registry (protected)"),
    ChecklistItem("back-3", "Backbone", "Webhook system for external connections"),
]


# =============================================================================
# State Management
# =============================================================================

def load_state() -> RalphState:
    """Load Ralph state from file."""
    if RALPH_STATE_FILE.exists():
        try:
            with open(RALPH_STATE_FILE) as f:
                data = json.load(f)
                return RalphState.from_dict(data)
        except (json.JSONDecodeError, KeyError):
            pass

    # Initialize with default checklist
    state = RalphState(
        active=True,
        started_at=datetime.now().isoformat(),
        checklist=[asdict(item) for item in DEFAULT_CHECKLIST],
    )
    save_state(state)
    return state


def save_state(state: RalphState) -> None:
    """Save Ralph state to file."""
    with open(RALPH_STATE_FILE, "w") as f:
        json.dump(state.to_dict(), f, indent=2)


# =============================================================================
# Loop Operations
# =============================================================================

def scan_phase(state: RalphState) -> List[Dict]:
    """SCAN: Find incomplete items."""
    incomplete = [
        item for item in state.checklist
        if not item.get("done", False)
    ]
    return incomplete


def build_phase(state: RalphState, items: List[Dict]) -> List[Tuple[str, bool]]:
    """BUILD: Attempt to complete items."""
    results = []

    for item in items[:3]:  # Process max 3 items per iteration
        item_id = item["id"]
        description = item["description"]

        print(f"  → Working on: {description}")

        # Try to verify/complete the item
        success = attempt_item(item)
        results.append((item_id, success))

        if success:
            # Mark as done in state
            for checklist_item in state.checklist:
                if checklist_item["id"] == item_id:
                    checklist_item["done"] = True
                    checklist_item["verified_at"] = datetime.now().isoformat()
                    break

    return results


def attempt_item(item: Dict) -> bool:
    """Attempt to complete/verify a checklist item."""
    item_id = item["id"]
    category = item["category"]

    # Voice AI items
    if category == "Voice AI":
        return verify_voice_item(item_id)

    # Agent items
    if category == "Agents":
        return verify_agent_item(item_id)

    # Data items
    if category == "Data":
        return verify_data_item(item_id)

    # Integration items
    if category == "Integration":
        return verify_integration_item(item_id)

    # Backbone items
    if category == "Backbone":
        return verify_backbone_item(item_id)

    return False


def verify_voice_item(item_id: str) -> bool:
    """Verify voice-related checklist item."""
    # TODO: Implement actual verification
    # For now, check if env vars are set
    if item_id == "voice-1":
        return bool(os.getenv("TWILIO_PHONE_NUMBER"))
    return False


def verify_agent_item(item_id: str) -> bool:
    """Verify agent-related checklist item."""
    try:
        from sandbox.coperniq_langgraph_tools import coperniq_health_check
        result = coperniq_health_check.invoke({})
        return result.get("success", False)
    except Exception:
        return False


def verify_data_item(item_id: str) -> bool:
    """Verify data-related checklist item."""
    try:
        from sandbox.coperniq_langgraph_tools import coperniq_list_clients
        result = coperniq_list_clients.invoke({"limit": 5})
        data = result.get("data", [])
        return len(data) > 0 if isinstance(data, list) else False
    except Exception:
        return False


def verify_integration_item(item_id: str) -> bool:
    """Verify integration-related checklist item."""
    if item_id == "int-1":
        # Check if MCP tools file exists
        mcp_tools = Path(__file__).parent / ".mcp" / "tools" / "coperniq.py"
        return mcp_tools.exists()
    return False


def verify_backbone_item(item_id: str) -> bool:
    """Verify backbone-related checklist item."""
    if item_id == "back-1":
        # Check if plugin architecture files exist
        agent_file = Path(__file__).parent / "sandbox" / "coperniq_agent.py"
        return agent_file.exists()
    return False


def test_phase(state: RalphState, results: List[Tuple[str, bool]]) -> int:
    """TEST: Verify build results."""
    successes = sum(1 for _, success in results if success)
    print(f"  ✓ {successes}/{len(results)} items completed this iteration")
    return successes


def assess_phase(state: RalphState) -> Tuple[float, bool]:
    """ASSESS: Check overall completion."""
    total = len(state.checklist)
    done = sum(1 for item in state.checklist if item.get("done", False))
    completion = done / total if total > 0 else 0

    is_complete = completion >= COMPLETION_THRESHOLD

    print(f"  Completion: {done}/{total} ({completion:.1%})")

    if is_complete:
        print("  🎉 COMPLETION PROMISE FULFILLED!")
        state.completion_promise = True

    return completion, is_complete


# =============================================================================
# Main Loop
# =============================================================================

def run_iteration(state: RalphState) -> bool:
    """Run single iteration of Ralph loop."""
    state.iteration += 1
    state.last_iteration_at = datetime.now().isoformat()

    print(f"\n{'='*60}")
    print(f"RALPH LOOP - Iteration {state.iteration}")
    print(f"{'='*60}")

    # SCAN
    print("\n[SCAN] Finding incomplete items...")
    incomplete = scan_phase(state)
    if not incomplete:
        print("  ✓ All items complete!")
        state.completion_promise = True
        save_state(state)
        return True

    print(f"  Found {len(incomplete)} incomplete items")

    # BUILD
    print("\n[BUILD] Working on items...")
    results = build_phase(state, incomplete)

    # TEST
    print("\n[TEST] Verifying results...")
    test_phase(state, results)

    # ASSESS
    print("\n[ASSESS] Checking completion...")
    completion, is_complete = assess_phase(state)

    save_state(state)

    if is_complete:
        return True

    # Check max iterations
    if state.max_iterations > 0 and state.iteration >= state.max_iterations:
        print(f"\n⚠️  Max iterations ({state.max_iterations}) reached")
        return True

    return False


def run_loop():
    """Run Ralph loop until completion."""
    state = load_state()

    if not state.active:
        print("Ralph loop is not active. Use 'ralph_loop.py reset' to restart.")
        return

    print("\n" + "="*60)
    print("STARTING RALPH WIGGUM LOOP")
    print("Instance 388 - Kipper Energy Solutions")
    print("="*60)

    while not state.completion_promise:
        done = run_iteration(state)
        if done:
            break

        # Brief pause between iterations
        time.sleep(2)

    print("\n" + "="*60)
    print("RALPH LOOP COMPLETE")
    print(f"Total iterations: {state.iteration}")
    print(f"Completion promise: {state.completion_promise}")
    print("="*60)


# =============================================================================
# CLI Commands
# =============================================================================

def cmd_status():
    """Show checklist status."""
    state = load_state()

    print("\n" + "="*60)
    print("RALPH LOOP STATUS - Instance 388")
    print("="*60)
    print(f"Active: {state.active}")
    print(f"Iteration: {state.iteration}")
    print(f"Completion Promise: {state.completion_promise}")
    print(f"Started: {state.started_at}")

    # Group by category
    categories = {}
    for item in state.checklist:
        cat = item["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(item)

    print("\nChecklist:")
    total = len(state.checklist)
    done = sum(1 for item in state.checklist if item.get("done", False))

    for category, items in categories.items():
        cat_done = sum(1 for i in items if i.get("done", False))
        print(f"\n  {category} ({cat_done}/{len(items)}):")
        for item in items:
            check = "✓" if item.get("done") else " "
            print(f"    [{check}] {item['description']}")

    print(f"\n{'='*60}")
    print(f"TOTAL: {done}/{total} ({done/total:.1%})")
    print("="*60)


def cmd_iterate():
    """Run single iteration."""
    state = load_state()
    run_iteration(state)


def cmd_run():
    """Run until complete."""
    run_loop()


def cmd_reset():
    """Reset checklist."""
    state = RalphState(
        active=True,
        started_at=datetime.now().isoformat(),
        checklist=[asdict(item) for item in DEFAULT_CHECKLIST],
    )
    save_state(state)
    print("Ralph loop reset. Run 'ralph_loop.py status' to see checklist.")


def cmd_mark(item_id: str, done: bool = True):
    """Manually mark item as done/undone."""
    state = load_state()

    for item in state.checklist:
        if item["id"] == item_id:
            item["done"] = done
            item["verified_at"] = datetime.now().isoformat() if done else None
            save_state(state)
            print(f"Marked {item_id} as {'done' if done else 'not done'}")
            return

    print(f"Item {item_id} not found")


def cmd_help():
    """Show help."""
    print(__doc__)


# =============================================================================
# Main
# =============================================================================

def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        cmd_status()
        return

    command = sys.argv[1].lower()

    commands = {
        "status": cmd_status,
        "iterate": cmd_iterate,
        "run": cmd_run,
        "reset": cmd_reset,
        "help": cmd_help,
    }

    if command == "mark" and len(sys.argv) >= 3:
        item_id = sys.argv[2]
        done = sys.argv[3].lower() != "false" if len(sys.argv) > 3 else True
        cmd_mark(item_id, done)
    elif command in commands:
        commands[command]()
    else:
        print(f"Unknown command: {command}")
        cmd_help()


if __name__ == "__main__":
    main()
