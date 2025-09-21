# Claude Code Advanced Configuration - tmkipper/repos

## 🚀 Quick Start
Type `/team-start-advanced` to initialize your complete AI team with all MCP servers

## 🧠 MCP Servers Available
- **Task Master AI**: Task management with research capabilities
- **Serena**: Code intelligence and navigation
- **Shrimp Task Manager**: Advanced task planning and verification
- **Sequential Thinking**: Step-by-step problem solving
- **Memory**: Context persistence across sessions

## 📋 Power Commands

### Team Orchestration
- `/team-start-advanced` - Initialize all MCP servers ✅ (Working)

### Task Management (Use MCP Tools Directly)
- `mcp__taskmaster-ai__next_task` - Get next available task
- `mcp__taskmaster-ai__get_tasks` - List all tasks with status
- `mcp__taskmaster-ai__set_task_status` - Update task status
- `mcp__shrimp-task-manager__list_tasks` - List Shrimp tasks
- `mcp__shrimp-task-manager__execute_task` - Execute Shrimp task

### Intelligence & Analysis (Use MCP Tools Directly)
- `mcp__serena__*` - Code analysis and navigation tools
- `mcp__sequential-thinking__sequentialthinking` - Complex problem solving
- `mcp__memory__*` - Context persistence tools

### Note on Slash Commands
Most documented slash commands don't exist - use MCP tools directly instead

## 🔄 Workflow Patterns

### Morning Routine
1. `/team-start-advanced` - Initialize systems ✅ (Working)
2. `mcp__taskmaster-ai__next_task` - Get first task
3. `mcp__taskmaster-ai__get_tasks` - Review current status

### Feature Development
1. `mcp__serena__*` - Code analysis and navigation
2. `mcp__shrimp-task-manager__split_tasks` - Detailed planning
3. Use available tools for implementation
4. `mcp__serena__*` - Code review

### Problem Solving
1. `mcp__sequential-thinking__sequentialthinking` - Break down problem
2. Use research tools and web search
3. Use available development tools for implementation

## 🎯 MCP Integration Patterns

### Task Synchronization
- Task Master ↔ Shrimp: Keep tasks synchronized
- Both systems track different aspects
- Task Master: Project management view
- Shrimp: Execution and verification view

### Code Intelligence Flow
- Serena analyzes → Memory stores → Shrimp plans → Task Master tracks

### Learning Loop
- Research → Implement → Verify → Remember
- Each MCP contributes to the learning process

## 🏗️ Repository Structure
```
tmkipper/repos/
├── infrastructure/          # System configuration and setup
│   ├── setup-ollama.sh     # Local LLM setup for M1 Mac
│   ├── validate-system.py  # Complete system validation
│   ├── model-configs/      # AI model configurations
│   └── runpod-configs/     # Cloud GPU configurations
├── projects/               # All active development projects (20+)
│   ├── claude-education-platform/
│   ├── swaggy-stacks/      # Trading system
│   ├── scientia_capital/   # Financial analysis
│   ├── trading-backtesting/
│   ├── solarvoice-platform/
│   ├── candlestick-screener/
│   ├── market-basket-analysis-api/
│   ├── mcp-server-cookbook/
│   ├── NetZeroExpert-OS/
│   ├── robot-brain/
│   └── ... (and more)
├── shared/                 # Shared resources and frameworks
│   ├── agent-frameworks/   # AutoGen, CrewAI, LangGraph configs
│   │   ├── autogen-configs/
│   │   ├── crewai-configs/
│   │   └── langgraph-flows/
│   └── model-routers/      # Intelligent routing systems
├── _TEMPLATES/            # Project templates
├── _ARCHIVE/              # Archived files and resources
│   ├── pdfs-and-docs/
│   ├── images-and-media/
│   ├── scripts-and-configs/
│   ├── data-files/
│   └── learning-resources/
└── Private/               # Private/sensitive files
```

## 🤖 Your AI Stack

### Cloud Models (Cost-Effective)
- **Primary**: DeepSeek API ($0.14/M tokens) - 90% of coding tasks
- **ChatGLM**: 25M free tokens initially
- **Claude Code**: Complex architecture and reviews (premium)

### Local Models (Free via Ollama)
- **llama3.2:3b** - Quick queries, chat (~2GB RAM)
- **qwen2.5:7b** - Complex tasks, analysis (~4GB RAM)
- **deepseek-coder-v2:6.7b** - Code generation (~4GB RAM)
- **phi3:mini** - Ultra-fast responses (~2GB RAM)

### Multi-Agent Frameworks Available
- **AutoGen**: Multi-agent conversations
- **CrewAI**: Role-based agent teams
- **LangGraph**: Graph-based agent workflows

## 💡 Development Commands

### Environment Setup
```bash
# Validate entire system
python infrastructure/validate-system.py

# Start local LLMs
ollama serve
ollama run llama3.2:3b

# Check available models
ollama list
```

### Common Project Commands
```bash
# Navigate to projects
cd projects/[project-name]

# Check for project-specific CLAUDE.md
cat CLAUDE.md

# Initialize Task Master (if available)
task-master init
task-master list

# Run tests (varies by project)
pytest tests/ -v        # Python projects
npm test               # Node.js projects
```

### Git Workflow
```bash
# Check status across projects
git status

# Create feature branch
git checkout -b feature/[name]

# Commit with task reference
git commit -m "feat: implement [feature] (task X.Y)"

# Create PR
gh pr create --title "[Title]" --body "Implements task X.Y"
```

## 📊 Project Categories

### AI/ML Projects
- **claude-education-platform**: Socratic AI tutors for Mexican students
- **robot-brain**: Multi-agent AI system
- **my-robot-brain**: Personal AI assistant
- **cerebras_projects**: Ultra-fast inference projects

### Trading & Finance
- **swaggy-stacks**: Full-stack trading platform
- **trading-backtesting**: Backtesting engine
- **scientia_capital**: Financial analysis tools
- **candlestick-screener**: Technical analysis

### Web Applications
- **solarvoice-platform**: Solar energy platform
- **solarvoice_ai**: AI-powered solar analysis
- **sunny-web-power-up**: Solar web tools
- **NetZeroExpert-OS**: Net zero consulting

### Data & Analytics
- **market-basket-analysis-api**: Retail analytics
- **bdr-lead-enrichment-system**: Sales data enrichment
- **ultra-elite-test**: Performance testing

### Infrastructure & Tools
- **mcp-server-cookbook**: MCP development examples
- **mini-claude-project**: Claude integration experiments

## 🔧 Cost Optimization Strategy

### When to Use Each Model
- **Complex Architecture**: Claude Code (premium, worth it)
- **Rapid Implementation**: Cursor + DeepSeek ($0.14/M tokens)
- **Boilerplate/Tests**: Local Ollama (free)
- **Quick Questions**: Local llama3.2:3b (free)
- **Code Review**: Local qwen2.5:7b (free)

### Monthly Budget Guidelines
- Target: <$50/month total AI costs
- Claude Code: $20-30 for complex work
- DeepSeek: $10-15 for implementation
- Local models: Free (electricity only)

## 📚 Learning Resources in Archive
- O'Reilly books and courses
- Udemy training materials
- Research papers and documentation
- Video tutorials and walkthroughs

## 🔒 Security Notes
- `.env` files contain API keys (never commit)
- Private/ directory for sensitive information
- Each project has individual .gitignore
- Use environment variables for secrets

## 💡 Pro Tips

1. **Always start with** `/team-start-advanced` for full context
2. **Use Sequential Thinking** for complex architectural decisions
3. **Save to Memory** after completing major features
4. **Verify with Shrimp** before marking tasks complete
5. **Analyze with Serena** before major refactors
6. **Use local models** for repetitive tasks
7. **Switch between models** based on task complexity

## 🔧 Troubleshooting

### MCP Not Responding
- Check Node.js installation: `node --version`
- Verify API keys in .env: `cat .env | grep API_KEY`
- Restart Claude Code with `--mcp-debug` flag

### Local Models Not Working
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Restart if needed
pkill ollama && ollama serve

# Pull missing models
ollama pull llama3.2:3b
```

### Task Sync Issues
- Run both Task Master and Shrimp list commands
- Use `/team-orchestrate` to resync
- Check .taskmaster/ directory exists

### Memory Issues
- Clear old memories periodically with Memory MCP
- Use specific queries, not "get all"
- Restart if memory seems stale

## 🎯 Daily Workflow Recommendations

### Morning (15 minutes)
1. `/daily-standup-mcp` - Review progress
2. Check git status across active projects
3. Plan the day's priorities
4. Start Ollama if needed

### Coding Session
1. `/team-start-advanced` - Initialize all systems
2. Pick a project and read its CLAUDE.md
3. Use task management tools to get next work item
4. Implement with appropriate AI assistance

### Evening (10 minutes)
1. Commit and push changes
2. Update task status in tracking systems
3. Document learnings in Memory MCP
4. Plan tomorrow's priorities

Remember: With great MCP power comes great productivity! Use the right tool for each task and never code alone.

## 🚀 Current Project: Dual-Domain LLM Platform

### Project Status: Phase 5 Complete ✅ (Updated Sept 20, 2025 Evening)
- **SwaggyStacks.com** (Developer-focused terminal theme) - LIVE ✅
- **ScientiaCapital.com** (Enterprise-focused corporate theme) - LIVE ✅
- **Dual-domain routing** - Working perfectly ✅
- **HuggingFace Integration** - Both organizations connected ✅
- **MCP Server Integration** - Task Master AI, Serena, Shrimp Task Manager active ✅
- **Terminal UI/UX** - Complete retro gaming aesthetic for developers ✅
- **Corporate Dashboard** - C-suite focused analytics and ROI tools ✅
- **RunPod Infrastructure** - Complete deployment, monitoring, rollback systems ✅
- **E2E Testing Framework** - Playwright with comprehensive test coverage ✅
- **Marketplace Testing Suite** - Complete with real API integration support ✅
- **Cost Optimization** - Real-time estimation and optimization algorithms ✅
- **🎉 Phase 5: Chinese LLM RunPod Integration** - Production-ready real API implementation ✅

### Live Deployment URLs
- **Development Server**: `http://localhost:3001` (when running)
- **SwaggyStacks**: `/swaggystacks` - Dark terminal theme
- **ScientiaCapital**: `/scientia` - Corporate enterprise theme
- **Model Marketplace**: `/marketplace` - Unified model discovery and testing
- **Chat Interface**: `/chat` - Modern chat interface with vLLM integration

### Phase 3.5 Infrastructure Achievements ✅
1. **✅ Complete Terminal UI System** - CSS modules, components, animations
2. **✅ HuggingFace CLI + MCP Integration** - Official server configuration
3. **✅ Dual-theme Architecture** - SwaggyStacks (dark/gaming) + ScientiaCapital (corporate)
4. **✅ Model Discovery Service** - Search, filtering, caching with LRU eviction
5. **✅ Authentication Infrastructure** - Multi-organization token management
6. **✅ Deployment Hooks** - useDeployment React hook with RunPod integration
7. **✅ Task Management Sync** - Task Master AI + Shrimp Task Manager coordination
8. **✅ RunPod API Client** - Complete endpoint management (629 lines)
9. **✅ Monitoring Service** - Real-time metrics and alerts (611 lines)
10. **✅ Cost Estimation** - Dynamic pricing with optimization (569 lines)
11. **✅ Rollback Service** - Snapshot management and orchestration (701 lines)
12. **✅ E2E Testing Framework** - Playwright with comprehensive test coverage
13. **✅ Marketplace Testing Suite** - Complete page objects and test scenarios
14. **✅ Real API Integration Tests** - HuggingFace API validation with error handling
15. **✅ End-to-End Pipeline Tests** - Complete deployment workflow validation
16. **✅ Deployment Components** - React UI components for monitoring/control

### **LATEST: Phase 4 Complete** - vLLM RunPod Integration with Modern Chat Interface ✅ (Sept 20, 2025)
17. **✅ MetricsCollector** - Real-time performance monitoring with Web Vitals tracking
18. **✅ ChaosEngine** - Systematic failure injection for resilience testing
19. **✅ TestReporter** - Advanced analytics with HTML/JSON reporting
20. **✅ DashboardIntegration** - Real-time monitoring with Prometheus/Grafana support
21. **✅ Chaos Testing Suite** - System resilience and 30-second rollback validation
22. **✅ Performance Testing Suite** - SLA compliance and regression detection
23. **✅ CI/CD Workflows** - GitHub Actions with automated testing and deployment
24. **✅ Analytics Reporter** - Playwright integration for comprehensive insights
25. **✅ Comprehensive Validation** - End-to-end infrastructure validation system

### **NEW: Phase 4 Infrastructure - vLLM RunPod Integration** ✅ (Sept 20, 2025)
26. **✅ vLLM Service** - Comprehensive RunPod serverless integration (721 lines)
27. **✅ Dual API Support** - Native RunPod + OpenAI-compatible endpoints
28. **✅ Modern Chat Interface** - Qwen/DeepSeek-style UI with light/dark modes
29. **✅ useInference Hook** - React hook for model management and cost optimization (450 lines)
30. **✅ ThemeProvider Integration** - next-themes with organization-specific theming
31. **✅ Chat Page Implementation** - Complete chat interface with streaming support (520 lines)
32. **✅ Marketplace Integration** - Real inference testing and deployment capabilities
33. **✅ TypeScript Interfaces** - Complete vLLM type definitions (274 lines)
34. **✅ Cost Estimation** - Real-time pricing with model-specific optimization
35. **✅ Organization Models** - SwaggyStacks (gaming) + Scientia Capital (enterprise) configs

### **LATEST: Phase 5 Complete - Chinese LLM RunPod Integration** ✅ (Sept 20, 2025 Evening)
36. **✅ Unified Chinese LLM Service** - Production-ready HuggingFace → RunPod → vLLM integration (1145 lines)
37. **✅ Real RunPod API Integration** - Replaced all mock calls with actual RunPod deployment APIs
38. **✅ Chinese Model Support** - Qwen, DeepSeek, ChatGLM, Baichuan, InternLM, Yi models
39. **✅ Production Infrastructure** - Circuit breakers, rate limiting, caching, webhooks, credentials
40. **✅ Dual API Implementation** - Native RunPod + OpenAI-compatible endpoints
41. **✅ Organization-Specific Configs** - SwaggyStacks (aggressive) + ScientiaCapital (conservative)
42. **✅ Health Monitoring** - Real-time RunPod health checks and model wake-up
43. **✅ Cost Optimization** - RunPod pricing calculation and optimization algorithms
44. **✅ Integration Testing** - Comprehensive validation framework for Chinese LLM deployment
45. **✅ Complete Documentation** - PHASE-5-INTEGRATION-SUMMARY.md with technical details

### Key Infrastructure Files

#### Phase 3.5 Production Systems
- `src/services/runpod/client.ts` - Complete RunPod API client (629 lines)
- `src/services/runpod/monitoring.service.ts` - Real-time monitoring (611 lines)
- `src/services/runpod/cost.service.ts` - Cost estimation engine (569 lines)
- `src/services/runpod/rollback.service.ts` - Rollback orchestration (701 lines)
- `src/hooks/useRollback.ts` - React rollback hook (438 lines)
- `src/components/deployment/` - UI components (DeploymentMonitor, CostEstimator, RollbackControl)
- `src/app/api/health/route.ts` - Health check endpoint for monitoring

#### **Task 3 Complete** - E2E Testing Infrastructure
- `tests/utils/MetricsCollector.ts` - Comprehensive performance and resource monitoring
- `tests/utils/ChaosEngine.ts` - Systematic failure injection for resilience testing
- `tests/utils/TestReporter.ts` - Advanced test analytics and reporting
- `tests/utils/DashboardIntegration.ts` - Real-time monitoring and alerting integration
- `tests/reporters/AnalyticsReporter.ts` - Playwright reporter integration
- `tests/e2e/chaos/` - Chaos testing suites (resilience and recovery validation)
- `tests/e2e/performance/` - Performance benchmarking and SLA compliance
- `tests/e2e/validation/comprehensive-validation.spec.ts` - Infrastructure validation
- `scripts/run-comprehensive-e2e.ts` - Orchestrated test execution runner
- `.github/workflows/e2e-testing.yml` - Comprehensive E2E testing pipeline
- `.github/workflows/cd-with-e2e.yml` - Continuous deployment with validation
- `playwright.config.ts` - E2E testing configuration with analytics reporting
- `tests/e2e/page-objects/MarketplacePage.ts` - Marketplace page object model (400+ lines)
- `tests/e2e/marketplace/` - Complete marketplace test suites
- `tests/e2e/pipeline/` - End-to-end pipeline integration tests
- `tests/e2e/utils/TestApiClient.ts` - Hybrid mock/real API testing framework

#### **Phase 4 Complete** - vLLM RunPod Integration
- `src/services/runpod/vllm.service.ts` - Comprehensive vLLM service with dual API support (721 lines)
- `src/types/vllm.ts` - Complete TypeScript interfaces for vLLM integration (274 lines)
- `src/hooks/useInference.ts` - React hook for model management and cost optimization (450 lines)
- `src/components/chat/ModernChatInterface.tsx` - Modern chat UI similar to Qwen/DeepSeek (425 lines)
- `src/app/chat/page.tsx` - Complete chat page with organization-specific theming (520 lines)
- `src/providers/ThemeProvider.tsx` - next-themes integration for light/dark modes
- `src/app/layout.tsx` - Updated with ThemeProvider integration
- `src/app/marketplace/page.tsx` - Enhanced with real inference testing capabilities
- `src/components/terminal/ModelCard.tsx` - Added test button and inference integration
- `next.config.js` - Converted to JS format for PWA compatibility
- `.env.local` - Updated with RunPod vLLM configuration variables

#### **Phase 5 Complete** - Chinese LLM RunPod Integration
- `src/services/huggingface/unified-llm.service.ts` - Main integration service (1145 lines)
- `src/services/huggingface/integration-test.ts` - Comprehensive testing framework
- `src/services/huggingface/api-client.ts` - Production API client with retry logic
- `src/services/huggingface/rate-limiter.ts` - Organization-specific rate limiting
- `src/services/huggingface/cache.service.ts` - Dual-tier caching (LRU + Redis)
- `src/services/huggingface/webhook.service.ts` - Real-time webhook handlers
- `src/services/huggingface/circuit-breaker.ts` - Fault tolerance patterns
- `src/services/huggingface/credentials.service.ts` - Secure credential management
- `src/services/huggingface/runpod-integration.service.ts` - RunPod deployment service
- `src/services/huggingface/integration.service.ts` - Service orchestration
- `PHASE-5-INTEGRATION-SUMMARY.md` - Complete technical documentation
- Comprehensive test suite with 100+ test scenarios

#### Phase 2 Foundation
- `src/app/swaggystacks/page.tsx` - Developer-focused landing page
- `src/app/scientia/page.tsx` - Enterprise-focused landing page
- `src/styles/terminal.module.css` - Terminal theme styling system
- `src/app/globals.css` - CSS variables and theme integration
- `src/hooks/useDeployment.ts` - Complete deployment management hook
- `src/types/deployment.ts` - Comprehensive deployment type definitions
- `src/services/models/` - HuggingFace model discovery services
- `src/contexts/HuggingFaceAuth.tsx` - Multi-organization authentication

### Development Ready Commands
```bash
npm run dev                        # Start development server (port 3001)
npm run build                      # Production build
npm run start                      # Production server
npm run lint                       # Code quality check
npm run type-check                 # TypeScript validation

# E2E Testing (Task 3 Complete)
npm run test:e2e                   # Run all Playwright E2E tests
npm run test:e2e:ui                # Run E2E tests with UI
npm run test:e2e:debug             # Debug E2E tests
npm run test:e2e:comprehensive     # Full orchestrated test suite
npm run test:e2e:validate          # Comprehensive infrastructure validation
npm run test:e2e:report            # View test reports
```

### Phase 6 Planning (Next Development Sprint)
1. **🎯 PRIORITY: Live Chinese LLM Deployment** - Deploy actual Qwen/DeepSeek models to RunPod serverless
2. **🎯 PRIORITY: Real Model Testing** - Test end-to-end inference with live Chinese LLMs
3. **🎯 PRIORITY: Supabase Authentication Integration** - Complete user auth system for both domains
4. **Production Model Management** - Model versioning, A/B testing, and cost monitoring
5. **Advanced Chat Features** - Streaming responses, conversation history, model switching
6. **Mobile PWA Enhancement** - Progressive web app capabilities and offline support

### Phase 6 Success Criteria
- ✅ Live Chinese LLM models deployed and accessible via RunPod
- ✅ End-to-end inference testing with real models (Qwen, DeepSeek, ChatGLM)
- ✅ Production authentication flow for dual-domain access
- ✅ Cost optimization and model performance monitoring
- ✅ Advanced chat interface with streaming and model selection
- ✅ Mobile-responsive PWA with offline capabilities

### Task Management Status (Updated Sept 20, 2025 Evening)
- **All MCP Servers**: Operational and synchronized ✅
- **Phase 5**: Complete - Chinese LLM RunPod integration with production-ready infrastructure ✅
- **Task 3 Complete**: End-to-End Model Deployment Testing System ✅
- **E2E Testing**: Comprehensive testing infrastructure with chaos engineering ✅
- **CI/CD Pipeline**: GitHub Actions with automated testing and deployment ✅
- **Task Master AI**: Active task tracking and coordination
- **Shrimp Task Manager**: Parallel task tracking system active
- **Sequential Thinking**: Available for complex problem solving
- **Memory**: Context persistence for development sessions

### 🌅 Tomorrow's Team Start Instructions (Updated Sept 20, 2025 Evening)
**Essential Commands to Begin:**
1. **`/team-start-advanced`** - Initialize all MCP servers and full context ✅ (Working)
2. **Use Task Master AI MCP tools directly** - `/team-task-master next` doesn't exist as slash command

**Working MCP Commands:**
- `mcp__taskmaster-ai__next_task` - Get next priority task
- `mcp__taskmaster-ai__get_tasks` - List all tasks
- `mcp__taskmaster-ai__set_task_status` - Update task status

**Tomorrow's Priority Focus** (Phase 5 Complete - Phase 6 Ready):
1. **Live Chinese LLM Deployment**: Deploy actual Qwen/DeepSeek models to RunPod serverless
2. **Real Model Testing**: Test end-to-end inference with live Chinese LLMs using our integration
3. **Production Validation**: Validate all Phase 5 infrastructure with real model deployments
4. **Cost Optimization**: Monitor and optimize real RunPod deployment costs
5. **Authentication System**: Complete Supabase integration for dual-domain auth
6. **Advanced Features**: Streaming responses and model switching in chat interface

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
