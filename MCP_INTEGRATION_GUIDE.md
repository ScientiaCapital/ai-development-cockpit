# MCP Server Integration Guide - Complete Ecosystem

## Overview

This comprehensive guide covers the complete MCP (Model Context Protocol) server integration for the tmkipper/repos development environment. The system provides advanced orchestration, health monitoring, unified API access, and intelligent context persistence across all development workflows.

## 🏗️ Architecture Overview

### Core Components

1. **6 MCP Servers** - Specialized AI agents for different development tasks
2. **Health Monitoring Dashboard** - Real-time server health and performance tracking
3. **Unified API Interface** - Single point of access with intelligent routing
4. **Context Persistence System** - Cross-session context sharing and learning
5. **Sequential Thinking Orchestration** - Advanced reasoning and problem-solving layer

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Code Interface                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                 MCP Unified API                                 │
│           (Intelligent Routing & Load Balancing)               │
└─────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────────┘
      │         │         │         │         │         │
      ▼         ▼         ▼         ▼         ▼         ▼
  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
  │Memory │ │Seq.   │ │Task   │ │Shrimp │ │Serena │ │Desktop│
  │       │ │Think  │ │Master │ │       │ │       │ │Command│
  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘
      │         │         │         │         │         │
      └─────────┴─────────┴─────────┴─────────┴─────────┴─────────┐
                                                                  │
┌─────────────────────────────────────────────────────────────────▼┐
│                Context Persistence System                        │
│         (Cross-session memory, patterns, relationships)          │
└─────────────────────────────────────────────────────────────────┘
```

## 🧠 MCP Servers Configuration

### 1. Memory Server
**Purpose**: Context persistence and knowledge graph management
- **Package**: `@modelcontextprotocol/server-memory`
- **Key Capabilities**: Entity creation, relationship tracking, cross-session memory
- **Best For**: Maintaining project context, storing architectural decisions

### 2. Sequential Thinking Server
**Purpose**: Step-by-step problem solving and complex reasoning
- **Package**: `@modelcontextprotocol/server-sequential-thinking`
- **Key Capabilities**: Multi-step analysis, problem decomposition, reasoning chains
- **Best For**: Complex architectural decisions, debugging complex issues

### 3. Task Master AI
**Purpose**: Strategic task management and project planning
- **Package**: `task-master-ai`
- **Key Capabilities**: PRD parsing, task creation, complexity analysis, research
- **Best For**: High-level project planning, requirement analysis
- **API Keys Required**: ANTHROPIC_API_KEY, PERPLEXITY_API_KEY (optional)

### 4. Shrimp Task Manager
**Purpose**: Tactical task execution and verification
- **Package**: `@tmkipper/shrimp-task-manager`
- **Key Capabilities**: Task breakdown, execution guidance, verification
- **Best For**: Detailed implementation planning, step-by-step execution

### 5. Serena
**Purpose**: Code intelligence and navigation
- **Package**: `@wonderwhy-er/serena-mcp-server`
- **Key Capabilities**: Symbol search, code analysis, memory management
- **Best For**: Code exploration, refactoring, architectural analysis
- **Environment**: PROJECT_ROOT set to `/Users/tmkipper/repos`

### 6. Desktop Commander
**Purpose**: File system operations and desktop automation
- **Package**: `@desktop-commander/mcp-server`
- **Key Capabilities**: File operations, shell commands, process management
- **Best For**: File manipulation, system operations, automation
- **Environment**: Configured for macOS with zsh shell

## 📋 Configuration Files

### Main Configuration (`.mcp.json`)

Located at:
- `/Users/tmkipper/repos/.mcp.json` (Global)
- `/Users/tmkipper/repos/ai-development-cockpit/.mcp.json` (Project-specific)

```json
{
  "mcpServers": {
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "taskmaster-ai": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "${ANTHROPIC_API_KEY}",
        "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "GOOGLE_API_KEY": "${GOOGLE_API_KEY}",
        "XAI_API_KEY": "${XAI_API_KEY}",
        "OPENROUTER_API_KEY": "${OPENROUTER_API_KEY}",
        "MISTRAL_API_KEY": "${MISTRAL_API_KEY}"
      }
    },
    "shrimp-task-manager": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "--package=@tmkipper/shrimp-task-manager", "shrimp-task-manager"]
    },
    "serena": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@wonderwhy-er/serena-mcp-server"],
      "env": {
        "PROJECT_ROOT": "/Users/tmkipper/repos"
      }
    },
    "desktop-commander": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@desktop-commander/mcp-server"],
      "env": {
        "DC_ALLOWED_DIRECTORIES": "/Users/tmkipper/repos",
        "DC_DEFAULT_SHELL": "zsh",
        "DC_FILE_READ_LINE_LIMIT": "2000",
        "DC_FILE_WRITE_LINE_LIMIT": "50"
      }
    }
  }
}
```

## 🔧 Infrastructure Components

### Health Monitoring Dashboard (`mcp-health-monitor.js`)

**Features:**
- Real-time health checks for all MCP servers
- Response time monitoring and uptime tracking
- Automated alert generation for failures
- Historical health data storage
- Comprehensive reporting and analytics

**Usage:**
```bash
# Single health check
node mcp-health-monitor.js

# Continuous monitoring
node mcp-health-monitor.js --continuous

# Check specific server
node mcp-health-monitor.js --server memory

# Save reports
node mcp-health-monitor.js --save --json
```

### Unified API Interface (`mcp-unified-api.js`)

**Features:**
- Intelligent operation routing to appropriate servers
- Load balancing across available servers
- Request/response caching and optimization
- Comprehensive analytics and performance metrics
- Automatic failover and retry mechanisms

**Routing Rules:**
- **Memory Operations**: `create_entities`, `search_nodes`, `read_graph` → Memory Server
- **Strategic Tasks**: `parse_prd`, `analyze_complexity` → Task Master AI
- **Tactical Tasks**: `execute_task`, `verify_task` → Shrimp Task Manager
- **Code Operations**: `find_symbol`, `search_pattern` → Serena
- **File Operations**: `read_file`, `write_file` → Desktop Commander
- **Reasoning**: `sequentialthinking` → Sequential Thinking Server

**Usage:**
```bash
# Start unified API service
node mcp-unified-api.js start

# Check server status
node mcp-unified-api.js status

# Execute specific operation
node mcp-unified-api.js execute get_tasks
```

### Context Persistence System (`mcp-context-persistence.js`)

**Features:**
- Cross-session context sharing between all MCP servers
- Intelligent context categorization and routing
- Pattern learning from operation history
- Automatic context expiration and cleanup
- Context relationship mapping and suggestions

**Context Types:**
- **PROJECT**: Global project information (never expires)
- **TASK**: Task-specific context (24-hour expiry)
- **FILE**: File operation history (7-day expiry)
- **USER_PREFERENCE**: User settings (never expires)
- **TEMPORARY**: Session-specific data (1-hour expiry)

**Usage:**
```bash
# Start context persistence
node mcp-context-persistence.js start

# View analytics
node mcp-context-persistence.js analytics

# Clean expired contexts
node mcp-context-persistence.js cleanup
```

## 🚀 Development Workflows

### Morning Routine Workflow

1. **Initialize System**
   ```bash
   # Health check all servers
   node ai-development-cockpit/mcp-health-monitor.js

   # Start unified API
   node ai-development-cockpit/mcp-unified-api.js start
   ```

2. **Review Project Status**
   ```javascript
   // Get current tasks from Task Master AI
   mcp__taskmaster_ai__get_tasks

   // Check pending tasks in Shrimp
   mcp__shrimp_task_manager__list_tasks --status=pending

   // Review recent memories
   mcp__serena__list_memories
   ```

3. **Plan Daily Work**
   ```javascript
   // Get next strategic task
   mcp__taskmaster_ai__next_task

   // Break down into executable subtasks
   mcp__shrimp_task_manager__plan_task
   ```

### Feature Development Workflow

1. **Strategic Planning**
   ```javascript
   // Parse requirements
   mcp__taskmaster_ai__parse_prd

   // Analyze complexity
   mcp__taskmaster_ai__analyze_project_complexity --research

   // Expand into strategic tasks
   mcp__taskmaster_ai__expand_all --research
   ```

2. **Tactical Breakdown**
   ```javascript
   // Break down into executable tasks
   mcp__shrimp_task_manager__split_tasks

   // Analyze implementation requirements
   mcp__shrimp_task_manager__analyze_task
   ```

3. **Code Implementation**
   ```javascript
   // Explore existing codebase
   mcp__serena__find_symbol
   mcp__serena__get_symbols_overview

   // Get execution guidance
   mcp__shrimp_task_manager__execute_task

   // Make code changes
   mcp__serena__replace_symbol_body
   mcp__desktop_commander__edit_block
   ```

4. **Verification and Documentation**
   ```javascript
   // Verify task completion
   mcp__shrimp_task_manager__verify_task

   // Store architectural insights
   mcp__serena__write_memory

   // Update context
   mcp__memory__add_observations
   ```

### Problem-Solving Workflow

1. **Complex Analysis**
   ```javascript
   // Use sequential thinking for complex problems
   mcp__sequential_thinking__sequentialthinking

   // Research relevant information
   mcp__taskmaster_ai__research
   ```

2. **Code Investigation**
   ```javascript
   // Search for patterns and symbols
   mcp__serena__search_for_pattern
   mcp__serena__find_referencing_symbols

   // File system investigation
   mcp__desktop_commander__search_files
   ```

3. **Solution Implementation**
   ```javascript
   // Plan solution approach
   mcp__shrimp_task_manager__plan_task

   // Execute step by step
   mcp__shrimp_task_manager__execute_task
   ```

## 🎯 Integration Patterns

### Cross-Server Context Sharing

**Automatic Context Propagation:**
- Task context shared between Task Master AI and Shrimp
- File context shared between Serena and Desktop Commander
- Project context available to all servers
- User preferences persist across sessions

**Manual Context Transfer:**
```javascript
// Store context in Memory server
mcp__memory__create_entities([{
  name: "current_feature",
  entityType: "development_task",
  observations: ["Working on user authentication system"]
}])

// Reference in other operations
mcp__taskmaster_ai__add_task --prompt="Complete user auth based on current_feature context"
```

### Sequential Thinking Integration

**Complex Decision Making:**
```javascript
// Start reasoning process
mcp__sequential_thinking__sequentialthinking({
  thought: "Need to decide between authentication approaches",
  thoughtNumber: 1,
  totalThoughts: 5,
  nextThoughtNeeded: true
})

// Continue reasoning chain based on previous thoughts
// Use results to inform Task Master AI planning
```

### Task Synchronization

**Two-Level Task Management:**
- **Strategic Level** (Task Master AI): High-level features and project planning
- **Tactical Level** (Shrimp): Detailed implementation tasks and verification

**Synchronization Pattern:**
```javascript
// Create strategic task
const strategicTask = await mcp__taskmaster_ai__add_task({
  prompt: "Implement user authentication system"
})

// Break down into tactical tasks
const tacticalPlan = await mcp__shrimp_task_manager__plan_task({
  description: "User authentication implementation",
  existingTasksReference: true
})
```

## 📊 Monitoring and Analytics

### Health Monitoring

**Key Metrics:**
- Server availability and response times
- Success/failure rates per server
- Load distribution across servers
- Context usage patterns

**Alert Conditions:**
- Server response time > 5 seconds
- Server availability < 95%
- Consecutive failures ≥ 3
- Context store size approaching limits

### Performance Analytics

**API Performance:**
- Average response times per operation
- Request distribution across servers
- Load balancing effectiveness
- Cache hit rates and optimization opportunities

**Context Analytics:**
- Context creation and access patterns
- Cross-server context sharing frequency
- Context expiration and cleanup effectiveness
- Pattern learning accuracy and suggestions

## 🔒 Security and Configuration

### API Key Management

**Required Environment Variables:**
```bash
# For Task Master AI (research capabilities)
ANTHROPIC_API_KEY=your_anthropic_key
PERPLEXITY_API_KEY=your_perplexity_key

# Optional model providers
OPENAI_API_KEY=your_openai_key
GOOGLE_API_KEY=your_google_key
XAI_API_KEY=your_xai_key
OPENROUTER_API_KEY=your_openrouter_key
MISTRAL_API_KEY=your_mistral_key
```

### File System Security

**Desktop Commander Configuration:**
- Restricted to `/Users/tmkipper/repos` directory
- File read limit: 2000 lines per operation
- File write limit: 50 lines per operation
- Shell access limited to zsh with safety restrictions

### Context Security

**Data Protection:**
- Context compression for large entries
- Automatic expiration of sensitive data
- Cross-session isolation for temporary contexts
- Audit logging for all context operations

## 🛠️ Troubleshooting

### Common Issues

**MCP Server Connection Failures:**
```bash
# Check Node.js version (requires 18+)
node --version

# Verify package availability
npx -y @modelcontextprotocol/server-memory --help

# Check API keys
echo $ANTHROPIC_API_KEY | head -c 10
```

**Context Persistence Issues:**
```bash
# Check context directory permissions
ls -la ai-development-cockpit/context/

# Verify context file integrity
node ai-development-cockpit/mcp-context-persistence.js analytics

# Clean corrupted contexts
node ai-development-cockpit/mcp-context-persistence.js cleanup
```

**Performance Issues:**
```bash
# Monitor server health
node ai-development-cockpit/mcp-health-monitor.js --continuous

# Check API performance
node ai-development-cockpit/mcp-unified-api.js analytics

# Optimize load balancing
node ai-development-cockpit/mcp-unified-api.js status
```

### Debug Commands

**Health Diagnostics:**
```bash
# Full system health check
node ai-development-cockpit/mcp-health-monitor.js --save --json

# Server-specific diagnostics
node ai-development-cockpit/mcp-health-monitor.js --server taskmaster-ai

# Performance profiling
node ai-development-cockpit/mcp-unified-api.js execute health_check
```

**Context Debugging:**
```bash
# View all context stores
node ai-development-cockpit/mcp-context-persistence.js analytics

# Export specific context
node ai-development-cockpit/mcp-context-persistence.js export project

# Check context patterns
grep -r "pattern:" ai-development-cockpit/context/
```

## 📈 Success Metrics

### System Health Indicators

✅ **All 6 MCP servers operational** (100% availability target)
✅ **Average response time < 2 seconds** (95th percentile)
✅ **Context persistence working** (Cross-session memory active)
✅ **Load balancing effective** (Even distribution across servers)
✅ **Zero data loss** (Context backup and recovery working)

### Development Productivity Metrics

✅ **Task completion rate** (Strategic and tactical alignment)
✅ **Context reuse efficiency** (Reduced redundant analysis)
✅ **Code navigation speed** (Symbol search and file operations)
✅ **Problem resolution time** (Sequential thinking effectiveness)
✅ **Knowledge retention** (Memory server utilization)

## 🎉 Conclusion

The MCP integration provides a comprehensive development ecosystem with:

- **Unified Access**: Single API interface for all development tools
- **Intelligent Routing**: Operations automatically routed to best-suited servers
- **Context Continuity**: Cross-session memory and pattern learning
- **Health Monitoring**: Real-time system health and performance tracking
- **Scalable Architecture**: Load balancing and failover capabilities

This integration enables advanced AI-powered development workflows with enhanced productivity, context awareness, and system reliability.

---

**Last Updated**: 2024-09-19
**Version**: 1.0
**Status**: ✅ Production Ready