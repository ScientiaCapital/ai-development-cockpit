# Suggested Commands for AI Development Cockpit

## Core Development Commands
```bash
# Development server
npm run dev                        # Start development server (port 3001)
npm run build                      # Production build with type checking
npm run start                      # Start production server
npm run lint                       # ESLint code quality check
npm run type-check                 # TypeScript validation (tsc --noEmit)

# Testing Commands
npm run test                       # Jest unit tests
npm run test:watch                 # Jest in watch mode
npm run test:coverage              # Unit test coverage report
npm run test:unit                  # Service layer unit tests only

# E2E Testing Infrastructure (Enterprise-grade)
npm run test:e2e                   # Run all Playwright E2E tests
npm run test:e2e:ui                # Run E2E tests with UI
npm run test:e2e:headed            # Run E2E tests in headed mode
npm run test:e2e:debug             # Debug E2E tests
npm run test:e2e:report            # View test reports
npm run test:e2e:comprehensive     # Full orchestrated test suite
npm run test:e2e:validate          # Comprehensive infrastructure validation

# Build Analysis
npm run build:analyze              # Bundle analyzer for optimization

# System Validation
./test-endpoints.sh                # Basic API endpoint testing
```

## Git Workflow Commands
```bash
# Status and branching
git status                         # Check current status
git checkout -b feature/[name]     # Create feature branch
git add .                          # Stage changes
git commit -m "feat: [description] (task X.Y)"  # Commit with task reference

# Pull requests
gh pr create --title "[Title]" --body "Implements task X.Y"  # Create PR
gh pr list                         # List open PRs
```

## MCP Integration Commands
```bash
# Task Master AI (use MCP tools directly)
mcp__taskmaster-ai__next_task      # Get next available task
mcp__taskmaster-ai__get_tasks      # List all tasks with status
mcp__taskmaster-ai__set_task_status # Update task status

# Serena Code Intelligence
mcp__serena__find_symbol           # Find symbols in codebase
mcp__serena__search_for_pattern    # Search for patterns
mcp__serena__get_symbols_overview  # Get file symbol overview
```

## System Commands (macOS)
```bash
# File operations
ls -la                             # List files with details
find . -name "*.tsx" -type f       # Find TypeScript React files
grep -r "interface" src/types/     # Search for interfaces
cat file.txt                       # Display file contents

# Process management
ps aux | grep node                 # Find Node.js processes
kill -9 [PID]                     # Force kill process
lsof -i :3001                     # Check what's using port 3001

# System info
uname -a                          # System information
df -h                             # Disk usage
top                               # System processes
```

## Development Workflow
1. Start with `npm run dev` to launch development server
2. Use `npm run type-check` frequently during development
3. Run `npm run test:e2e:validate` before major commits
4. Use MCP tools for code navigation and task management
5. Commit with descriptive messages referencing task numbers