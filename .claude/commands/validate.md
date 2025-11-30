# Multi-Phase Validation Workflow

Run comprehensive validation checks across frontend, backend, and environment.

## Critical Rules

- **NO OpenAI models** - Use Claude, DeepSeek, Qwen only
- **API keys in .env only** - Never hardcode
- **TDD methodology** - Tests must pass before deployment

---

## Validation Phases

### Phase 1: Frontend Lint + Type Check

```bash
cd /Users/tmkipper/Desktop/tk_projects/ai-development-cockpit
npm run lint
npx tsc --noEmit
```

**Success Criteria**:
- Zero ESLint errors
- Zero TypeScript compilation errors
- All imports resolved correctly

---

### Phase 2: Build Verification

```bash
npm run build
```

**Success Criteria**:
- Next.js builds without errors
- No missing dependencies
- Static optimization successful
- Build output in `.next/` directory

---

### Phase 3: Test Suite

```bash
npm test
```

**Success Criteria**:
- All unit tests pass
- All integration tests pass
- Test coverage meets thresholds
- No flaky tests

**Key Test Suites**:
- `FrontendDeveloper.test.ts` (17 tests)
- `Tester.test.ts` (24 tests)
- `DevOpsEngineer.test.ts` (30 tests)
- `graph.integration.test.ts` (27 tests)

---

### Phase 4: Dev Server Test

```bash
npm run dev &
DEV_PID=$!
sleep 5

# Test endpoints
curl -f http://localhost:3000/ || echo "Home page failed"
curl -f http://localhost:3000/chat || echo "Chat page failed"
curl -f http://localhost:3000/api/health || echo "Health check failed"

kill $DEV_PID
```

**Success Criteria**:
- Server starts on port 3000
- `/` returns 200 OK
- `/chat` returns 200 OK
- `/api/health` returns healthy status

---

### Phase 5: Environment Check

```bash
# Check required environment variables
test -n "$ANTHROPIC_API_KEY" && echo "✓ ANTHROPIC_API_KEY" || echo "✗ ANTHROPIC_API_KEY missing"
test -n "$DEEPSEEK_API_KEY" && echo "✓ DEEPSEEK_API_KEY" || echo "✗ DEEPSEEK_API_KEY missing"
test -n "$DASHSCOPE_API_KEY" && echo "✓ DASHSCOPE_API_KEY" || echo "✗ DASHSCOPE_API_KEY missing"
test -n "$NEXT_PUBLIC_SUPABASE_URL" && echo "✓ NEXT_PUBLIC_SUPABASE_URL" || echo "✗ NEXT_PUBLIC_SUPABASE_URL missing"
test -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" && echo "✓ NEXT_PUBLIC_SUPABASE_ANON_KEY" || echo "✗ NEXT_PUBLIC_SUPABASE_ANON_KEY missing"
test -n "$GITHUB_CLIENT_ID" && echo "✓ GITHUB_CLIENT_ID" || echo "✗ GITHUB_CLIENT_ID missing"
test -n "$GITHUB_CLIENT_SECRET" && echo "✓ GITHUB_CLIENT_SECRET" || echo "✗ GITHUB_CLIENT_SECRET missing"
```

**Success Criteria**:
- All 7 required environment variables present
- No hardcoded API keys in codebase
- `.env` file exists and is in `.gitignore`

---

## OpenAI Detection

```bash
# Ensure NO OpenAI usage
grep -r "openai" src/ --exclude-dir=node_modules || echo "✓ No OpenAI references"
grep -r "gpt-" src/ --exclude-dir=node_modules || echo "✓ No GPT model references"
```

**Success Criteria**:
- Zero mentions of "openai" in source code
- Zero mentions of "gpt-3.5" or "gpt-4" model names

---

## Validation Report

After all phases complete, generate summary:

```
====================================
AI Development Cockpit - Validation
====================================
Phase 1: Lint + Types      [ PASS / FAIL ]
Phase 2: Build             [ PASS / FAIL ]
Phase 3: Tests             [ PASS / FAIL ]
Phase 4: Dev Server        [ PASS / FAIL ]
Phase 5: Environment       [ PASS / FAIL ]
OpenAI Check               [ PASS / FAIL ]
====================================
Overall Status: [ READY / BLOCKED ]
====================================
```

---

## Troubleshooting

### Build Failures
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Test Failures
```bash
# Run specific test suite
npm test -- FrontendDeveloper.test.ts --verbose
```

### Environment Issues
```bash
# Copy from example
cp .env.example .env
# Then manually add API keys
```

---

## Pre-Commit Checklist

Before committing code:
- [ ] All 5 validation phases pass
- [ ] No OpenAI references
- [ ] TDD tests written and passing
- [ ] Environment variables documented in `.env.example`
- [ ] No hardcoded secrets
