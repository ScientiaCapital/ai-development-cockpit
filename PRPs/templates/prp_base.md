# PRP: [Feature Name]

**Generated**: [Date]
**Author**: [Name/AI Agent]
**Status**: Draft / Ready for Execution / In Progress / Complete
**Estimated Cost Savings**: [X]% vs Claude-only
**Estimated Completion Time**: [Y] hours

---

## 1. Feature Overview

### Purpose
[What problem does this feature solve? Why is it needed?]

### Stakeholder
[Who requested this feature? Non-coder user, DevOps engineer, product manager, etc.]

### Success Criteria
- [ ] [Measurable outcome 1]
- [ ] [Measurable outcome 2]
- [ ] [Measurable outcome 3]

### User Story
```
As a [user type],
I want to [action],
So that [benefit].
```

---

## 2. LangGraph Integration

### Affected Nodes
- [ ] **buildNode** - BackendDeveloper + FrontendDeveloper spawn
- [ ] **testNode** - Tester (unit + e2e) spawn
- [ ] **deployNode** - DevOpsEngineer (vercel/docker/github-actions) spawn
- [ ] **feedbackNode** - Cost/time aggregation

### State Updates
```typescript
interface GraphState {
  // Existing fields
  userRequest: string;
  backendCode?: CodeOutput;
  frontendCode?: CodeOutput;
  testResults?: TestResults;
  deploymentStatus?: DeploymentStatus;

  // New fields for this feature
  [newField]?: [Type];
}
```

### Routing Logic
```
┌─────────────┐
│ User Input  │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌──────────────┐
│ buildNode   │────▶│ [New Node]   │
└─────────────┘     └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ testNode     │
                    └──────────────┘
```

### Error Handling
- Timeout: [X] seconds
- Retry Logic: [Y] attempts
- Fallback Strategy: [Description]

---

## 3. Agent Team Assignments

### BackendDeveloper
**Language**: Python / Go / Rust / TypeScript
**Framework**: FastAPI / Gin / Actix-web / Express
**Responsibilities**:
- [ ] Generate API endpoints
- [ ] Implement business logic
- [ ] Add database models/queries
- [ ] Write unit tests

**Deliverables**:
- [ ] `[backend-file-1].py/go/rs/ts`
- [ ] `[backend-test-1].test.py/go/rs/ts`

### FrontendDeveloper
**Framework**: React 18, Next.js 15
**Styling**: Tailwind CSS, shadcn/ui
**Responsibilities**:
- [ ] Create UI components
- [ ] Implement state management
- [ ] Add client-side validation
- [ ] Write component tests

**Deliverables**:
- [ ] `src/components/[Component].tsx`
- [ ] `src/components/[Component].test.tsx`

### Tester
**Unit Tests**: Jest, Vitest
**E2E Tests**: Playwright
**Coverage Target**: 80%+
**Responsibilities**:
- [ ] Write unit tests for new code
- [ ] Write integration tests for workflows
- [ ] Write E2E tests for user journeys
- [ ] Validate edge cases

**Deliverables**:
- [ ] `tests/unit/[feature].test.ts`
- [ ] `tests/integration/[feature].test.ts`
- [ ] `tests/e2e/[feature].spec.ts`

### DevOpsEngineer
**Platforms**: Vercel (frontend), RunPod (serverless), Docker Hub
**CI/CD**: GitHub Actions
**Responsibilities**:
- [ ] Update deployment configs
- [ ] Add environment variables
- [ ] Configure CI/CD pipelines
- [ ] Monitor production

**Deliverables**:
- [ ] `Dockerfile.serverless` (if needed)
- [ ] `.github/workflows/[workflow].yml` (if needed)
- [ ] Updated `.env.example`

---

## 4. Cost Optimization Strategy

### Provider Selection
| Task | Provider | Model | Cost per 1M tokens | Reasoning |
|------|----------|-------|-------------------|-----------|
| Code Generation | DeepSeek | deepseek-chat | $0.27 | Cheapest, good code quality |
| Visual Analysis | Qwen | qwen-vl-plus | $0.31 | Best for UI/UX validation |
| Complex Reasoning | Claude | sonnet-4.5 | $3.00 | Only when necessary |

### Cost Calculation
```
Estimated Token Usage:
- Code generation: [X]K tokens
- Validation: [Y]K tokens
- Testing: [Z]K tokens

Claude-only cost: [X+Y+Z]K × $3.00/1M = $[A]
Optimized cost:
  - DeepSeek: [X]K × $0.27/1M = $[B]
  - Qwen: [Y]K × $0.31/1M = $[C]
  - Claude: [Z]K × $3.00/1M = $[D]
Total: $[B+C+D]

Savings: ([A] - [B+C+D]) / [A] × 100 = [E]%
```

### Circuit Breaker Configuration
```typescript
{
  maxRetries: 3,
  timeout: 30000, // 30 seconds
  fallbackChain: ['deepseek', 'qwen', 'claude']
}
```

---

## 5. Language Adapter Implementation

### Adapter Pattern
```typescript
interface LanguageAdapter {
  language: 'python' | 'go' | 'rust' | 'typescript';
  generateCode(prompt: string): Promise<CodeOutput>;
  validateSyntax(code: string): Promise<boolean>;
  runTests(code: string): Promise<TestResults>;
}
```

### [Language] Adapter
**File**: `src/adapters/[Language]Adapter.ts`

**Methods**:
```typescript
class [Language]Adapter implements LanguageAdapter {
  async generateCode(prompt: string): Promise<CodeOutput> {
    // Use DeepSeek for code generation
    const provider = new DeepSeekProvider();
    const code = await provider.generateCode(prompt, this.language);
    return { language: this.language, code };
  }

  async validateSyntax(code: string): Promise<boolean> {
    // Run language-specific syntax checker
    // Python: black --check
    // Go: gofmt -l
    // Rust: rustfmt --check
    // TypeScript: tsc --noEmit
  }

  async runTests(code: string): Promise<TestResults> {
    // Run language-specific test runner
    // Python: pytest
    // Go: go test
    // Rust: cargo test
    // TypeScript: jest
  }
}
```

**Test Coverage**:
- [ ] `generateCode()` returns valid code
- [ ] `validateSyntax()` catches syntax errors
- [ ] `runTests()` executes and reports results

---

## 6. Validation Plan

### Pre-Implementation Checks
- [ ] Architecture diagram reviewed
- [ ] Cost estimate calculated (≥80% savings)
- [ ] Test plan written (TDD)
- [ ] No OpenAI references planned

### Unit Tests
```typescript
describe('[Feature]', () => {
  it('should [behavior 1]', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should [behavior 2]', () => {
    // Arrange
    // Act
    // Assert
  });

  it('should handle [edge case]', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

### Integration Tests
```typescript
describe('[Feature] Integration', () => {
  it('should integrate with LangGraph buildNode', async () => {
    // Test node integration
  });

  it('should update GraphState correctly', async () => {
    // Test state management
  });
});
```

### E2E Tests
```typescript
test('[Feature] E2E workflow', async ({ page }) => {
  // Navigate to feature
  // Interact with UI
  // Verify output
  // Check backend updates
});
```

### Coverage Target
- Unit tests: ≥80%
- Integration tests: All critical paths
- E2E tests: Happy path + 2 error scenarios

---

## 7. Theme Integration

### Arcade Theme (Green terminal aesthetic)
```typescript
// Color palette
{
  primary: '#00ff00',
  secondary: '#00aa00',
  background: '#000000',
  text: '#00ff00',
  font: 'JetBrains Mono'
}

// Animations
- Typing effect for code generation
- Cursor blink in input fields
- Matrix-style rain effect (optional)
```

### Enterprise Theme (Blue professional)
```typescript
// Color palette
{
  primary: '#0066cc',
  secondary: '#004499',
  background: '#f5f5f5',
  text: '#333333',
  font: 'Inter'
}

// Animations
- Smooth fade transitions
- Slide-in panels
- Loading spinners
```

### UI Components
- [ ] Update theme toggle to support new feature
- [ ] Ensure components work in both themes
- [ ] Test color contrast for accessibility

---

## 8. Deployment Strategy

### Vercel (Frontend)
```bash
# Build configuration
npm run build

# Environment variables
NEXT_PUBLIC_[VARIABLE]=[VALUE]

# Deploy
vercel --prod
```

### RunPod (Serverless)
```bash
# Docker build
docker build -f Dockerfile.serverless -t tmk74/ai-development-cockpit:latest .

# Push to Docker Hub
docker push tmk74/ai-development-cockpit:latest

# Deploy to RunPod
# Use template ID: t5tolm6jo7
# Endpoint ID: xb46cmloysnzro
```

### Environment Variables
```bash
# Add to .env.example
[NEW_VARIABLE]=[Description]

# Document in README
- [NEW_VARIABLE]: [Purpose, where to get it]
```

### Monitoring
- [ ] Add health check endpoint (if needed)
- [ ] Configure Supabase logging
- [ ] Set up RunPod dashboard alerts

---

## 9. Success Metrics

### Technical Metrics
- [ ] All tests passing (100%)
- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes with zero warnings
- [ ] Cost savings ≥80% achieved
- [ ] No OpenAI references

### Performance Metrics
- [ ] API response time: <[X]ms
- [ ] Page load time: <[Y]ms
- [ ] Test execution time: <[Z]s

### User Metrics
- [ ] Feature solves stated problem
- [ ] User can complete workflow without errors
- [ ] Documentation clear and complete

---

## 10. Rollout Plan

### Phase 1: Development
- [ ] Implement feature (TDD)
- [ ] Pass all validation gates
- [ ] Update documentation

### Phase 2: Testing
- [ ] Manual QA testing
- [ ] Automated E2E tests
- [ ] Performance testing

### Phase 3: Staging
- [ ] Deploy to Vercel preview
- [ ] Test with real API keys
- [ ] Verify cost optimization

### Phase 4: Production
- [ ] Deploy to Vercel production
- [ ] Monitor for errors
- [ ] Gather user feedback

### Phase 5: Iteration
- [ ] Address user feedback
- [ ] Optimize performance
- [ ] Plan next features

---

## 11. Dependencies

### External APIs
- [ ] [API Name]: [Purpose]
  - Authentication: [Method]
  - Rate limits: [Limits]
  - Cost: [Pricing]

### npm Packages
```json
{
  "[package-name]": "^[version]"
}
```

### System Requirements
- Node.js ≥18
- Docker (for serverless)
- [Other requirements]

---

## 12. Risk Assessment

### Technical Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| [Risk 1] | High/Med/Low | High/Med/Low | [Strategy] |
| [Risk 2] | High/Med/Low | High/Med/Low | [Strategy] |

### Business Risks
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cost overrun | Low | Medium | Circuit breaker enforced |
| User adoption low | Medium | High | User testing before launch |

---

## 13. Checklist

### Pre-Execution
- [ ] PRP reviewed and approved
- [ ] Cost estimate validated
- [ ] Test plan complete
- [ ] Architecture diagram finalized

### During Execution
- [ ] TDD methodology followed
- [ ] All validation gates passed
- [ ] Documentation updated continuously

### Post-Execution
- [ ] All tests passing
- [ ] Feature deployed
- [ ] Metrics collected
- [ ] PRP marked as complete

---

## 14. Notes

[Additional context, references, or decisions made during planning]

---

## 15. Change Log

| Date | Change | Author |
|------|--------|--------|
| [Date] | PRP created | [Name] |
| [Date] | [Update description] | [Name] |

---

**Status**: [Draft / Ready for Execution / In Progress / Complete]
**Last Updated**: [Date]
