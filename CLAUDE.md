# Claude Code Configuration - Dual-Domain LLM Platform

**Last Updated**: 2025-11-05
**Status**: Development - Skills-First Approach
**Branch**: `claude/code-review-analysis-011CUpk9WcLMT9aFDnQKo8Dz`

---

## 🎯 Project Overview

**What We're Building**: A mobile-first PWA that makes 500,000+ AI models accessible through dual-domain positioning:
- **SwaggyStacks.com**: Developer-focused (dark/terminal theme)
- **ScientiaCapital.com**: Enterprise-focused (light/corporate theme)

**Value Proposition**: 97% cost savings vs traditional APIs through RunPod serverless + vLLM

**Current State**: Strong foundation built, needs environment setup and real deployment testing

---

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (fill in your keys)
# Edit .env with your API keys

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:3001
```

### Essential API Keys Needed

**Critical** (must have):
- `ANTHROPIC_API_KEY` - Claude AI (for Skills and development)
- `NEXT_PUBLIC_SUPABASE_URL` - Database and auth
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Database public key

**Important** (core features):
- `RUNPOD_API_KEY` - Model deployments
- `HUGGINGFACE_API_TOKEN` - Model discovery

**Optional** (enhancements):
- Other LLM provider keys as needed

---

## 🎨 Claude Skills (Our Preferred Approach)

We're moving away from MCP servers to **Claude Skills** - they're simpler, more powerful, and team-friendly.

### Available Skills

#### 🏭 Skill Factory (Meta-Skill)
**Purpose**: Generate new skills using natural language
**Usage**: "Create a skill for deploying models to RunPod"
**Location**: `.claude/skills/skill-factory/`

This is your **skill creation copilot**. Just describe what you want to automate, and it will:
1. Analyze your codebase
2. Generate complete SKILL.md
3. Add supporting files (scripts, templates, docs)
4. Test the discovery description
5. Document usage

**Example**:
```
You: "Create a skill for managing Supabase auth"
Claude: *Uses Skill Factory*
        *Analyzes auth codebase*
        *Generates supabase-auth-ops skill*
        *Ready to use!*
```

### Skills to Create Next

**Priority Order**:
1. **runpod-deployment** - Deploy Chinese LLMs to RunPod with vLLM
2. **supabase-auth-ops** - Manage authentication, orgs, RBAC, MFA
3. **dual-domain-theme** - Ensure theme consistency across components
4. **cost-optimization** - Analyze and optimize deployment costs
5. **e2e-testing** - Write and maintain Playwright tests

### Creating a New Skill

Two ways:

**Quick (using Skill Factory)**:
```
You: "Create a skill for [task]"
Claude: *Generates complete skill automatically*
```

**Manual**:
```bash
# 1. Create directory
mkdir -p .claude/skills/my-skill

# 2. Create SKILL.md
# See .claude/skills/skill-factory/templates/ for templates

# 3. Test it
# Ask Claude a question that should trigger the skill
```

### Skill Factory Templates

Located in `.claude/skills/skill-factory/templates/`:
- `service-skill.md` - For wrapping service layers
- `workflow-skill.md` - For multi-step processes
- `analysis-skill.md` - For code analysis and reporting

---

## 📁 Project Structure

```
ai-development-cockpit/
├── .claude/
│   └── skills/              # Claude Skills (NEW: Skills-first approach)
│       └── skill-factory/   # Meta-skill for creating skills
│           ├── SKILL.md
│           ├── templates/   # Skill templates
│           └── examples/    # Example skills
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── swaggystacks/   # Developer landing page
│   │   ├── scientia/        # Enterprise landing page
│   │   ├── marketplace/     # Model discovery
│   │   ├── chat/           # Chat interface
│   │   └── auth/           # Authentication flows
│   ├── components/          # React components (40+)
│   │   ├── deployment/     # RunPod deployment UI
│   │   ├── auth/           # Auth components
│   │   ├── chat/           # Chat UI
│   │   ├── terminal/       # Terminal theme
│   │   └── pwa/            # PWA components
│   ├── services/            # Business logic (25 services)
│   │   ├── runpod/         # 7 services (client, deployment, monitoring, etc)
│   │   ├── huggingface/    # 11 services (api, cache, circuit-breaker, etc)
│   │   ├── inference/      # Streaming and model management
│   │   └── monitoring/     # Observability
│   ├── hooks/              # React hooks
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── tests/
│   ├── e2e/                # Playwright tests
│   │   ├── chaos/          # Chaos engineering
│   │   ├── performance/    # Performance tests
│   │   └── validation/     # Infrastructure validation
│   └── services/           # Unit tests
├── docs/                   # Documentation
├── .env                    # Environment variables (YOU NEED TO CONFIGURE)
├── .env.example            # Template
├── GAPS-AND-PRIORITIES.md  # Current gaps and action plan
└── package.json
```

---

## 🏗️ Architecture

### Tech Stack

**Frontend**:
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + Framer Motion
- PWA (Progressive Web App)

**Services**:
- RunPod (serverless GPU deployments)
- HuggingFace (500K+ model discovery)
- Supabase (auth + database)
- vLLM (inference engine)

**Testing**:
- Playwright (E2E)
- Chaos engineering
- Performance validation

### Service Layers

#### RunPod Services (`src/services/runpod/`)
- `client.ts` - RunPod API client (629 lines)
- `deployment.service.ts` - Deploy models
- `monitoring.service.ts` - Health checks (611 lines)
- `rollback.service.ts` - Automatic rollback (701 lines)
- `cost.service.ts` - Cost estimation (569 lines)
- `vllm.service.ts` - vLLM configuration (721 lines)

#### HuggingFace Services (`src/services/huggingface/`)
- `unified-llm.service.ts` - Main integration (1145 lines)
- `api-client.ts` - HF API wrapper
- `cache.service.ts` - LRU + Redis caching
- `circuit-breaker.ts` - Fault tolerance
- `rate-limiter.ts` - Org-specific rate limiting
- `webhook.service.ts` - Real-time webhooks

### Dual-Domain Strategy

**SwaggyStacks** (Developer-focused):
- Dark/terminal theme
- Code-first messaging
- Cost savings emphasis
- GitHub integration
- CTA: "Start Building Free"

**ScientiaCapital** (Enterprise-focused):
- Light/corporate theme
- ROI and analytics
- Security and compliance
- Enterprise features
- CTA: "Schedule Demo"

---

## 🔧 Development Workflow

### Daily Development

```bash
# 1. Start dev server
npm run dev

# 2. Make changes
# Use Claude Skills to guide development

# 3. Run tests
npm run test:e2e

# 4. Commit
git add .
git commit -m "feat: implement [feature]"
git push origin claude/code-review-analysis-011CUpk9WcLMT9aFDnQKo8Dz
```

### Using Skills During Development

**Example 1: Deploying a Model**
```
You: "Deploy Qwen-7B to RunPod"
Claude: *Uses runpod-deployment skill* (once created)
        *Reads deployment services*
        *Configures vLLM*
        *Estimates costs*
        *Deploys model*
```

**Example 2: Adding Auth**
```
You: "Add organization invitation system"
Claude: *Uses supabase-auth-ops skill* (once created)
        *Reads existing auth code*
        *Implements invitation flow*
        *Updates components*
        *Writes tests*
```

**Example 3: Theme Consistency**
```
You: "Make sure this component matches the theme"
Claude: *Uses dual-domain-theme skill* (once created)
        *Checks current theme*
        *Applies consistent styling*
        *Validates across both domains*
```

### Testing

```bash
# E2E tests
npm run test:e2e                    # All tests
npm run test:e2e:ui                 # With UI
npm run test:e2e:debug              # Debug mode
npm run test:e2e:comprehensive      # Full suite

# Unit tests
npm run test                        # Jest tests
npm run test:watch                  # Watch mode

# Type checking
npm run type-check                  # TypeScript validation
```

---

## 📊 Current Status

### ✅ Complete

**Foundation**:
- ✅ Next.js 14 app with TypeScript
- ✅ Dual-domain routing
- ✅ 25 service modules
- ✅ 40+ React components
- ✅ Comprehensive E2E testing
- ✅ CI/CD workflows
- ✅ Skill Factory (NEW!)

**Services**:
- ✅ RunPod integration (7 services)
- ✅ HuggingFace integration (11 services)
- ✅ Monitoring and observability
- ✅ Cost estimation algorithms
- ✅ Rollback mechanisms

**UI**:
- ✅ SwaggyStacks landing page
- ✅ ScientiaCapital landing page
- ✅ Model marketplace
- ✅ Chat interface
- ✅ Auth flows (login, signup, MFA)
- ✅ Deployment dashboard

### ⚠️ In Progress

**Environment**:
- ⚠️ `.env` created but needs your API keys
- ⚠️ `node_modules` needs `npm install`
- ⚠️ Supabase database needs setup

**Features**:
- ⚠️ 5 TODOs to complete (see GAPS-AND-PRIORITIES.md)
- ⚠️ No real deployments tested yet
- ⚠️ Skills need to be created (we have the factory!)

### ❌ Not Started

**Deployment**:
- ❌ No production deployment
- ❌ No custom domains configured
- ❌ No real users yet

**Advanced**:
- ❌ Analytics/monitoring not connected
- ❌ Payment processing not implemented
- ❌ Team collaboration features minimal

---

## 🎯 Next Steps

### Immediate (Phase 1: Get It Running)

See `GAPS-AND-PRIORITIES.md` for complete plan.

**Right now**:
1. Fill in `.env` with your API keys
2. Run `npm install`
3. Setup Supabase database
4. Run `npm run dev`
5. Verify http://localhost:3001 loads

**This week**:
1. Complete authentication testing
2. Deploy first test model to RunPod
3. Create 2-3 essential skills
4. Complete TODOs in codebase

### Short Term (Phase 2-3: Validate & Polish)

1. Test end-to-end deployment workflow
2. Validate cost estimation accuracy
3. Create remaining priority skills
4. Update documentation
5. Polish UI/UX

### Medium Term (Phase 4: Deploy)

1. Deploy to Vercel
2. Setup custom domains
3. Test PWA on mobile
4. Beta launch

### Long Term (Phase 5: Grow)

1. Get user feedback
2. Iterate on features
3. Optimize costs
4. Scale infrastructure

---

## 💡 Development Tips

### Working with Skills

**Creating Skills**:
- Use Skill Factory for all new skills
- Start with the template that matches your need
- Test with natural language questions
- Iterate on the description until discovery works

**Skill Best Practices**:
- Keep skills focused (one capability per skill)
- Write clear descriptions with trigger keywords
- Include file references with line numbers
- Add practical examples
- Test with real questions

### Working with Services

**Finding Code**:
```bash
# Search for functionality
grep -r "function name" src/

# Find service files
ls src/services/*/

# Check types
cat src/types/[type].ts
```

**Reading Services**:
- Start with `src/services/[area]/[main].service.ts`
- Check types in `src/types/`
- Look at tests in `tests/services/`

### Debugging

**Common Issues**:

1. **Port already in use**:
   ```bash
   # Kill process on port 3001
   lsof -ti:3001 | xargs kill -9
   ```

2. **Environment variables not loaded**:
   ```bash
   # Check .env exists
   cat .env

   # Restart dev server
   npm run dev
   ```

3. **TypeScript errors**:
   ```bash
   # Check types
   npm run type-check
   ```

4. **Supabase connection fails**:
   ```bash
   # Verify environment variables
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

---

## 📚 Key Documentation

### Internal Docs
- `GAPS-AND-PRIORITIES.md` - Current status and action plan
- `README.md` - Project overview and quick start
- `PHASE-5-INTEGRATION-SUMMARY.md` - Chinese LLM integration
- `MCP_INTEGRATION_GUIDE.md` - MCP integration (legacy, moving to Skills)
- `SECURITY_WORKFLOW_IMPROVEMENTS.md` - Security practices

### Skills Docs
- `.claude/skills/skill-factory/SKILL.md` - Meta-skill for creating skills
- `.claude/skills/skill-factory/templates/` - Skill templates
- `.claude/skills/skill-factory/examples/` - Example skills

### External Resources
- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [RunPod Docs](https://docs.runpod.io/)
- [HuggingFace Hub](https://huggingface.co/docs/hub)
- [Claude Skills Guide](https://docs.anthropic.com/claude/docs/agent-skills)

---

## 🤝 Team Workflow

### Sharing Skills

Skills are automatically shared via git:

```bash
# Create skill
mkdir -p .claude/skills/my-skill
# ... create SKILL.md ...

# Commit
git add .claude/skills/my-skill/
git commit -m "feat: add my-skill for [purpose]"
git push

# Teammates get it automatically
git pull  # Skills now available!
```

### Code Review

When reviewing PRs:
1. Use e2e-testing skill to ensure test coverage
2. Use dual-domain-theme skill to check consistency
3. Use cost-optimization skill to review performance
4. Check file-by-file changes
5. Test locally before approving

### Daily Standup

Answer these:
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers?
4. Any new skills needed?

---

## 🎨 Skills-First Philosophy

### Why Skills > MCP

**Skills Advantages**:
- ✅ Model-invoked (Claude decides when to use)
- ✅ No Node.js server to maintain
- ✅ Simple Markdown files
- ✅ Shared via git automatically
- ✅ Composable (multiple skills work together)
- ✅ Progressive disclosure (load details only when needed)

**MCP Drawbacks**:
- ❌ Requires separate server process
- ❌ Complex configuration
- ❌ User must invoke manually
- ❌ Harder to debug
- ❌ More moving parts

### Transitioning from MCP to Skills

If you were using MCP servers:
1. Identify workflows you automated with MCP
2. Use Skill Factory to create equivalent skills
3. Test skills work as expected
4. Remove MCP configuration
5. Celebrate simplicity! 🎉

---

## 🔐 Security Notes

### API Keys
- **NEVER commit `.env` to git** (it's in .gitignore)
- Rotate keys regularly
- Use different keys for dev/staging/prod
- Store production keys in Vercel/hosting platform

### Supabase Security
- Enable Row Level Security (RLS)
- Validate user input
- Use service role key only server-side
- Never expose service role key to client

### RunPod Security
- API keys are sensitive (can cost money)
- Set spending limits in RunPod dashboard
- Monitor usage regularly
- Implement rate limiting

---

## 📞 Getting Help

### In This Project

1. **Check documentation**:
   - Start with `GAPS-AND-PRIORITIES.md`
   - Read relevant service files
   - Check examples in Skills folder

2. **Use Skill Factory**:
   ```
   You: "I need help with [task]"
   Claude: *Analyzes codebase*
           *Provides guidance*
           *Or creates a skill to help*
   ```

3. **Search codebase**:
   ```bash
   grep -r "keyword" src/
   ```

### External Resources

- [Claude Code Docs](https://docs.anthropic.com/claude/docs/claude-code)
- [Claude Skills Guide](https://docs.anthropic.com/claude/docs/agent-skills)
- [Project GitHub](https://github.com/ScientiaCapital/ai-development-cockpit)

---

## 🚀 Let's Build!

You have:
- ✅ Strong foundation (25 services, 40+ components)
- ✅ Comprehensive testing infrastructure
- ✅ Skill Factory ready to create capabilities
- ✅ Clear roadmap in GAPS-AND-PRIORITIES.md

**Next**: Fill in `.env` and run `npm install && npm run dev`

Then say: "Create a skill for deploying models to RunPod" and watch the magic happen! ✨

---

**Remember**: Skills are your superpower. Use the Skill Factory liberally. When in doubt, create a skill! 🎯
