# PRP Generation - Multi-Agent Features

Generate Precision Research Plans (PRPs) for AI Development Cockpit features.

## Context Loading

Before generating PRP, read:
1. `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/CLAUDE.md` - Project status
2. `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/src/orchestrator/graph.ts` - LangGraph orchestrator
3. `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/src/adapters/` - Language adapters
4. `/Users/tmkipper/Desktop/tk_projects/ai-development-cockpit/src/services/costOptimizer.ts` - Cost optimizer

---

## PRP Template Structure

### 1. Feature Overview
- **Name**: Clear, descriptive feature name
- **Purpose**: What problem does this solve?
- **Stakeholder**: Who requested this? (Non-coder user, DevOps engineer, etc.)
- **Success Criteria**: Measurable outcomes

### 2. LangGraph Integration
- **Nodes**: Which graph nodes will be affected?
  - `buildNode` - BackendDeveloper + FrontendDeveloper
  - `testNode` - Tester (unit + e2e)
  - `deployNode` - DevOpsEngineer (vercel/docker/github-actions)
  - `feedbackNode` - Cost/time aggregation
- **State Updates**: What fields in `GraphState` change?
- **Routing Logic**: Conditional edges, error handling

### 3. Agent Team Patterns

**BackendDeveloper**:
- Language: Python/Go/Rust/TypeScript
- Framework: FastAPI/Gin/Actix-web/Express
- Database: PostgreSQL/MongoDB/Redis

**FrontendDeveloper**:
- Framework: React 18, Next.js 15
- Styling: Tailwind CSS, shadcn/ui
- State Management: Zustand, React Query

**Tester**:
- Unit Tests: Jest, Vitest
- E2E Tests: Playwright
- Coverage: 80%+ threshold

**DevOpsEngineer**:
- Platforms: Vercel (frontend), RunPod (serverless), Docker Hub
- CI/CD: GitHub Actions
- Monitoring: Supabase logs, RunPod dashboard

### 4. Multi-Provider Cost Optimization

**Strategy**: Route requests to cheapest available provider

| Provider | Model | Cost per 1M tokens | Use Case |
|----------|-------|-------------------|----------|
| DeepSeek | deepseek-chat | $0.27 | Code generation |
| Qwen | qwen-vl-plus | $0.31 | Visual analysis |
| Claude | sonnet-4.5 | $3.00 | Complex reasoning |

**Circuit Breaker**:
- Max retries: 3
- Timeout: 30s
- Fallback: Next cheapest provider

### 5. Language Adapter Pattern

```typescript
interface LanguageAdapter {
  language: 'python' | 'go' | 'rust' | 'typescript';
  generateCode(prompt: string): Promise<CodeOutput>;
  validateSyntax(code: string): Promise<boolean>;
  runTests(code: string): Promise<TestResults>;
}
```

**Python Adapter** (`src/adapters/PythonAdapter.ts`):
- Generates FastAPI routes
- Uses `black` for formatting
- Runs `pytest` for testing

**Go Adapter** (`src/adapters/GoAdapter.ts`):
- Generates Gin handlers
- Uses `gofmt` for formatting
- Runs `go test` for testing

**Rust Adapter** (`src/adapters/RustAdapter.ts`):
- Generates Actix-web routes
- Uses `rustfmt` for formatting
- Runs `cargo test` for testing

**TypeScript Adapter** (`src/adapters/TypeScriptAdapter.ts`):
- Generates Express routes
- Uses `prettier` for formatting
- Runs `jest` for testing

### 6. Validation Gates

**Pre-Implementation**:
- [ ] Architecture diagram reviewed
- [ ] Cost estimate calculated (must save ≥80% vs Claude-only)
- [ ] Test plan written (TDD)

**Post-Implementation**:
- [ ] All tests pass (`npm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] No OpenAI references (`grep -r "openai" src/`)
- [ ] Environment variables documented in `.env.example`

### 7. Theme Integration

**Arcade Theme** (Green terminal aesthetic):
```typescript
{
  primary: '#00ff00',
  background: '#000000',
  font: 'JetBrains Mono',
  animations: 'typing cursor blink'
}
```

**Enterprise Theme** (Blue professional):
```typescript
{
  primary: '#0066cc',
  background: '#f5f5f5',
  font: 'Inter',
  animations: 'fade slide'
}
```

---

## Example PRP Generation Workflow

```bash
# Step 1: User describes feature in plain English
User: "I want to add a Rust backend that handles image processing with GPU acceleration"

# Step 2: Extract requirements
Requirements:
- Language: Rust
- Framework: Actix-web
- GPU: CUDA support
- Deployment: RunPod serverless

# Step 3: Generate PRP document
File: PRPs/rust-gpu-image-processing.md
- Feature overview
- LangGraph nodes affected: buildNode, deployNode
- Agent: BackendDeveloper (Rust)
- Adapter: RustAdapter
- Cost optimization: Use DeepSeek for code gen ($0.27/1M tokens)
- Validation: Unit tests with mock GPU, E2E tests on RunPod

# Step 4: Save PRP
cp PRPs/templates/prp_base.md PRPs/rust-gpu-image-processing.md
# Fill in template
```

---

## Critical Rules for PRP Generation

1. **NO OpenAI** - All code generation uses Claude/DeepSeek/Qwen
2. **Cost Optimization Required** - Must achieve ≥80% savings vs Claude-only
3. **TDD Mandatory** - Tests written before implementation
4. **Multi-Language Support** - Must work with Python/Go/Rust/TypeScript
5. **RunPod Ready** - All features must deploy to serverless endpoint

---

## PRP Review Checklist

Before marking PRP as "Ready for Execution":
- [ ] Feature aligns with multi-agent orchestration vision
- [ ] Cost savings calculated and validated
- [ ] Test plan includes unit + integration + e2e tests
- [ ] Language adapter pattern followed
- [ ] LangGraph state transitions documented
- [ ] Agent team responsibilities clear
- [ ] Theme integration specified (arcade or enterprise)
- [ ] Environment variables documented
- [ ] No hardcoded secrets
- [ ] Deployment strategy defined (Vercel/RunPod/Docker)

---

## Output Format

```markdown
# PRP: [Feature Name]

**Generated**: [Date]
**Status**: Draft / Ready for Execution / In Progress / Complete
**Estimated Cost Savings**: [X]% vs Claude-only

## 1. Feature Overview
...

## 2. LangGraph Integration
...

## 3. Agent Team Assignments
...

## 4. Cost Optimization Strategy
...

## 5. Language Adapter Implementation
...

## 6. Validation Plan
...

## 7. Deployment Strategy
...

## 8. Success Metrics
...
```

---

## Usage

```bash
# Generate PRP for new feature
/generate-prp "Add Redis caching layer to reduce API costs"

# Review existing PRP
/generate-prp --review PRPs/redis-caching-layer.md

# Validate PRP before execution
/validate-prp PRPs/redis-caching-layer.md
```
