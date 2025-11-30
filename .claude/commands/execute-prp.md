# PRP Execution - 6-Phase Workflow

Execute Precision Research Plans (PRPs) with TDD methodology and validation gates.

## Critical Rules

- **TDD MANDATORY** - Write tests BEFORE implementation
- **NO OpenAI** - Use Claude, DeepSeek, Qwen only
- **Validation Gates** - Must pass all checks before proceeding to next phase

---

## Phase 1: Context Loading

**Objective**: Understand the feature requirements and current codebase state.

### Actions:
1. Read PRP document
   ```bash
   cat /Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/PRPs/[feature-name].md
   ```

2. Read project status
   ```bash
   cat /Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/CLAUDE.md
   cat /Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/TASK.md
   ```

3. Read relevant source files
   - LangGraph orchestrator: `src/orchestrator/graph.ts`
   - Agent implementations: `src/orchestrator/agents/`
   - Language adapters: `src/adapters/`
   - Cost optimizer: `src/services/costOptimizer.ts`

### Success Criteria:
- [ ] PRP requirements understood
- [ ] Current architecture mapped
- [ ] Dependencies identified
- [ ] Potential conflicts flagged

---

## Phase 2: ULTRATHINK Planning

**Objective**: Design implementation strategy with cost optimization.

### ULTRATHINK Framework:
```
1. DECOMPOSE: Break feature into atomic tasks
2. COST ESTIMATE: Calculate API costs per task
3. OPTIMIZE: Route to cheapest provider
4. SEQUENCE: Order tasks for maximum parallelization
5. VALIDATE: Identify test coverage gaps
```

### Example:
```markdown
Feature: Add Rust GPU image processing

DECOMPOSE:
- Task 1: Create RustAdapter class
- Task 2: Implement CUDA bindings
- Task 3: Add RunPod deployment config
- Task 4: Wire into buildNode
- Task 5: Add feedbackNode cost tracking

COST ESTIMATE:
- Code gen: DeepSeek ($0.27/1M tokens) × 50K tokens = $0.0135
- Validation: Qwen ($0.31/1M tokens) × 10K tokens = $0.0031
- TOTAL: $0.0166 (vs Claude-only: $0.15, savings: 89%)

OPTIMIZE:
- Use DeepSeek for Rust code generation
- Use Qwen for visual validation
- Use Claude only for complex architecture decisions

SEQUENCE:
- Parallel: Task 1 + Task 2 (independent)
- Sequential: Task 3 → Task 4 → Task 5 (dependent)

VALIDATE:
- Unit tests: RustAdapter.test.ts
- Integration tests: graph.integration.test.ts
- E2E tests: RunPod deployment test
```

### Success Criteria:
- [ ] All tasks identified
- [ ] Cost savings ≥80%
- [ ] Test plan covers all code paths
- [ ] Parallelization opportunities identified

---

## Phase 3: Implementation (TDD)

**Objective**: Write tests first, then implement feature.

### TDD Cycle:

#### Step 1: Write Failing Tests
```bash
# Create test file
touch src/adapters/RustAdapter.test.ts

# Write tests (following existing patterns)
# Example from FrontendDeveloper.test.ts:
describe('RustAdapter', () => {
  it('should generate Actix-web route', async () => {
    const adapter = new RustAdapter();
    const result = await adapter.generateCode('Create GET /health endpoint');
    expect(result.language).toBe('rust');
    expect(result.code).toContain('actix_web');
  });
});

# Run tests (should fail)
npm test -- RustAdapter.test.ts
```

#### Step 2: Implement Minimal Code
```bash
# Create implementation file
touch src/adapters/RustAdapter.ts

# Write minimal code to pass tests
# Follow existing adapter patterns (PythonAdapter, GoAdapter, TypeScriptAdapter)
```

#### Step 3: Verify Tests Pass
```bash
npm test -- RustAdapter.test.ts
```

#### Step 4: Refactor
```bash
# Improve code quality
# Add error handling
# Optimize performance
# Re-run tests to ensure no regression
```

### Success Criteria:
- [ ] All new tests pass
- [ ] No existing tests broken
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)

---

## Phase 4: Validation

**Objective**: Run comprehensive checks before integration.

### Validation Checklist:

#### 1. Unit Tests
```bash
npm test -- --coverage
# Verify coverage ≥80%
```

#### 2. Integration Tests
```bash
npm test -- graph.integration.test.ts
# Verify LangGraph nodes interact correctly
```

#### 3. Type Safety
```bash
npx tsc --noEmit
# Zero TypeScript errors
```

#### 4. Linting
```bash
npm run lint
# Zero ESLint errors
```

#### 5. OpenAI Detection
```bash
grep -r "openai" src/ --exclude-dir=node_modules
# Should return no results
```

#### 6. Environment Variables
```bash
grep -r "sk-ant-" src/ --exclude-dir=node_modules
grep -r "sk-" src/ --exclude-dir=node_modules
# Should return no hardcoded API keys
```

### Success Criteria:
- [ ] All validation checks pass
- [ ] No regressions detected
- [ ] Cost savings validated (≥80%)

---

## Phase 5: Review

**Objective**: Peer review before deployment.

### Review Areas:

#### 1. Code Quality
- Follows existing patterns (agents, adapters)
- No code duplication
- Clear naming conventions
- Proper error handling

#### 2. Test Coverage
- All code paths tested
- Edge cases handled
- Mock data realistic
- E2E tests included

#### 3. Documentation
- Inline comments for complex logic
- README updated if needed
- Environment variables documented in `.env.example`

#### 4. Cost Optimization
- Provider routing optimized
- Circuit breaker configured
- Fallback strategies defined

#### 5. Security
- No hardcoded secrets
- Input validation present
- Rate limiting configured
- Authentication/authorization respected

### Success Criteria:
- [ ] Code review approved
- [ ] No security vulnerabilities
- [ ] Documentation complete

---

## Phase 6: Documentation

**Objective**: Update project documentation for future developers.

### Documentation Updates:

#### 1. CLAUDE.md
```markdown
## Session Progress ([Date])

### ✅ Completed - [Feature Name]
- [Summary of what was built]
- Tests: X new tests added
- Cost savings: Y% achieved
- Integration: [Which nodes/agents affected]
```

#### 2. TASK.md
```markdown
### Completed
- ✅ [Feature Name] - [Date]
  - Implementation: [Key files changed]
  - Tests: [Test files added]
  - Deployment: [Deployment status]
```

#### 3. README.md (if applicable)
- Update feature list
- Add usage examples
- Document new environment variables

#### 4. PRP Document
```markdown
**Status**: Complete ✅
**Completed**: [Date]
**Actual Cost Savings**: [X]%
**Tests Added**: [Y] tests
**Files Changed**: [List of files]
```

### Success Criteria:
- [ ] CLAUDE.md updated
- [ ] TASK.md updated
- [ ] PRP marked as complete
- [ ] README reflects new features

---

## Execution Workflow Summary

```
┌─────────────────────────────────────┐
│ Phase 1: Context Loading            │
│ - Read PRP, CLAUDE.md, source code  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Phase 2: ULTRATHINK Planning        │
│ - Decompose, estimate, optimize     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Phase 3: Implementation (TDD)       │
│ - Write tests → Code → Refactor     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Phase 4: Validation                 │
│ - Tests, types, lint, security      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Phase 5: Review                     │
│ - Code quality, coverage, docs      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Phase 6: Documentation              │
│ - Update CLAUDE.md, TASK.md, PRP    │
└─────────────────────────────────────┘
```

---

## Error Handling

### If Phase 1 Fails:
- PRP incomplete → Request clarification from stakeholder
- Architecture unclear → Review related PRPs and codebase

### If Phase 2 Fails:
- Cost too high → Reevaluate provider routing
- Task dependencies complex → Break into smaller PRPs

### If Phase 3 Fails:
- Tests not passing → Debug implementation
- Type errors → Fix TypeScript issues before proceeding

### If Phase 4 Fails:
- Coverage low → Add more tests
- OpenAI detected → Refactor to use allowed providers

### If Phase 5 Fails:
- Code quality issues → Refactor
- Security vulnerabilities → Fix before deployment

### If Phase 6 Fails:
- Documentation incomplete → Add missing sections
- PRP status unclear → Update status and metrics

---

## Usage

```bash
# Execute PRP
/execute-prp PRPs/[feature-name].md

# Resume execution from specific phase
/execute-prp PRPs/[feature-name].md --phase 3

# Dry run (validation only)
/execute-prp PRPs/[feature-name].md --dry-run
```

---

## Success Metrics

After PRP execution:
- ✅ All tests passing
- ✅ TypeScript compiles cleanly
- ✅ Cost savings ≥80%
- ✅ Documentation updated
- ✅ No security vulnerabilities
- ✅ No OpenAI references
- ✅ Feature deployed to RunPod (if applicable)
