#!/usr/bin/env python3
"""
Coperniq MEP Sandbox - Interactive CLI Demo

Run: python demo_cli.py
"""

import os
import sys
from pathlib import Path

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from sandbox.e2b_runtime import E2BSandboxRuntime, TrialStatus


def print_banner():
    print("\n" + "=" * 60)
    print("  COPERNIQ MEP SANDBOX - LIVE DEMO")
    print("  E2B Cloud Execution + AI Agents")
    print("=" * 60)


def print_verticals(runtime):
    print("\n📦 Available Verticals:")
    for i, (name, config) in enumerate(runtime._vertical_configs.items(), 1):
        print(f"  {i}. {config.get('display_name', name)}")
        print(f"     Tables: {', '.join(config.get('schema', {}).get('tables', []))}")
    print()


def print_agents(config):
    print("\n🤖 Available Agents:")
    for name, desc in config.get("agents", {}).items():
        print(f"  • {name}: {desc}")
    print()


def print_sample_queries(config):
    print("\n💡 Sample Queries:")
    for q in config.get("sample_queries", [])[:5]:
        print(f"  → {q}")
    print()


def main():
    print_banner()

    # Initialize runtime
    try:
        runtime = E2BSandboxRuntime()
        print("✅ E2B Runtime initialized")
        print(f"   API Key: {runtime.api_key[:10]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("\nMake sure E2B_API_KEY is set in .env")
        return

    print_verticals(runtime)

    # Select vertical
    verticals = list(runtime._vertical_configs.keys())
    while True:
        choice = input("Select vertical (1-4) or 'q' to quit: ").strip()
        if choice.lower() == 'q':
            print("\nGoodbye!")
            return
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(verticals):
                selected = verticals[idx]
                break
        except:
            pass
        print("Invalid choice. Try again.")

    # Create sandbox
    print(f"\n🚀 Creating sandbox for vertical: {selected}")
    sandbox = runtime.create_sandbox("demo-user", selected)
    runtime.provision_schema(sandbox)

    config = runtime._vertical_configs[selected]
    print_agents(config)
    print_sample_queries(config)

    # Interactive query loop
    print("\n" + "-" * 60)
    print("Enter queries (or 'help', 'stats', 'quit'):")
    print("-" * 60)

    while True:
        try:
            query = input("\n🔍 Query: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\n\nGoodbye!")
            break

        if not query:
            continue

        if query.lower() == 'quit':
            print("\n👋 Goodbye!")
            break

        if query.lower() == 'help':
            print_sample_queries(config)
            print_agents(config)
            continue

        if query.lower() == 'stats':
            stats = runtime.get_stats()
            print(f"\n📊 Stats:")
            print(f"   Sandboxes: {stats['total_sandboxes']}")
            print(f"   Queries: {stats['total_queries']}")
            print(f"   Days remaining: {sandbox.days_remaining()}")
            continue

        # Execute query
        print("\n⏳ Processing...")
        response = runtime.run_agent_query(sandbox, query)

        if response.success:
            print(f"\n✅ Agent: {response.agent_used}")
            print(f"   Time: {response.execution_time_ms}ms")
            print(f"\n📋 Response:\n{response.response}")
        else:
            print(f"\n❌ Error: {response.error}")
            print(f"   {response.response}")

    # Cleanup
    print("\n🧹 Cleaning up sandbox...")
    runtime.delete_sandbox(sandbox)
    print("Done!")


if __name__ == "__main__":
    main()
