---
name: skill-factory
description: Generate new Claude Skills for the Dual-Domain LLM Platform using natural language. Use when the user wants to create a new skill, automate a workflow, or build team capabilities. Activates when user mentions "create a skill", "new skill", "skill for", or "automate [task]".
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
---

# Skill Factory 🏭

**Meta-skill for generating domain-specific Claude Skills for your team.**

This skill helps you create production-ready skills tailored to the Dual-Domain LLM Platform (AI Dev Cockpit + Enterprise).

## How It Works

When you say something like:
- "Create a skill for deploying models to RunPod"
- "I need a skill to manage Supabase auth flows"
- "Build a skill that helps with theme consistency"
- "Automate cost optimization analysis"

I will:
1. **Analyze** your codebase to understand the domain
2. **Generate** a complete skill with YAML frontmatter and instructions
3. **Add supporting files** (scripts, templates, references) if needed
4. **Test** the skill description for Claude's discovery
5. **Document** how to use it

## Project Context

This factory knows about your platform:

### **Architecture**
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Framer Motion
- **Services**: RunPod (deployment, vLLM), HuggingFace (model discovery)
- **Auth**: Supabase with MFA, RBAC, organizations
- **Testing**: Playwright E2E, chaos engineering, performance tests
- **Themes**: Dual-domain (AI Dev Cockpit dark/terminal, Enterprise light/corporate)

### **Key Service Areas**
```
src/services/
  ├── runpod/          # 7 services (client, deployment, monitoring, rollback, cost, vllm)
  ├── huggingface/     # 11 services (api, cache, circuit-breaker, webhooks, unified-llm)
  ├── inference/       # Streaming and model management
  └── monitoring/      # Observability and metrics
```

### **Common Workflows**
1. Model deployment (HuggingFace → RunPod → vLLM)
2. Cost estimation and optimization
3. Auth operations (user, org, RBAC)
4. Theme management (dual-domain consistency)
5. E2E testing and validation
6. Performance monitoring and chaos testing

## Skill Generation Process

### Step 1: Understand the Need
Ask clarifying questions:
- What workflow are you trying to automate?
- What files/services are involved?
- Who will use this skill? (you, team, specific role)
- What's the expected frequency? (daily, per-feature, rarely)

### Step 2: Analyze the Codebase
Search for relevant files:
```bash
# Find services
find src/services -name "*keyword*"

# Search for patterns
grep -r "specific function" src/

# Check existing components
ls src/components/[area]/
```

### Step 3: Generate the Skill

Create `SKILL.md` with:
```yaml
---
name: descriptive-skill-name
description: Clear description of what it does AND when to use it. Include trigger keywords.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# Skill Name

Brief overview of what this skill does.

## When to Use This Skill

- Specific scenario 1
- Specific scenario 2
- Specific scenario 3

## Instructions

Step-by-step workflow:

1. **First step** - Clear action
2. **Second step** - What to check
3. **Third step** - How to proceed

## Examples

### Example 1: Common Use Case
\`\`\`bash
# Command to run
\`\`\`

Expected outcome: ...

### Example 2: Edge Case
...

## Files Involved

- `src/services/[service]/file.ts` - Purpose
- `src/components/[area]/Component.tsx` - Purpose

## Best Practices

- Do this
- Don't do that
- Watch out for...

## Troubleshooting

**Issue**: Common problem
**Solution**: How to fix it
```

### Step 4: Add Supporting Files (if needed)

**Reference docs** (`REFERENCE.md`):
- Detailed API documentation
- Complex workflows
- Advanced configurations

**Scripts** (`scripts/helper.sh`):
- Automation utilities
- Validation scripts
- Quick commands

**Templates** (`templates/template.ts`):
- Code templates
- Configuration files
- Boilerplate

**Examples** (`examples/example.md`):
- Real-world usage
- Complete workflows
- Before/after comparisons

### Step 5: Test Discovery

Ensure the description triggers correctly:
- Include **action verbs**: "deploy", "manage", "analyze", "create"
- Add **domain terms**: "RunPod", "vLLM", "Supabase", "Qwen"
- Specify **when to use**: "Use when...", "Activates when..."
- List **trigger phrases**: "model deployment", "cost optimization"

### Step 6: Document Usage

Add to team CLAUDE.md:
```markdown
## Available Skills

### skill-name
**Purpose**: Brief description
**When to use**: Trigger conditions
**Example**: "Deploy Qwen model to RunPod"
```

## Skill Templates

See [templates/](templates/) for common patterns:
- `service-skill.md` - Wrapping a service layer
- `workflow-skill.md` - Multi-step process automation
- `analysis-skill.md` - Code analysis and reporting
- `testing-skill.md` - Test generation and validation

## Examples

See [examples/](examples/) for complete skills:
- `runpod-deployment-example.md` - Full deployment skill
- `theme-management-example.md` - Theme consistency skill
- `cost-analysis-example.md` - Cost optimization skill

## Skill Naming Conventions

✅ **Good names**:
- `runpod-deployment` - Clear, specific
- `supabase-auth-ops` - Domain + action
- `cost-optimization` - Descriptive

❌ **Avoid**:
- `helper` - Too vague
- `utils` - Not descriptive
- `misc-tools` - Unfocused

## Best Practices for Skills

### Keep Skills Focused
One skill = one capability
- ✅ "Deploy models to RunPod"
- ❌ "Do everything with models"

### Write Clear Descriptions
Include both **what** and **when**:
```yaml
description: Deploy Chinese LLM models (Qwen, DeepSeek, ChatGLM) to RunPod serverless with vLLM. Use when deploying models, checking deployment status, or configuring vLLM settings.
```

### Use Progressive Disclosure
- Core instructions in SKILL.md (< 200 lines)
- Details in REFERENCE.md
- Complex workflows in separate docs
- Claude reads additional files only when needed

### Test with Real Questions
Ask questions that should trigger the skill:
- "How do I deploy a Qwen model?"
- "Check the status of my RunPod deployment"
- "Optimize vLLM configuration for DeepSeek"

### Version Your Skills
Add version history in SKILL.md:
```markdown
## Version History
- v1.1.0 (2025-11-06): Added support for ChatGLM-4
- v1.0.0 (2025-11-05): Initial deployment skill
```

## Skill Discovery Tips

### High-Priority Skills Needed

Based on your codebase, create skills for:

1. **runpod-deployment** (CRITICAL)
   - 7 services, 100+ LOC
   - Complex deployment workflow
   - Cost optimization needed

2. **supabase-auth-ops** (HIGH)
   - 11 auth routes
   - MFA, RBAC, organizations
   - Frequent user management

3. **dual-domain-theme** (MEDIUM)
   - 2 distinct themes
   - 40+ components
   - Brand consistency critical

4. **e2e-testing** (MEDIUM)
   - Playwright + chaos testing
   - Performance validation
   - Comprehensive test suite

5. **cost-optimization** (LOW)
   - Analysis and reporting
   - ROI calculations
   - Less frequent use

## Interactive Skill Creation

### Quick Creation Flow

**User**: "Create a skill for [X]"

**I will**:
1. Ask 2-3 clarifying questions
2. Search codebase for relevant files
3. Generate complete SKILL.md
4. Add supporting files if needed
5. Test the description
6. Document in CLAUDE.md

### Detailed Creation Flow

**User**: "Let's build a comprehensive skill for [X]"

**I will**:
1. Deep-dive into requirements
2. Analyze all related services
3. Create main SKILL.md
4. Add REFERENCE.md with details
5. Create helper scripts
6. Add templates and examples
7. Write tests for the skill
8. Full documentation

## Maintenance

### Updating Skills
When project evolves, update skills:
```bash
# Review skill effectiveness
grep -r "skill-name" .claude/skills/

# Update description for better discovery
# Add new examples
# Update file references
```

### Deprecating Skills
If a skill is no longer needed:
1. Add deprecation notice to SKILL.md
2. Suggest replacement skill
3. Keep for 2 weeks
4. Then remove directory

## Integration with Development Workflow

### Morning Routine
```
User: "What should I work on today?"
→ Uses task management skills
→ Prioritizes based on complexity
→ Suggests relevant skills to use
```

### Feature Development
```
User: "Implement authentication for org management"
→ Uses supabase-auth-ops skill
→ Reads existing auth patterns
→ Generates consistent code
→ Updates tests
```

### Code Review
```
User: "Review this deployment code"
→ Uses runpod-deployment skill
→ Checks best practices
→ Validates cost optimization
→ Suggests improvements
```

## Ready to Build?

Say something like:
- "Create a skill for deploying models"
- "I need a skill to help with auth"
- "Build me a theme management skill"
- "What skills should we create first?"

I'll guide you through the creation process! 🏭
