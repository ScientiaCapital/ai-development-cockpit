#!/usr/bin/env python3
"""
Coperniq CLI - Command Line Interface for Instance 388
======================================================

Quick commands for managing and demoing the platform.
Works standalone or as gateway to LangGraph agents.

Usage:
    ./coperniq_cli.py status          # Show system status
    ./coperniq_cli.py health          # Check API health
    ./coperniq_cli.py clients         # List clients
    ./coperniq_cli.py projects        # List projects
    ./coperniq_cli.py requests        # List service requests
    ./coperniq_cli.py templates       # List work order templates
    ./coperniq_cli.py aging           # Show aging invoices
    ./coperniq_cli.py chat [msg]      # Chat with Coperniq agent
    ./coperniq_cli.py help            # Show this help
"""

import sys
import os
import json

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Optional


def color(text: str, code: str) -> str:
    """ANSI color wrapper."""
    return f"\033[{code}m{text}\033[0m"


def green(text: str) -> str: return color(text, "32")
def red(text: str) -> str: return color(text, "31")
def yellow(text: str) -> str: return color(text, "33")
def blue(text: str) -> str: return color(text, "34")
def cyan(text: str) -> str: return color(text, "36")


def print_header(title: str) -> None:
    """Print section header."""
    print(cyan(f"\n=== {title} ===\n"))


def cmd_status():
    """Show system status."""
    from sandbox.coperniq_langgraph_tools import coperniq_health_check, COPERNIQ_COMPANY_ID

    print_header("Coperniq Instance 388 - Status")

    print(f"Company ID: {COPERNIQ_COMPANY_ID}")
    print(f"Instance: Kipper Energy Solutions")

    result = coperniq_health_check.invoke({})
    status = "healthy" if result.get("success") else "unhealthy"
    icon = green("✓") if result.get("success") else red("✗")
    print(f"\nAPI Status: {icon} {status}")

    print(cyan("\nConfigured Agents:"))
    agents = ["voice-ai", "dispatch", "collections", "pm-scheduler", "quote-builder"]
    for agent in agents:
        print(f"  {green('●')} {agent}")


def cmd_health():
    """Check API health."""
    from sandbox.coperniq_langgraph_tools import coperniq_health_check

    print_header("API Health Check")

    result = coperniq_health_check.invoke({})
    print(json.dumps(result, indent=2))


def cmd_clients():
    """List clients."""
    from sandbox.coperniq_langgraph_tools import coperniq_list_clients

    print_header("Clients")

    result = coperniq_list_clients.invoke({"limit": 20})
    if result.get("success"):
        clients = result.get("data", [])
        if isinstance(clients, list):
            print(f"Found {len(clients)} clients:")
            for c in clients[:10]:
                name = c.get("title") or c.get("name", "Unknown")
                cid = c.get("id", "?")
                print(f"  {green('→')} {name} (ID: {cid})")
        else:
            print(json.dumps(result, indent=2))
    else:
        print(red(f"Error: {result.get('error')}"))


def cmd_projects():
    """List projects."""
    from sandbox.coperniq_langgraph_tools import coperniq_list_projects

    print_header("Projects")

    result = coperniq_list_projects.invoke({"status": "ACTIVE", "limit": 20})
    if result.get("success"):
        projects = result.get("data", [])
        if isinstance(projects, list):
            print(f"Found {len(projects)} active projects:")
            for p in projects[:10]:
                title = p.get("title", "Untitled")
                pid = p.get("id", "?")
                status = p.get("status", "?")
                print(f"  {green('→')} {title} (ID: {pid}) [{status}]")
        else:
            print(json.dumps(result, indent=2))
    else:
        print(red(f"Error: {result.get('error')}"))


def cmd_requests():
    """List service requests."""
    from sandbox.coperniq_langgraph_tools import coperniq_list_requests

    print_header("Service Requests")

    result = coperniq_list_requests.invoke({"status": "OPEN", "limit": 20})
    if result.get("success"):
        requests = result.get("data", [])
        if isinstance(requests, list):
            print(f"Found {len(requests)} open requests:")
            for r in requests[:10]:
                title = r.get("title", "Untitled")
                rid = r.get("id", "?")
                priority = r.get("priority", "?")
                print(f"  {green('→')} {title} (ID: {rid}) [{priority}]")
        else:
            print(json.dumps(result, indent=2))
    else:
        print(red(f"Error: {result.get('error')}"))


def cmd_templates():
    """List work order templates."""
    from sandbox.coperniq_langgraph_tools import coperniq_list_work_order_templates

    print_header("Work Order Templates")

    result = coperniq_list_work_order_templates.invoke({})
    if result.get("success"):
        templates = result.get("data", [])
        if isinstance(templates, list):
            print(f"Found {len(templates)} templates:")
            for t in templates[:15]:
                name = t.get("name") or t.get("title", "Unknown")
                tid = t.get("id", "?")
                print(f"  {green('→')} {name} (ID: {tid})")
        else:
            print(json.dumps(result, indent=2))
    else:
        print(red(f"Error: {result.get('error')}"))


def cmd_aging():
    """Show aging invoices."""
    from sandbox.coperniq_langgraph_tools import coperniq_get_aging_invoices

    print_header("Aging Invoices")

    result = coperniq_get_aging_invoices.invoke({"bucket": "all"})
    if result.get("success"):
        data = result.get("data", {})
        if isinstance(data, dict):
            for bucket, invoices in data.items():
                count = len(invoices) if isinstance(invoices, list) else 0
                total = sum(i.get("amount", 0) for i in invoices) if isinstance(invoices, list) else 0
                print(f"  {bucket} days: {count} invoices (${total:,.2f})")
        else:
            print(json.dumps(result, indent=2))
    else:
        print(red(f"Error: {result.get('error')}"))


def cmd_chat(message: Optional[str] = None):
    """Chat with Coperniq agent."""
    from sandbox.coperniq_agent import coperniq_agent

    print_header("Coperniq Agent Chat")

    if not message:
        print("Enter your message (or 'quit' to exit):")
        while True:
            try:
                user_input = input(f"\n{blue('You')}: ").strip()
                if user_input.lower() in ("quit", "exit", "q"):
                    print(yellow("Goodbye!"))
                    break
                if user_input:
                    print(f"{green('Agent')}: ", end="", flush=True)
                    response = coperniq_agent.invoke(user_input)
                    print(response)
            except KeyboardInterrupt:
                print(yellow("\nGoodbye!"))
                break
            except Exception as e:
                print(red(f"Error: {e}"))
    else:
        print(f"{blue('You')}: {message}")
        response = coperniq_agent.invoke(message)
        print(f"{green('Agent')}: {response}")


def cmd_help():
    """Show help."""
    print(__doc__)


def main():
    """Main entry point."""
    commands = {
        "status": cmd_status,
        "health": cmd_health,
        "clients": cmd_clients,
        "projects": cmd_projects,
        "requests": cmd_requests,
        "templates": cmd_templates,
        "aging": cmd_aging,
        "chat": cmd_chat,
        "help": cmd_help,
    }

    if len(sys.argv) < 2:
        cmd_help()
        return

    cmd = sys.argv[1].lower()

    if cmd == "chat" and len(sys.argv) > 2:
        # Chat with message argument
        message = " ".join(sys.argv[2:])
        cmd_chat(message)
    elif cmd in commands:
        commands[cmd]()
    else:
        print(red(f"Unknown command: {cmd}"))
        cmd_help()


if __name__ == "__main__":
    main()
