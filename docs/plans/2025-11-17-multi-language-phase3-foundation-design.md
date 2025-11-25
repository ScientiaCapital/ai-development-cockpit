# Multi-Language + Phase 3 Foundation Design

**Date**: 2025-11-17
**Status**: Approved for Implementation
**Timeline**: 12 hours
**Owner**: Enterprise

---

## Goal

Enable AI Development Cockpit agents to generate production code in Python, Go, and Rust. Build a multi-model orchestrator with JSON validation running 24/7 on RunPod.

**User Impact**: Coding noobs can now build apps in any major language, not just TypeScript/JavaScript.

---

## Success Criteria

- All 5 agents generate valid code in Python (FastAPI), Go (Gin), Rust (Actix-web)
- Multi-model provider system routes tasks to optimal models (Claude 4.5, Qwen, DeepSeek, Gemini)
- Python JSON validator service enforces schema compliance using Outlines + Pydantic
- Complete system runs 24/7 on RunPod serverless with auto-scaling
- End-to-end test passes: text request → validated plan → agents build code → GitHub PR created

---

## Architecture

### Component 1: Language Adapter System

**Purpose**: Transform agent outputs into language-specific, production-ready code.

**Interface**:
```typescript
interface LanguageAdapter {
  language: 'python' | 'go' | 'rust' | 'typescript'
  adaptCode(output: AgentOutput, context: ProjectContext): AdaptedCode
  getProjectStructure(): FileStructure
  getTestingFramework(): TestFramework
  formatCode(code: string): Promise<string>
}
```

**Implementations**:

1. **PythonAdapter**
   - Frameworks: FastAPI (default), Django, Flask
   - Testing: pytest + pytest-asyncio
   - Formatting: black + isort
   - Structure: `src/`, `tests/`, `requirements.txt`, `pyproject.toml`
   - Conventions: Type hints, docstrings, PEP 8

2. **GoAdapter**
   - Frameworks: Gin (default), Echo, Fiber
   - Testing: built-in `testing` + testify
   - Formatting: gofmt
   - Structure: `cmd/`, `internal/`, `pkg/`, `go.mod`
   - Conventions: Exported names, error handling patterns, idiomatic Go

3. **RustAdapter**
   - Frameworks: Actix-web (default), Rocket, Axum
   - Testing: cargo test + proptest
   - Formatting: rustfmt + clippy
   - Structure: `src/`, `tests/`, `Cargo.toml`
   - Conventions: Ownership patterns, Result types, error handling

**Data Flow**:
```
Agent.execute()
  → generates generic code representation
  → LanguageAdapter.adaptCode(output, {language: 'python', framework: 'fastapi'})
  → outputs Python FastAPI code with type hints, error handling, logging
  → formatCode() applies black formatting
  → returns formatted, production-ready code
```

**Benefits**:
- Agents stay generic (don't need language-specific logic)
- Easy to add new languages (just implement LanguageAdapter)
- Consistent patterns across all languages
- Formatting handled automatically

---

### Component 2: Multi-Model Provider System

**Purpose**: Abstract model APIs, enable intelligent routing based on task type and cost.

**Interface**:
```typescript
interface IProvider {
  name: string
  capabilities: {
    vision: boolean      // Images/PDFs
    jsonMode: boolean    // Structured output
    streaming: boolean
    contextWindow: number
  }

  generateCompletion(params: CompletionParams): Promise<CompletionResult>
  generateWithVision(params: VisionParams): Promise<CompletionResult>
  calculateCost(tokens: TokenUsage): number
}
```

**Provider Implementations**:

1. **ClaudeProvider** (Anthropic Claude 4.5 Sonnet)
   - Best for: Orchestration, complex reasoning, high-quality code
   - Vision: Native support
   - JSON mode: Via prompt engineering
   - Cost: $3/M input, $15/M output

2. **QwenProvider** (Alibaba Qwen2.5-VL)
   - Best for: VLM tasks (PDF/image parsing), cheap/free tier
   - Vision: Excellent (long-context PDFs)
   - JSON mode: Yes
   - Cost: Free tier available, very cheap

3. **DeepSeekProvider** (DeepSeek-V3)
   - Best for: Code generation, very low cost, fast
   - Vision: No (text-only)
   - JSON mode: Yes
   - Cost: $0.14/M input, $0.28/M output (95% cheaper than Claude)

4. **GeminiProvider** (Google Gemini 1.5 Pro)
   - Best for: Document parsing, massive context windows
   - Vision: Excellent (2M token context)
   - JSON mode: Yes
   - Cost: $1.25/M input, $5/M output

**ModelRouter Logic**:
```typescript
class ModelRouter {
  selectProvider(task: TaskType, context: RouterContext): IProvider {
    switch(task) {
      case 'vision':
        return context.preferCost ? qwenProvider : geminiProvider

      case 'orchestration':
        return claudeProvider  // Best reasoning

      case 'code-generation':
        return context.complexity === 'high'
          ? claudeProvider
          : deepseekProvider  // 95% cheaper

      case 'test-generation':
        return deepseekProvider  // Good at code understanding, very cheap
    }
  }
}
```

**Cost Optimization**:
- 70% of requests → DeepSeek (cheapest)
- 20% of requests → Qwen (free tier VLM)
- 10% of requests → Claude (complex orchestration)
- Expected savings: 90% vs all-Claude approach

---

### Component 3: Python JSON Validator Service

**Purpose**: Enforce strict schema compliance for orchestrator plans and agent outputs.

**Tech Stack**:
- FastAPI (Python 3.12)
- Pydantic v2 (schema definition + validation)
- Outlines (constrained generation)
- Deployed on RunPod serverless

**Core Schemas**:
```python
from pydantic import BaseModel
from typing import Literal

class AgentTask(BaseModel):
    agent_type: Literal['CodeArchitect', 'BackendDeveloper', 'FrontendDeveloper', 'Tester', 'DevOpsEngineer']
    description: str
    dependencies: list[str] = []
    estimated_duration: int  # minutes

class OrchestratorPlan(BaseModel):
    project_name: str
    language: Literal['typescript', 'python', 'go', 'rust']
    framework: str
    tasks: list[AgentTask]
    total_estimated_time: int

class GeneratedFile(BaseModel):
    path: str
    content: str
    description: str

class AgentOutput(BaseModel):
    agent_type: str
    files_created: list[GeneratedFile]
    files_modified: list[GeneratedFile]
    warnings: list[str] = []
    errors: list[str] = []
```

**API Endpoints**:
```python
POST /validate/plan
  Body: { "data": {...} }
  Returns: { "valid": bool, "errors": [...], "validated_data": {...} }

POST /validate/agent-output
  Body: { "data": {...} }
  Returns: { "valid": bool, "errors": [...], "validated_data": {...} }

POST /generate-with-schema
  Body: { "prompt": str, "schema_name": str, "provider": str }
  Returns: { "json": {...}, "valid": true }
  # Uses Outlines for constrained generation
```

**Integration**:
```typescript
// In orchestrator
const validator = new JSONValidationClient('http://localhost:8001')

const planValidation = await validator.validatePlan(rawPlan)
if (!planValidation.valid) {
  throw new Error(`Invalid plan: ${planValidation.errors}`)
}

const plan = planValidation.validated_data
```

**Deployment**:
- Runs on port 8001 (separate from Next.js on 3001)
- Docker container with python:3.12-slim base
- Deployed to RunPod serverless
- Auto-scales 0→10 instances
- Health check endpoint: `GET /health`

---

### Component 4: RunPod 24/7 Deployment

**Purpose**: Run the entire AI Development Cockpit as a scalable, always-on service.

**Architecture** (following sales-agent patterns):

**Pod 1: Agent Workers (Node.js)**
```dockerfile
FROM node:20-alpine
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY src/ ./src/
COPY handler.js ./
USER appuser
CMD ["node", "handler.js"]
```

**Pod 2: Python Validator**
```dockerfile
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1
COPY requirements-serverless.txt .
RUN pip install --no-cache-dir -r requirements-serverless.txt
COPY app/ ./app/
COPY handler.py ./
USER appuser
CMD ["python", "-u", "handler.py"]
```

**GitHub Workflow** (linux/amd64 only):
```yaml
name: Deploy to RunPod

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-agent-workers:
    runs-on: ubuntu-latest  # linux/amd64
    steps:
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v5
        with:
          context: ./
          file: ./Dockerfile.serverless
          push: true
          platforms: linux/amd64
          tags: ghcr.io/enterprise/ai-dev-cockpit:agent-workers
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**RunPod Handler** (Node.js):
```typescript
const runpod = require('runpod-sdk');
const { AgentOrchestrator } = require('./src/orchestrator/AgentOrchestrator');

async function handleJob(input) {
  const { task, config } = input;

  if (task === 'build-project') {
    const orchestrator = new AgentOrchestrator(config);
    const result = await orchestrator.execute();

    return {
      success: true,
      task: 'build-project',
      result,
      pr_url: result.prUrl
    };
  }

  throw new Error(`Unknown task: ${task}`);
}

runpod.start({ handler: handleJob });
```

**Scaling**:
- Auto-scale: 0→10 workers based on queue depth
- Cold start: <5s with FlashBoot
- Cost: Pay per second of execution
- Sleep: Scale to zero when idle

**Environment Variables** (set in RunPod Console):
- `ANTHROPIC_API_KEY`
- `DEEPSEEK_API_KEY`
- `QWEN_API_KEY`
- `GITHUB_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_KEY`

---

## End-to-End Workflow

**User Journey**:

1. **User Input** (Multi-Modal)
   - Text: "Build a REST API for task management"
   - PDF: Architecture diagram
   - Image: Database schema

2. **Vision Processing**
   - ModelRouter selects: QwenProvider (cheap VLM)
   - Extracts text from PDF, interprets schema from image
   - Returns structured requirements JSON

3. **Plan Generation**
   - ModelRouter selects: ClaudeProvider (Claude 4.5 Sonnet)
   - Generates OrchestratorPlan JSON
   - JSONValidationService validates against Pydantic schema
   - UI shows plan → User approves

4. **Agent Execution** (Parallel)
   - CodeArchitect: DeepSeek generates architecture → PythonAdapter transforms
   - BackendDeveloper: DeepSeek generates FastAPI routes → PythonAdapter adds types
   - FrontendDeveloper: DeepSeek generates React components
   - Tester: DeepSeek generates pytest tests
   - DevOpsEngineer: DeepSeek generates Dockerfile
   - All outputs validated by JSONValidationService

5. **Output Assembly**
   - ProjectWorkspace writes files:
     ```
     /python-project/
       src/
         models/
         routes/
         services/
       tests/
       requirements.txt
       Dockerfile
       pyproject.toml
     ```

6. **GitHub Integration**
   - GitHubPRService creates branch: `ai-generated-task-api`
   - Commits all files
   - Opens PR with attribution
   - Returns PR URL to user

**Total Time**: ~5-10 minutes for medium complexity project

---

## Testing Strategy

**1. Unit Tests**
- Language adapters: `tests/adapters/*.test.ts`
- Providers: `tests/providers/*.test.ts`
- Model router: `tests/orchestrator/ModelRouter.test.ts`
- Coverage target: 90%+

**2. Integration Tests**
- Multi-language code generation: `tests/integration/multi-language.test.ts`
- Provider switching: `tests/integration/providers.test.ts`
- JSON validation: `tests/integration/validator.test.ts`

**3. E2E Tests**
- Full workflow: `tests/e2e/orchestrator.test.ts`
- Test: Text → Plan → Agents → PR
- Verify: Generated code compiles/runs
- Verify: PR created on GitHub

**4. RunPod Tests**
- Manual trigger via GitHub Actions
- Monitor logs: `gh run watch`
- Verify results in database

---

## 12-Hour Implementation Timeline

### Hours 1-3: Language Adapter Foundation
- Hour 1: LanguageAdapter interface + PythonAdapter stub
- Hour 2: PythonAdapter implementation + tests
- Hour 3: GoAdapter implementation + tests

### Hours 4-6: Complete Multi-Language
- Hour 4: RustAdapter implementation + tests
- Hour 5: Integrate adapters into all 5 agents
- Hour 6: E2E test (generate Python/Go/Rust projects)

### Hours 7-9: Provider System
- Hour 7: IProvider interface + ClaudeProvider
- Hour 8: QwenProvider + DeepSeekProvider
- Hour 9: ModelRouter + ProviderRegistry

### Hours 10-11: JSON Validator + RunPod
- Hour 10: FastAPI validator service + Pydantic schemas
- Hour 11: RunPod deployment + GitHub workflow

### Hour 12: Integration & Polish
- First 30 min: GitHub login button
- Last 30 min: E2E test + documentation

---

## File Structure

```
ai-development-cockpit/
├── src/
│   ├── adapters/
│   │   ├── LanguageAdapter.ts           # NEW
│   │   ├── PythonAdapter.ts             # NEW
│   │   ├── GoAdapter.ts                 # NEW
│   │   ├── RustAdapter.ts               # NEW
│   │   └── index.ts
│   ├── providers/
│   │   ├── IProvider.ts                 # NEW
│   │   ├── ClaudeProvider.ts            # NEW
│   │   ├── QwenProvider.ts              # NEW
│   │   ├── DeepSeekProvider.ts          # NEW
│   │   ├── GeminiProvider.ts            # NEW (optional)
│   │   ├── ProviderRegistry.ts          # NEW
│   │   └── index.ts
│   ├── orchestrator/
│   │   ├── ModelRouter.ts               # NEW
│   │   └── AgentOrchestrator.ts         # MODIFIED
│   ├── agents/
│   │   └── BaseAgent.ts                 # MODIFIED (add adapter support)
│   └── services/
│       └── validation/
│           └── JSONValidationClient.ts  # NEW
├── python-validator/                    # NEW
│   ├── app/
│   │   ├── schemas.py                   # Pydantic models
│   │   ├── validator.py                 # Validation logic
│   │   └── main.py                      # FastAPI app
│   ├── handler.py                       # RunPod handler
│   ├── requirements-serverless.txt
│   └── Dockerfile.serverless
├── .github/workflows/
│   └── deploy-runpod.yml                # NEW
├── handler.js                           # NEW (Node.js RunPod handler)
├── Dockerfile.serverless                # NEW (Node.js)
└── tests/
    ├── adapters/                        # NEW
    ├── providers/                       # NEW
    ├── integration/                     # NEW
    └── e2e/                             # NEW
```

---

## Risks & Mitigations

**Risk**: Language adapters generate invalid code
**Mitigation**: Comprehensive tests, code formatting tools, validation

**Risk**: Provider API rate limits
**Mitigation**: Request queuing, retry logic, fallback providers

**Risk**: JSON validation service downtime
**Mitigation**: Health checks, auto-restart, fallback to TypeScript Zod

**Risk**: RunPod cold starts too slow
**Mitigation**: Use FlashBoot, keep 1 warm instance, optimize Docker image

**Risk**: Multi-language complexity delays timeline
**Mitigation**: Start with Python only, add Go/Rust if time permits

---

## Future Enhancements (Post 12-Hour)

1. **Additional Languages**: Java, C#, PHP, Ruby
2. **Framework Selection UI**: Let users choose FastAPI vs Django vs Flask
3. **Code Review Agent**: AI agent that reviews generated code before PR
4. **Cost Dashboard**: Real-time cost tracking per provider
5. **A/B Testing**: Compare output quality across providers
6. **Streaming Responses**: Show agent progress in real-time
7. **Multi-Repository**: Generate code across multiple repos

---

## References

**Sales-Agent RunPod Patterns**:
- `/Users/tmkipper/Desktop/tk_projects/sales-agent/backend/Dockerfile.serverless`
- `/Users/tmkipper/Desktop/tk_projects/sales-agent/backend/handler.py`
- `/Users/tmkipper/Desktop/tk_projects/sales-agent/.github/workflows/social-intelligence.yml`

**LLM Orchestration Patterns** (from images):
- Pattern 1: "Create anything with AI" → strict JSON + Claude 3.5 Sonnet
- Pattern 2: "Request/Project AI" → VLM extraction → Claude normalization

**Existing AI Development Cockpit**:
- Phase 1 (MVP): Event-driven orchestration, 2 agents
- Phase 2 (Complete): All 5 agents, GitHub integration, 13 passing tests

---

**Status**: Ready for implementation
**Next**: Set up git worktree, create detailed implementation plan
