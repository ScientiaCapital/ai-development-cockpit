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
- `/team-start-advanced` - Initialize all MCP servers
- `/team-orchestrate` - Full orchestration for complex features
- `/team-architect-mcp` - Architecture with Serena + Sequential Thinking

### Task Management
- `/team-task-master` - Task Master AI workflow
- `/team-shrimp-plan` - Shrimp planning and verification
- `/daily-standup-mcp` - MCP-powered standup

### Intelligence & Analysis
- `/team-serena-analyze` - Deep code analysis
- `/team-think-sequential` - Complex problem solving
- `/team-research` - Research mode with planning

### Project Setup
- `/project-init-mcp` - Initialize with all MCPs

## 🔄 Workflow Patterns

### Morning Routine
1. `/daily-standup-mcp` - Review and plan
2. `/team-start-advanced` - Initialize systems
3. `/team-task-master next` - Get first task

### Feature Development
1. `/team-architect-mcp` - Design architecture
2. `/team-shrimp-plan` - Detailed planning
3. `/team-orchestrate` - Implementation
4. `/team-serena-analyze` - Code review

### Problem Solving
1. `/team-think-sequential` - Break down problem
2. `/team-research` - Gather information
3. `/team-orchestrate` - Build solution

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

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
