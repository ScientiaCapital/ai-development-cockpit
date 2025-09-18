# AI-Powered Development Cockpit 🚀

Advanced multi-LLM orchestration system with Task Master AI, Serena, and Shrimp integration for 100x developer productivity.

## Overview

This repository contains a comprehensive AI development cockpit that orchestrates multiple AI systems and tools to create an unprecedented development productivity environment. It integrates Claude Code, Cursor IDE, local LLMs (Ollama), and advanced task management systems.

## Features

### 🧠 Multi-MCP Integration
- **Task Master AI**: Intelligent task management with research capabilities
- **Serena**: Advanced code intelligence and navigation
- **Shrimp Task Manager**: Detailed task planning and verification
- **Sequential Thinking**: Step-by-step problem solving
- **Memory**: Context persistence across sessions

### ⚡ Advanced Slash Commands
- `/team-start-advanced` - Initialize complete AI team
- `/team-architect-mcp` - Architecture design with AI assistance
- `/team-task-master` - Task Master AI workflows
- `/team-orchestrate` - Full multi-AI orchestration
- `/daily-standup-mcp` - AI-powered daily standups

### 🎯 Cost-Optimized AI Stack
- **Local Models**: Ollama (DeepSeek, Qwen, Llama) for repetitive tasks
- **Cloud Models**: Anthropic Claude for complex reasoning
- **Hybrid Routing**: Automatic model selection for optimal cost/performance

### 🔄 Workflow Automation
- Morning startup automation
- Intelligent task prioritization
- Automated progress tracking
- Learning acceleration system

## Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/ScientiaCapital/ai-development-cockpit.git
cd ai-development-cockpit
```

2. **Install Claude Code** (if not already installed)
Follow instructions at [claude.ai/code](https://claude.ai/code)

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Start your development session**
```bash
claude  # Opens Claude Code in the repository
# Then type: /team-start-advanced
```

## File Structure

```
ai-development-cockpit/
├── .claude/
│   ├── commands/           # Custom slash commands
│   └── settings.local.json # Claude Code configuration
├── .taskmaster/
│   ├── tasks/             # Task Master AI data
│   ├── docs/              # PRDs and documentation
│   └── config.json        # Model configuration
├── .mcp.json              # MCP server configuration
├── CLAUDE.md              # Claude Code instructions
└── README.md              # This file
```

## Available Commands

### Team Orchestration
- `/team-start-advanced` - Initialize all AI systems
- `/team-orchestrate` - Full orchestration for complex features
- `/team-architect-mcp` - Architecture with code intelligence

### Task Management
- `/team-task-master` - Task Master AI workflow
- `/team-shrimp-plan` - Detailed task planning
- `/daily-standup-mcp` - Comprehensive daily standup

### Code Intelligence
- `/team-serena-analyze` - Deep code analysis
- `/team-think-sequential` - Complex problem solving
- `/team-research` - Research mode with planning

### Project Setup
- `/project-init-mcp` - Initialize new projects with all MCPs

## Configuration

### MCP Servers
The system uses several Model Context Protocol servers:
- **Memory**: Context persistence
- **Sequential Thinking**: Step-by-step reasoning
- **Task Master AI**: Task management
- **Shrimp Task Manager**: Task planning
- **Serena**: Code intelligence

### Model Configuration
- **Primary**: Anthropic Claude for complex tasks
- **Local**: Ollama models for cost optimization
- **Fallback**: Automatic failover between models

## Usage Examples

### Starting a Development Session
```bash
# 1. Open Claude Code
claude

# 2. Initialize AI team
/team-start-advanced

# 3. Get next task
/team-task-master

# 4. Architect a feature
/team-architect-mcp "implement user authentication"

# 5. Full orchestration
/team-orchestrate "build the authentication system"
```

### Daily Workflow
```bash
# Morning
/daily-standup-mcp

# During development
/team-serena-analyze src/auth/
/team-think-sequential "how to optimize this algorithm"

# Evening
/daily-standup-mcp  # Review progress
```

## Task Management Integration

The system tracks 10 major development phases:

1. **Project Structure** - Foundation setup
2. **MCP Integration** - Server configuration
3. **Slash Commands** - Command implementation
4. **Task Synchronization** - Multi-system coordination
5. **Model Configuration** - AI routing setup
6. **Code Intelligence** - Analysis systems
7. **Learning Framework** - Knowledge acceleration
8. **Workflow Automation** - Daily process automation
9. **Git Integration** - Version control integration
10. **Documentation** - System completion

## Development Philosophy

### Never Code Alone
- Always have at least one AI assistant active
- Use appropriate AI for each task complexity
- Leverage multiple perspectives for better solutions

### Cost Optimization
- Use local models for repetitive tasks (free)
- Cloud models for complex reasoning (targeted spending)
- Hybrid approach for optimal cost/performance

### Learning Integration
- Every coding session teaches something new
- Persistent knowledge across sessions
- Automated skill tracking and improvement

## API Keys Required

- `ANTHROPIC_API_KEY` - Claude models (primary)
- `PERPLEXITY_API_KEY` - Research capabilities (optional)
- Additional keys for extended functionality

## Contributing

This is a personal development productivity system. While the code is open source for learning and inspiration, it's specifically configured for the ScientiaCapital development environment.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions about this development cockpit:
1. Check the Task Master AI status with `/team-task-master`
2. Use `/team-research` to investigate problems
3. Leverage `/team-think-sequential` for complex debugging

---

**Remember**: With great MCP power comes great productivity! 🚀