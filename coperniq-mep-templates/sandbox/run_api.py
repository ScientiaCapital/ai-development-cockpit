#!/usr/bin/env python3
"""
MEP Templates API - Python Startup Script

A cross-platform startup script for the MEP Templates API server.

Usage:
    python run_api.py dev 8000        # Development mode with auto-reload
    python run_api.py prod 8000       # Production mode
    python run_api.py                 # Default: development on port 8000

Environment Variables:
    TEMPLATES_API_MODE       - 'dev' or 'prod' (default: dev)
    TEMPLATES_API_PORT       - Port number (default: 8000)
    TEMPLATES_API_HOST       - Host address (default: 0.0.0.0)
    LOG_LEVEL                - Logging level (default: info)
"""

import sys
import os
import argparse
import subprocess
from pathlib import Path


def main():
    """Main entry point for the API server"""

    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="MEP Templates API Server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "mode",
        nargs="?",
        choices=["dev", "prod"],
        default="dev",
        help="Server mode: dev (auto-reload) or prod (workers)",
    )
    parser.add_argument(
        "port",
        nargs="?",
        type=int,
        default=8000,
        help="Port number (default: 8000)",
    )
    parser.add_argument(
        "--host",
        default="0.0.0.0",
        help="Host address (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Number of worker processes for production (default: 4)",
    )
    parser.add_argument(
        "--log-level",
        choices=["debug", "info", "warning", "error", "critical"],
        default=None,
        help="Log level (default: info for dev, warning for prod)",
    )

    args = parser.parse_args()

    # Validate port
    if not (1 <= args.port <= 65535):
        print(f"Error: Invalid port {args.port}. Must be between 1 and 65535")
        sys.exit(1)

    # Change to project directory
    script_dir = Path(__file__).parent
    project_dir = script_dir.parent
    os.chdir(project_dir)

    # Print startup information
    print("=" * 70)
    print("MEP Templates API - FastAPI Server")
    print("=" * 70)
    print(f"Mode:     {args.mode}")
    print(f"Host:     {args.host}")
    print(f"Port:     {args.port}")
    print(f"Workers:  {args.workers if args.mode == 'prod' else 'N/A'}")
    print()
    print("Endpoints:")
    print(f"  Health:       http://{args.host}:{args.port}/health")
    print(f"  Docs:         http://{args.host}:{args.port}/docs")
    print(f"  ReDoc:        http://{args.host}:{args.port}/redoc")
    print(f"  OpenAPI JSON: http://{args.host}:{args.port}/openapi.json")
    print()
    print("Press CTRL+C to stop the server")
    print("=" * 70)

    # Determine log level
    if args.log_level:
        log_level = args.log_level
    elif args.mode == "dev":
        log_level = "info"
    else:
        log_level = "warning"

    # Build uvicorn command
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "sandbox.templates_api:app",
        f"--host={args.host}",
        f"--port={args.port}",
        f"--log-level={log_level}",
    ]

    if args.mode == "dev":
        cmd.append("--reload")
    else:
        cmd.append(f"--workers={args.workers}")

    # Run the server
    try:
        subprocess.run(cmd, check=False)
    except KeyboardInterrupt:
        print("\n\nShutting down server...")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
