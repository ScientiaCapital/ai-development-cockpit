# Task Completion Workflow

## When a Task is Completed

### 1. Code Quality Checks
```bash
# TypeScript validation
npm run type-check                 # Must pass with no errors

# Linting and formatting
npm run lint                       # ESLint must pass

# Unit tests
npm run test                       # All unit tests must pass
npm run test:coverage              # Check coverage metrics
```

### 2. E2E Testing Validation
```bash
# Infrastructure validation
npm run test:e2e:validate          # Comprehensive system validation

# Full E2E test suite
npm run test:e2e:comprehensive     # Complete orchestrated testing

# Performance validation
npm run build:analyze              # Check bundle size impacts
```

### 3. Git Workflow
```bash
# Stage and commit changes
git add .
git commit -m "feat: implement [feature] (task X.Y)"

# Create pull request
gh pr create --title "Complete task X.Y: [description]" --body "Implements [details]"
```

### 4. Task Management Updates
```bash
# Update task status using MCP tools
mcp__taskmaster-ai__set_task_status --id=[task-id] --status=done

# Get next task
mcp__taskmaster-ai__next_task
```

### 5. Documentation Requirements
- Update relevant README sections if new features added
- Add JSDoc comments for new public APIs
- Update CLAUDE.md if new development patterns introduced
- Document any new environment variables or configuration

### 6. Quality Gates
- All TypeScript errors resolved
- All unit tests passing
- E2E validation suite passing
- No critical security vulnerabilities
- Performance regression checks passed
- Code review completed (for major features)

### 7. Deployment Readiness
- Build process completes successfully
- All environment variables documented
- Database migrations tested (if applicable)
- Monitoring and alerting configured
- Rollback procedures validated