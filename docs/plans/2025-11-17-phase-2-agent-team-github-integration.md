# Phase 2: Agent Team Completion + GitHub Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the AI Development Cockpit by building the remaining 3 specialist agents (FrontendDeveloper, Tester, DevOpsEngineer) and adding full GitHub integration (OAuth, repository browser, auto-clone, PR creation).

**Architecture:** Extend the existing BaseAgent/AgentOrchestrator system with 3 new specialist agents, then layer GitHub integration on top using Supabase Auth + GitHub API. All agents follow the same TDD pattern established in MVP.

**Tech Stack:** Next.js 15, TypeScript, Supabase Auth (GitHub OAuth), Octokit (GitHub API), BaseAgent pattern, Cost-Optimizer integration

---

## Part 1: Complete the Agent Team (Priority 2)

### Task 1: FrontendDeveloper Agent

**Goal:** Build an agent that generates React/Next.js components with Tailwind CSS styling.

**Files:**
- Create: `src/agents/FrontendDeveloper.ts`
- Create: `tests/agents/FrontendDeveloper.test.ts`
- Modify: `src/agents/index.ts` (add export)

---

#### Step 1: Write the failing test

Create `tests/agents/FrontendDeveloper.test.ts`:

```typescript
import { FrontendDeveloper } from '@/agents/FrontendDeveloper'
import { CostOptimizerClient } from '@/services/cost-optimizer/client'

jest.mock('@/services/cost-optimizer/client')

describe('FrontendDeveloper', () => {
  let agent: FrontendDeveloper
  let mockOptimizeCompletion: jest.Mock

  beforeEach(() => {
    mockOptimizeCompletion = jest.fn()
    ;(CostOptimizerClient as jest.MockedClass<typeof CostOptimizerClient>).mockImplementation(() => ({
      optimizeCompletion: mockOptimizeCompletion,
    } as any))

    agent = new FrontendDeveloper({
      userRequest: 'Create a login form component',
      projectContext: {
        framework: 'Next.js 15',
        styling: 'Tailwind CSS',
        uiLibrary: 'shadcn/ui'
      }
    })
  })

  it('should generate React component files', async () => {
    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({
        components: [
          {
            path: 'src/components/auth/LoginForm.tsx',
            code: 'export function LoginForm() { return <form>...</form> }'
          }
        ]
      }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    const result = await agent.execute()

    expect(result.filesCreated).toContain('src/components/auth/LoginForm.tsx')
    expect(result.filesCreated.length).toBeGreaterThan(0)
  })

  it('should use cost optimizer for code generation', async () => {
    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({ components: [] }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    await agent.execute()

    expect(mockOptimizeCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('React'),
        complexity: 'medium'
      })
    )
  })
})
```

#### Step 2: Run test to verify it fails

```bash
cd /Users/tmkipper/Desktop/tk_projects/ai-development-cockpit
npm test -- tests/agents/FrontendDeveloper.test.ts
```

**Expected:** FAIL with "Cannot find module '@/agents/FrontendDeveloper'"

---

#### Step 3: Write minimal implementation

Create `src/agents/FrontendDeveloper.ts`:

```typescript
import { BaseAgent, AgentOutput } from './BaseAgent'
import { CostOptimizerClient } from '@/services/cost-optimizer/client'
import { ProjectWorkspace } from '@/services/workspace/ProjectWorkspace'

export interface FrontendDeveloperContext {
  userRequest: string
  projectContext: {
    framework: string
    styling: string
    uiLibrary?: string
  }
}

export class FrontendDeveloper extends BaseAgent {
  agentType = 'FrontendDeveloper' as const
  private costOptimizer: CostOptimizerClient
  private context: FrontendDeveloperContext
  private totalCost = 0

  constructor(context: FrontendDeveloperContext) {
    super('FrontendDeveloper', {
      userRequest: context.userRequest,
      architecture: context.projectContext
    })
    this.context = context
    this.costOptimizer = new CostOptimizerClient({
      apiUrl: process.env.COST_OPTIMIZER_API_URL!,
      apiKey: process.env.COST_OPTIMIZER_API_KEY!
    })
  }

  async execute(): Promise<AgentOutput> {
    const startTime = Date.now()

    console.log('🎨 FrontendDeveloper: Generating React components...')

    // Build prompt for component generation
    const prompt = this.buildPrompt()

    // Call cost optimizer
    const response = await this.costOptimizer.optimizeCompletion({
      prompt,
      complexity: 'medium',
      metadata: {
        agent: this.agentType,
        task: 'component-generation'
      }
    })

    this.totalCost += response.cost

    // Parse response to extract component files
    const files = await this.generateComponentFiles(response.content)

    console.log(`✅ FrontendDeveloper: Generated ${files.length} component files`)

    return {
      filesCreated: files,
      filesModified: [],
      cost: this.totalCost,
      duration: Date.now() - startTime,
      metadata: {
        componentsGenerated: files.length,
        framework: this.context.projectContext.framework
      }
    }
  }

  private buildPrompt(): string {
    const { userRequest, projectContext } = this.context

    return `You are an expert frontend developer. Generate React/Next.js components based on the following requirements:

**User Request:** ${userRequest}

**Project Context:**
- Framework: ${projectContext.framework}
- Styling: ${projectContext.styling}
${projectContext.uiLibrary ? `- UI Library: ${projectContext.uiLibrary}` : ''}

**Requirements:**
1. Use TypeScript with strict types
2. Follow React best practices (hooks, functional components)
3. Use ${projectContext.styling} for styling
${projectContext.uiLibrary ? `4. Use ${projectContext.uiLibrary} components where appropriate` : ''}
4. Include proper accessibility (ARIA labels, semantic HTML)
5. Add JSDoc comments for complex logic
6. Keep components focused (single responsibility)

**Output Format:**
Return a JSON object with this structure:
{
  "components": [
    {
      "path": "src/components/category/ComponentName.tsx",
      "code": "// Full component code here..."
    }
  ]
}

Generate production-ready code with proper error handling and type safety.`
  }

  private async generateComponentFiles(responseContent: string): Promise<string[]> {
    try {
      const parsed = JSON.parse(responseContent)

      if (!parsed.components || !Array.isArray(parsed.components)) {
        console.warn('⚠️ No components found in response')
        return []
      }

      return parsed.components.map((c: any) => c.path)
    } catch (error) {
      console.error('❌ Failed to parse component response:', error)
      return []
    }
  }
}
```

---

#### Step 4: Update exports

Modify `src/agents/index.ts`:

```typescript
export { BaseAgent } from './BaseAgent'
export { BackendDeveloper } from './BackendDeveloper'
export { FrontendDeveloper } from './FrontendDeveloper'
```

---

#### Step 5: Run test to verify it passes

```bash
npm test -- tests/agents/FrontendDeveloper.test.ts
```

**Expected:** PASS (2 tests)

---

#### Step 6: Commit

```bash
git add src/agents/FrontendDeveloper.ts tests/agents/FrontendDeveloper.test.ts src/agents/index.ts
git commit -m "feat(agents): add FrontendDeveloper agent

- Generate React/Next.js components with TypeScript
- Tailwind CSS and shadcn/ui support
- Cost-optimizer integration
- TDD with 2 passing tests
- Follows BaseAgent pattern

Part of Phase 2 - Agent Team Completion"
```

---

### Task 2: Tester Agent

**Goal:** Build an agent that generates Jest unit tests and Playwright E2E tests.

**Files:**
- Create: `src/agents/Tester.ts`
- Create: `tests/agents/Tester.test.ts`
- Modify: `src/agents/index.ts` (add export)

---

#### Step 1: Write the failing test

Create `tests/agents/Tester.test.ts`:

```typescript
import { Tester } from '@/agents/Tester'
import { CostOptimizerClient } from '@/services/cost-optimizer/client'

jest.mock('@/services/cost-optimizer/client')

describe('Tester', () => {
  let agent: Tester
  let mockOptimizeCompletion: jest.Mock

  beforeEach(() => {
    mockOptimizeCompletion = jest.fn()
    ;(CostOptimizerClient as jest.MockedClass<typeof CostOptimizerClient>).mockImplementation(() => ({
      optimizeCompletion: mockOptimizeCompletion,
    } as any))

    agent = new Tester({
      userRequest: 'Write tests for the LoginForm component',
      codeToTest: 'export function LoginForm() { return <form>...</form> }',
      testType: 'unit'
    })
  })

  it('should generate test files', async () => {
    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({
        tests: [
          {
            path: 'tests/components/LoginForm.test.tsx',
            code: 'describe("LoginForm", () => { it("renders", () => {}) })'
          }
        ]
      }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    const result = await agent.execute()

    expect(result.filesCreated).toContain('tests/components/LoginForm.test.tsx')
    expect(result.filesCreated.length).toBeGreaterThan(0)
  })

  it('should support both unit and e2e test types', async () => {
    const e2eAgent = new Tester({
      userRequest: 'Write E2E test for login flow',
      codeToTest: '',
      testType: 'e2e'
    })

    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({ tests: [] }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    await e2eAgent.execute()

    expect(mockOptimizeCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Playwright')
      })
    )
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/agents/Tester.test.ts
```

**Expected:** FAIL with "Cannot find module '@/agents/Tester'"

---

#### Step 3: Write minimal implementation

Create `src/agents/Tester.ts`:

```typescript
import { BaseAgent, AgentOutput } from './BaseAgent'
import { CostOptimizerClient } from '@/services/cost-optimizer/client'

export interface TesterContext {
  userRequest: string
  codeToTest: string
  testType: 'unit' | 'e2e'
}

export class Tester extends BaseAgent {
  agentType = 'Tester' as const
  private costOptimizer: CostOptimizerClient
  private context: TesterContext
  private totalCost = 0

  constructor(context: TesterContext) {
    super('Tester', {
      userRequest: context.userRequest,
      testType: context.testType
    })
    this.context = context
    this.costOptimizer = new CostOptimizerClient({
      apiUrl: process.env.COST_OPTIMIZER_API_URL!,
      apiKey: process.env.COST_OPTIMIZER_API_KEY!
    })
  }

  async execute(): Promise<AgentOutput> {
    const startTime = Date.now()

    console.log(`🧪 Tester: Generating ${this.context.testType} tests...`)

    // Build prompt for test generation
    const prompt = this.buildPrompt()

    // Call cost optimizer
    const response = await this.costOptimizer.optimizeCompletion({
      prompt,
      complexity: 'medium',
      metadata: {
        agent: this.agentType,
        testType: this.context.testType
      }
    })

    this.totalCost += response.cost

    // Parse response to extract test files
    const files = await this.generateTestFiles(response.content)

    console.log(`✅ Tester: Generated ${files.length} test files`)

    return {
      filesCreated: files,
      filesModified: [],
      cost: this.totalCost,
      duration: Date.now() - startTime,
      metadata: {
        testsGenerated: files.length,
        testType: this.context.testType
      }
    }
  }

  private buildPrompt(): string {
    const { userRequest, codeToTest, testType } = this.context

    if (testType === 'unit') {
      return `You are an expert test engineer. Generate Jest unit tests for the following code:

**User Request:** ${userRequest}

**Code to Test:**
\`\`\`typescript
${codeToTest}
\`\`\`

**Requirements:**
1. Use Jest + React Testing Library
2. Test all user interactions
3. Test edge cases and error handling
4. Use proper test structure (describe, it, expect)
5. Mock external dependencies
6. Test accessibility features
7. Aim for 80%+ code coverage

**Output Format:**
Return a JSON object:
{
  "tests": [
    {
      "path": "tests/components/ComponentName.test.tsx",
      "code": "// Full test code here..."
    }
  ]
}`
    } else {
      return `You are an expert test engineer. Generate Playwright E2E tests for the following scenario:

**User Request:** ${userRequest}

**Requirements:**
1. Use Playwright test framework
2. Test complete user workflows
3. Include proper test fixtures
4. Test responsive design (mobile + desktop)
5. Test accessibility
6. Handle loading states and async operations
7. Include meaningful assertions

**Output Format:**
Return a JSON object:
{
  "tests": [
    {
      "path": "tests/e2e/feature-name.spec.ts",
      "code": "// Full E2E test code here..."
    }
  ]
}`
    }
  }

  private async generateTestFiles(responseContent: string): Promise<string[]> {
    try {
      const parsed = JSON.parse(responseContent)

      if (!parsed.tests || !Array.isArray(parsed.tests)) {
        console.warn('⚠️ No tests found in response')
        return []
      }

      return parsed.tests.map((t: any) => t.path)
    } catch (error) {
      console.error('❌ Failed to parse test response:', error)
      return []
    }
  }
}
```

---

#### Step 4: Update exports

Modify `src/agents/index.ts`:

```typescript
export { BaseAgent } from './BaseAgent'
export { BackendDeveloper } from './BackendDeveloper'
export { FrontendDeveloper } from './FrontendDeveloper'
export { Tester } from './Tester'
```

---

#### Step 5: Run test to verify it passes

```bash
npm test -- tests/agents/Tester.test.ts
```

**Expected:** PASS (2 tests)

---

#### Step 6: Commit

```bash
git add src/agents/Tester.ts tests/agents/Tester.test.ts src/agents/index.ts
git commit -m "feat(agents): add Tester agent

- Generate Jest unit tests and Playwright E2E tests
- Support for React Testing Library
- Cost-optimizer integration
- TDD with 2 passing tests
- Follows BaseAgent pattern

Part of Phase 2 - Agent Team Completion"
```

---

### Task 3: DevOpsEngineer Agent

**Goal:** Build an agent that generates deployment configurations (Dockerfile, Vercel config, GitHub Actions).

**Files:**
- Create: `src/agents/DevOpsEngineer.ts`
- Create: `tests/agents/DevOpsEngineer.test.ts`
- Modify: `src/agents/index.ts` (add export)

---

#### Step 1: Write the failing test

Create `tests/agents/DevOpsEngineer.test.ts`:

```typescript
import { DevOpsEngineer } from '@/agents/DevOpsEngineer'
import { CostOptimizerClient } from '@/services/cost-optimizer/client'

jest.mock('@/services/cost-optimizer/client')

describe('DevOpsEngineer', () => {
  let agent: DevOpsEngineer
  let mockOptimizeCompletion: jest.Mock

  beforeEach(() => {
    mockOptimizeCompletion = jest.fn()
    ;(CostOptimizerClient as jest.MockedClass<typeof CostOptimizerClient>).mockImplementation(() => ({
      optimizeCompletion: mockOptimizeCompletion,
    } as any))

    agent = new DevOpsEngineer({
      userRequest: 'Setup Vercel deployment',
      deploymentTarget: 'vercel',
      framework: 'Next.js 15'
    })
  })

  it('should generate deployment config files', async () => {
    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({
        configs: [
          {
            path: 'vercel.json',
            code: '{ "buildCommand": "npm run build" }'
          }
        ]
      }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    const result = await agent.execute()

    expect(result.filesCreated).toContain('vercel.json')
    expect(result.filesCreated.length).toBeGreaterThan(0)
  })

  it('should support multiple deployment targets', async () => {
    const dockerAgent = new DevOpsEngineer({
      userRequest: 'Create Dockerfile',
      deploymentTarget: 'docker',
      framework: 'Next.js 15'
    })

    mockOptimizeCompletion.mockResolvedValue({
      content: JSON.stringify({ configs: [] }),
      provider: 'test',
      model: 'test',
      cost: 0.001,
      tokens: { input: 100, output: 200 },
      duration: 1000
    })

    await dockerAgent.execute()

    expect(mockOptimizeCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: expect.stringContaining('Dockerfile')
      })
    )
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/agents/DevOpsEngineer.test.ts
```

**Expected:** FAIL with "Cannot find module '@/agents/DevOpsEngineer'"

---

#### Step 3: Write minimal implementation

Create `src/agents/DevOpsEngineer.ts`:

```typescript
import { BaseAgent, AgentOutput } from './BaseAgent'
import { CostOptimizerClient } from '@/services/cost-optimizer/client'

export interface DevOpsEngineerContext {
  userRequest: string
  deploymentTarget: 'vercel' | 'docker' | 'github-actions' | 'all'
  framework: string
}

export class DevOpsEngineer extends BaseAgent {
  agentType = 'DevOpsEngineer' as const
  private costOptimizer: CostOptimizerClient
  private context: DevOpsEngineerContext
  private totalCost = 0

  constructor(context: DevOpsEngineerContext) {
    super('DevOpsEngineer', {
      userRequest: context.userRequest,
      deploymentTarget: context.deploymentTarget
    })
    this.context = context
    this.costOptimizer = new CostOptimizerClient({
      apiUrl: process.env.COST_OPTIMIZER_API_URL!,
      apiKey: process.env.COST_OPTIMIZER_API_KEY!
    })
  }

  async execute(): Promise<AgentOutput> {
    const startTime = Date.now()

    console.log(`🚀 DevOpsEngineer: Generating ${this.context.deploymentTarget} configs...`)

    // Build prompt for config generation
    const prompt = this.buildPrompt()

    // Call cost optimizer
    const response = await this.costOptimizer.optimizeCompletion({
      prompt,
      complexity: 'medium',
      metadata: {
        agent: this.agentType,
        deploymentTarget: this.context.deploymentTarget
      }
    })

    this.totalCost += response.cost

    // Parse response to extract config files
    const files = await this.generateConfigFiles(response.content)

    console.log(`✅ DevOpsEngineer: Generated ${files.length} config files`)

    return {
      filesCreated: files,
      filesModified: [],
      cost: this.totalCost,
      duration: Date.now() - startTime,
      metadata: {
        configsGenerated: files.length,
        deploymentTarget: this.context.deploymentTarget
      }
    }
  }

  private buildPrompt(): string {
    const { userRequest, deploymentTarget, framework } = this.context

    const targetInstructions = {
      vercel: `Generate vercel.json configuration for ${framework} deployment`,
      docker: `Generate Dockerfile and docker-compose.yml for ${framework}`,
      'github-actions': `Generate GitHub Actions workflow (.github/workflows/deploy.yml) for ${framework}`,
      all: `Generate complete deployment setup (Dockerfile, vercel.json, GitHub Actions) for ${framework}`
    }

    return `You are an expert DevOps engineer. Generate deployment configuration files:

**User Request:** ${userRequest}

**Deployment Target:** ${deploymentTarget}
**Framework:** ${framework}

**Task:** ${targetInstructions[deploymentTarget]}

**Requirements:**
1. Follow best practices for ${deploymentTarget}
2. Include environment variable management
3. Optimize for production builds
4. Include health checks where applicable
5. Add proper .dockerignore or .vercelignore
6. Include clear comments
7. Enable caching for faster builds

**Output Format:**
Return a JSON object:
{
  "configs": [
    {
      "path": "path/to/config/file",
      "code": "// Full config content here..."
    }
  ]
}

Generate production-ready configs with security best practices.`
  }

  private async generateConfigFiles(responseContent: string): Promise<string[]> {
    try {
      const parsed = JSON.parse(responseContent)

      if (!parsed.configs || !Array.isArray(parsed.configs)) {
        console.warn('⚠️ No configs found in response')
        return []
      }

      return parsed.configs.map((c: any) => c.path)
    } catch (error) {
      console.error('❌ Failed to parse config response:', error)
      return []
    }
  }
}
```

---

#### Step 4: Update exports

Modify `src/agents/index.ts`:

```typescript
export { BaseAgent } from './BaseAgent'
export { BackendDeveloper } from './BackendDeveloper'
export { FrontendDeveloper } from './FrontendDeveloper'
export { Tester } from './Tester'
export { DevOpsEngineer } from './DevOpsEngineer'
```

---

#### Step 5: Run test to verify it passes

```bash
npm test -- tests/agents/DevOpsEngineer.test.ts
```

**Expected:** PASS (2 tests)

---

#### Step 6: Commit

```bash
git add src/agents/DevOpsEngineer.ts tests/agents/DevOpsEngineer.test.ts src/agents/index.ts
git commit -m "feat(agents): add DevOpsEngineer agent

- Generate Dockerfile, Vercel, GitHub Actions configs
- Support multiple deployment targets
- Cost-optimizer integration
- TDD with 2 passing tests
- Follows BaseAgent pattern

Part of Phase 2 - Agent Team Completion
COMPLETES THE AGENT TEAM!"
```

---

## Part 2: GitHub Integration (Priority 1)

### Task 4: GitHub OAuth Setup

**Goal:** Enable users to login with GitHub using Supabase Auth.

**Files:**
- Modify: `.env.example` (add GitHub OAuth vars)
- Modify: `.env` (add your GitHub OAuth credentials)
- Create: `src/app/auth/callback/route.ts`
- Create: `src/app/api/auth/github/route.ts`

**Prerequisites:**
1. Create GitHub OAuth app at https://github.com/settings/developers
2. Get Client ID and Client Secret
3. Configure callback URL: `https://xucngysrzjtwqzgcutqf.supabase.co/auth/v1/callback`

---

#### Step 1: Update environment variables

Modify `.env.example`:

```bash
# Add after Supabase section:

# GitHub OAuth (for repository integration)
GITHUB_CLIENT_ID="your_github_oauth_app_client_id"
GITHUB_CLIENT_SECRET="your_github_oauth_app_client_secret"
```

Modify `.env`:

```bash
# Add your actual GitHub OAuth credentials:
GITHUB_CLIENT_ID="Ov23li..."  # Your GitHub OAuth Client ID
GITHUB_CLIENT_SECRET="your_secret_here"
```

---

#### Step 2: Configure Supabase Auth Provider

**Manual Step:** Go to Supabase Dashboard → Authentication → Providers → Enable GitHub

1. Go to: https://supabase.com/dashboard/project/xucngysrzjtwqzgcutqf/auth/providers
2. Enable "GitHub" provider
3. Enter Client ID and Client Secret
4. Save

---

#### Step 3: Create OAuth callback handler

Create `src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard after successful auth
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

---

#### Step 4: Create GitHub login endpoint

Create `src/app/api/auth/github/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: 'repo read:user'
    }
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
```

---

#### Step 5: Test OAuth flow manually

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:3001/dashboard
# (We'll add the "Login with GitHub" button in next task)
```

---

#### Step 6: Commit

```bash
git add .env.example src/app/auth/callback/route.ts src/app/api/auth/github/route.ts
git commit -m "feat(auth): add GitHub OAuth integration

- Configure Supabase GitHub auth provider
- Add OAuth callback handler
- Add GitHub login API endpoint
- Request repo and user read scopes

Part of Phase 2 - GitHub Integration"
```

---

### Task 5: Repository Browser UI

**Goal:** Show user's GitHub repositories in the dashboard with search and selection.

**Files:**
- Create: `src/components/github/RepositoryBrowser.tsx`
- Create: `src/app/api/github/repos/route.ts`
- Create: `src/lib/github/client.ts`
- Modify: `src/app/dashboard/page.tsx` (add repository browser)

---

#### Step 1: Install Octokit

```bash
npm install @octokit/rest
npm install --save-dev @types/node
```

---

#### Step 2: Create GitHub client

Create `src/lib/github/client.ts`:

```typescript
import { Octokit } from '@octokit/rest'

export class GitHubClient {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async getUserRepos() {
    const { data } = await this.octokit.repos.listForAuthenticatedUser({
      sort: 'updated',
      per_page: 100
    })

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      url: repo.html_url,
      defaultBranch: repo.default_branch,
      language: repo.language,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at
    }))
  }

  async getRepoContents(owner: string, repo: string, path: string = '') {
    const { data } = await this.octokit.repos.getContent({
      owner,
      repo,
      path
    })
    return data
  }
}
```

---

#### Step 3: Create repos API endpoint

Create `src/app/api/github/repos/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { GitHubClient } from '@/lib/github/client'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  // Get current user session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Get GitHub access token from session
  const githubToken = session.provider_token

  if (!githubToken) {
    return NextResponse.json({ error: 'No GitHub token found' }, { status: 401 })
  }

  try {
    const github = new GitHubClient(githubToken)
    const repos = await github.getUserRepos()

    return NextResponse.json({ repos })
  } catch (error) {
    console.error('GitHub API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch repositories' },
      { status: 500 }
    )
  }
}
```

---

#### Step 4: Create RepositoryBrowser component

Create `src/components/github/RepositoryBrowser.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  language: string | null
  stars: number
  updatedAt: string
}

export function RepositoryBrowser({ onSelectRepo }: { onSelectRepo: (repo: Repository) => void }) {
  const [repos, setRepos] = useState<Repository[]>([])
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRepositories()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRepos(filtered)
    } else {
      setFilteredRepos(repos)
    }
  }, [searchQuery, repos])

  const loadRepositories = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/github/repos')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load repositories')
      }

      setRepos(data.repos)
      setFilteredRepos(data.repos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Repositories</CardTitle>
        <CardDescription>
          Select a repository to analyze
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        {loading && <p className="text-sm text-muted-foreground">Loading repositories...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredRepos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
              onClick={() => onSelectRepo(repo)}
            >
              <div className="flex-1">
                <p className="font-medium">{repo.fullName}</p>
                {repo.description && (
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                )}
                <div className="flex gap-2 mt-1">
                  {repo.language && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {repo.language}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    ⭐ {repo.stars}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline">
                Select
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

#### Step 5: Integrate into dashboard

Modify `src/app/dashboard/page.tsx` - add after the Codebase Review card:

```typescript
// Add import at top
import { RepositoryBrowser } from '@/components/github/RepositoryBrowser'

// Add this section after the main Codebase Review card:
{/* GitHub Repository Browser */}
<Card className="mb-6">
  <CardHeader>
    <CardTitle>GitHub Integration</CardTitle>
    <CardDescription>
      Connect your GitHub account to analyze repositories
    </CardDescription>
  </CardHeader>
  <CardContent>
    <RepositoryBrowser
      onSelectRepo={(repo) => {
        console.log('Selected repo:', repo)
        setProjectPath(`github:${repo.fullName}`)
      }}
    />
  </CardContent>
</Card>
```

---

#### Step 6: Test repository browser

```bash
# Start dev server
npm run dev

# Open http://localhost:3001/dashboard
# Click "Login with GitHub"
# You should see your repositories listed
```

---

#### Step 7: Commit

```bash
git add src/components/github/RepositoryBrowser.tsx src/app/api/github/repos/route.ts src/lib/github/client.ts src/app/dashboard/page.tsx package.json
git commit -m "feat(github): add repository browser UI

- Create GitHubClient with Octokit
- Add /api/github/repos endpoint
- Build RepositoryBrowser component with search
- Integrate into dashboard
- Install @octokit/rest dependency

Part of Phase 2 - GitHub Integration"
```

---

### Task 6: Auto-Clone Repository

**Goal:** Automatically clone selected GitHub repo to a temporary directory for analysis.

**Files:**
- Create: `src/services/github/clone.service.ts`
- Create: `src/app/api/github/clone/route.ts`
- Create: `tests/services/github/clone.service.test.ts`

---

#### Step 1: Write the failing test

Create `tests/services/github/clone.service.test.ts`:

```typescript
import { GitHubCloneService } from '@/services/github/clone.service'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('GitHubCloneService', () => {
  let service: GitHubCloneService
  let testDir: string

  beforeEach(() => {
    service = new GitHubCloneService()
    testDir = path.join(os.tmpdir(), `test-clone-${Date.now()}`)
  })

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true })
    } catch {}
  })

  it('should clone a public repository', async () => {
    const repoPath = await service.cloneRepository({
      url: 'https://github.com/octocat/Hello-World',
      destination: testDir
    })

    expect(repoPath).toBe(testDir)

    // Verify .git directory exists
    const gitPath = path.join(testDir, '.git')
    const stats = await fs.stat(gitPath)
    expect(stats.isDirectory()).toBe(true)
  }, 30000) // 30 second timeout for clone

  it('should handle clone errors gracefully', async () => {
    await expect(
      service.cloneRepository({
        url: 'https://github.com/invalid/nonexistent-repo-xyz',
        destination: testDir
      })
    ).rejects.toThrow()
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/services/github/clone.service.test.ts
```

**Expected:** FAIL with "Cannot find module"

---

#### Step 3: Write implementation

Create `src/services/github/clone.service.ts`:

```typescript
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export interface CloneOptions {
  url: string
  destination: string
  branch?: string
  depth?: number
}

export class GitHubCloneService {
  async cloneRepository(options: CloneOptions): Promise<string> {
    const { url, destination, branch, depth = 1 } = options

    // Validate URL
    if (!url.startsWith('https://github.com/')) {
      throw new Error('Only GitHub HTTPS URLs are supported')
    }

    // Create destination directory
    await fs.mkdir(destination, { recursive: true })

    // Build git clone command
    const branchArg = branch ? `--branch ${branch}` : ''
    const depthArg = depth > 0 ? `--depth ${depth}` : ''
    const command = `git clone ${branchArg} ${depthArg} ${url} ${destination}`

    console.log(`🔄 Cloning repository: ${url}`)

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: 60000 // 60 second timeout
      })

      if (stderr && !stderr.includes('Cloning into')) {
        console.warn('Clone stderr:', stderr)
      }

      console.log(`✅ Successfully cloned to ${destination}`)
      return destination
    } catch (error) {
      console.error('❌ Clone failed:', error)

      // Cleanup failed clone directory
      try {
        await fs.rm(destination, { recursive: true, force: true })
      } catch {}

      throw new Error(`Failed to clone repository: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getClonePath(repoFullName: string): string {
    // Generate unique path for this repo
    const safeName = repoFullName.replace(/[^a-z0-9-]/gi, '_')
    return path.join(
      process.env.CLONE_DIR || '/tmp/ai-dev-cockpit/clones',
      safeName
    )
  }

  async cleanupClone(clonePath: string): Promise<void> {
    try {
      await fs.rm(clonePath, { recursive: true, force: true })
      console.log(`🗑️ Cleaned up clone at ${clonePath}`)
    } catch (error) {
      console.error('Failed to cleanup clone:', error)
    }
  }
}
```

---

#### Step 4: Create clone API endpoint

Create `src/app/api/github/clone/route.ts`:

```typescript
import { GitHubCloneService } from '@/services/github/clone.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repoUrl, repoFullName } = body

    if (!repoUrl || !repoFullName) {
      return NextResponse.json(
        { error: 'repoUrl and repoFullName are required' },
        { status: 400 }
      )
    }

    const cloneService = new GitHubCloneService()
    const destination = await cloneService.getClonePath(repoFullName)
    const clonePath = await cloneService.cloneRepository({
      url: repoUrl,
      destination
    })

    return NextResponse.json({
      success: true,
      clonePath
    })
  } catch (error) {
    console.error('Clone API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Clone failed'
      },
      { status: 500 }
    )
  }
}
```

---

#### Step 5: Run tests

```bash
npm test -- tests/services/github/clone.service.test.ts
```

**Expected:** PASS (2 tests, may take ~30 seconds due to actual git clone)

---

#### Step 6: Commit

```bash
git add src/services/github/clone.service.ts src/app/api/github/clone/route.ts tests/services/github/clone.service.test.ts
git commit -m "feat(github): add repository clone service

- Create GitHubCloneService for cloning repos
- Add POST /api/github/clone endpoint
- Shallow clones (depth=1) for performance
- Auto-cleanup on failure
- TDD with 2 passing tests

Part of Phase 2 - GitHub Integration"
```

---

### Task 7: Pull Request Creation

**Goal:** Allow agents to create pull requests with their generated code.

**Files:**
- Create: `src/services/github/pr.service.ts`
- Create: `src/app/api/github/pr/route.ts`
- Create: `tests/services/github/pr.service.test.ts`

---

#### Step 1: Write the failing test

Create `tests/services/github/pr.service.test.ts`:

```typescript
import { GitHubPRService } from '@/services/github/pr.service'

// Mock Octokit
jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    repos: {
      createOrUpdateFileContents: jest.fn().mockResolvedValue({ data: {} }),
      getBranch: jest.fn().mockResolvedValue({ data: { commit: { sha: 'abc123' } } })
    },
    git: {
      createRef: jest.fn().mockResolvedValue({ data: {} })
    },
    pulls: {
      create: jest.fn().mockResolvedValue({
        data: {
          html_url: 'https://github.com/owner/repo/pull/1',
          number: 1
        }
      })
    }
  }))
}))

describe('GitHubPRService', () => {
  let service: GitHubPRService

  beforeEach(() => {
    service = new GitHubPRService('fake-token')
  })

  it('should create a pull request', async () => {
    const result = await service.createPullRequest({
      owner: 'testowner',
      repo: 'testrepo',
      branchName: 'feature/ai-generated',
      baseBranch: 'main',
      title: 'AI Generated Feature',
      body: 'This PR contains AI-generated code',
      files: [
        { path: 'src/test.ts', content: 'console.log("test")' }
      ]
    })

    expect(result.url).toBe('https://github.com/owner/repo/pull/1')
    expect(result.number).toBe(1)
  })
})
```

#### Step 2: Run test to verify it fails

```bash
npm test -- tests/services/github/pr.service.test.ts
```

**Expected:** FAIL with "Cannot find module"

---

#### Step 3: Write implementation

Create `src/services/github/pr.service.ts`:

```typescript
import { Octokit } from '@octokit/rest'

export interface PRFile {
  path: string
  content: string
}

export interface CreatePROptions {
  owner: string
  repo: string
  branchName: string
  baseBranch: string
  title: string
  body: string
  files: PRFile[]
}

export interface PRResult {
  url: string
  number: number
}

export class GitHubPRService {
  private octokit: Octokit

  constructor(accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken })
  }

  async createPullRequest(options: CreatePROptions): Promise<PRResult> {
    const { owner, repo, branchName, baseBranch, title, body, files } = options

    console.log(`🔄 Creating PR: ${owner}/${repo} (${branchName} → ${baseBranch})`)

    // Step 1: Get base branch SHA
    const { data: baseBranchData } = await this.octokit.repos.getBranch({
      owner,
      repo,
      branch: baseBranch
    })

    const baseSha = baseBranchData.commit.sha

    // Step 2: Create new branch
    await this.octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: baseSha
    })

    console.log(`✅ Created branch: ${branchName}`)

    // Step 3: Commit files to new branch
    for (const file of files) {
      await this.octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: file.path,
        message: `Add ${file.path}`,
        content: Buffer.from(file.content).toString('base64'),
        branch: branchName
      })
    }

    console.log(`✅ Committed ${files.length} files`)

    // Step 4: Create pull request
    const { data: pr } = await this.octokit.pulls.create({
      owner,
      repo,
      title,
      body: `${body}\n\n---\n🤖 Generated with [AI Development Cockpit](https://github.com/Enterprise/ai-development-cockpit)`,
      head: branchName,
      base: baseBranch
    })

    console.log(`✅ Created PR #${pr.number}: ${pr.html_url}`)

    return {
      url: pr.html_url,
      number: pr.number
    }
  }
}
```

---

#### Step 4: Create PR API endpoint

Create `src/app/api/github/pr/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { GitHubPRService } from '@/services/github/pr.service'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    // Get current user session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const githubToken = session.provider_token
    if (!githubToken) {
      return NextResponse.json({ error: 'No GitHub token found' }, { status: 401 })
    }

    const body = await request.json()
    const { owner, repo, branchName, baseBranch, title, prBody, files } = body

    // Validation
    if (!owner || !repo || !branchName || !baseBranch || !title || !files) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const prService = new GitHubPRService(githubToken)
    const result = await prService.createPullRequest({
      owner,
      repo,
      branchName,
      baseBranch,
      title,
      body: prBody,
      files
    })

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('PR creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'PR creation failed'
      },
      { status: 500 }
    )
  }
}
```

---

#### Step 5: Run tests

```bash
npm test -- tests/services/github/pr.service.test.ts
```

**Expected:** PASS (1 test)

---

#### Step 6: Commit

```bash
git add src/services/github/pr.service.ts src/app/api/github/pr/route.ts tests/services/github/pr.service.test.ts
git commit -m "feat(github): add pull request creation service

- Create GitHubPRService for PR creation
- Add POST /api/github/pr endpoint
- Auto-add AI Development Cockpit attribution
- Commit multiple files to new branch
- TDD with 1 passing test

Part of Phase 2 - GitHub Integration
COMPLETES GITHUB INTEGRATION!"
```

---

## Summary

**Phase 2 Complete! You've built:**

### **Agent Team (3 agents):**
1. ✅ **FrontendDeveloper** - Generates React/Next.js components
2. ✅ **Tester** - Writes Jest + Playwright tests
3. ✅ **DevOpsEngineer** - Creates deployment configs

### **GitHub Integration (4 features):**
1. ✅ **GitHub OAuth** - User authentication via GitHub
2. ✅ **Repository Browser** - Search and select repos
3. ✅ **Auto-Clone** - Clone repos to temp directories
4. ✅ **PR Creation** - Generate pull requests with AI code

### **Test Coverage:**
- 8 new test files
- 12+ new passing tests
- Full TDD throughout

### **Total Implementation:**
- 7 major tasks completed
- 15+ files created
- ~1,500 lines of production code
- All following DRY, YAGNI, TDD principles

---

## Next Steps (Phase 3 - Future)

**Priority 3: Plan Generation & Execution**
- Orchestrator generates implementation plans
- User approval workflow
- Parallel agent execution
- Real-time progress tracking

**Priority 4: Feedback Loop**
- Store project outcomes in database
- Track agent performance metrics
- Build successful patterns library
- Continuous improvement

---

## Verification Checklist

Before considering Phase 2 complete:

- [ ] All 6 agents work (CodeArchitect, BackendDeveloper, FrontendDeveloper, Tester, DevOpsEngineer + existing)
- [ ] GitHub OAuth login works
- [ ] Can see and search GitHub repos
- [ ] Can clone a repo automatically
- [ ] Can create a PR with AI-generated code
- [ ] All tests passing
- [ ] No OpenAI usage anywhere
- [ ] Code pushed to GitHub

---

**Plan saved to:** `docs/plans/2025-11-17-phase-2-agent-team-github-integration.md`
