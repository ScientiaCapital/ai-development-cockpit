# 🔪 Service Splitting Guide

**Purpose**: Break down large service files (1,000+ lines) into smaller, focused modules.

**Target Files**:
1. `unified-llm.service.ts` - 1,162 lines
2. `api-client.ts` - 1,047 lines
3. `rollback.service.ts` - 748 lines
4. `vllm.service.ts` - 735 lines

**Estimated Time**: 8-12 hours
**Difficulty**: Medium-High
**Benefits**: Easier testing, better maintainability, clearer responsibilities

---

## 📊 Problem: God Objects

### **Current State**

```typescript
// ❌ unified-llm.service.ts (1,162 lines)
class UnifiedChineseLLMService {
  // HuggingFace operations (200 lines)
  async searchChineseModels() { ... }
  async fetchModelDetails() { ... }

  // RunPod deployment (300 lines)
  async deployModelToRunPod() { ... }
  async submitRunPodDeployment() { ... }

  // Inference operations (250 lines)
  async runInference() { ... }
  async executeRunPodInference() { ... }

  // Health checks (150 lines)
  async checkRunPodHealth() { ... }
  async wakeUpModel() { ... }

  // Cache operations (150 lines)
  // Rate limiting (150 lines)
  // Error handling (150 lines)
}
```

**Issues**:
- Hard to test (too many responsibilities)
- Hard to understand (1,000+ lines to read)
- Hard to modify (changes affect everything)
- Hard to reuse (tightly coupled)

---

## ✅ Solution: Single Responsibility Principle

### **New Structure**

```
src/services/huggingface/
├── llm/
│   ├── discovery.service.ts       # HuggingFace model search
│   ├── deployment.service.ts      # RunPod deployment
│   ├── inference.service.ts       # Model inference
│   └── health.service.ts          # Health checks & wake-up
├── api/
│   ├── client.ts                  # HTTP client
│   ├── retry.ts                   # Retry logic
│   └── cache.ts                   # Response caching
├── utils/
│   ├── rate-limiter.ts           # Rate limiting
│   └── error-handler.ts          # Error handling
└── index.ts                      # Public API
```

---

## 🗺️ Step-by-Step Splitting Process

### **Example: unified-llm.service.ts → Multiple Modules**

#### **Step 1: Analyze Responsibilities** (30 minutes)

Read through the file and identify logical groups:

```typescript
// Group 1: Model Discovery (Lines 50-250)
searchChineseModels()
fetchModelDetails()
validateModel()
filterBySize()

// Group 2: Deployment (Lines 251-550)
deployModelToRunPod()
submitRunPodDeployment()
configureDeployment()
validateDeploymentConfig()

// Group 3: Inference (Lines 551-800)
runInference()
executeRunPodInference()
streamInference()
processInferenceResponse()

// Group 4: Health & Monitoring (Lines 801-950)
checkRunPodHealth()
wakeUpModel()
monitorEndpoint()
handleEndpointFailure()

// Group 5: Infrastructure (Lines 951-1162)
makeRunPodApiCall()
handleRateLimiting()
cacheResponse()
logOperation()
```

#### **Step 2: Create Directory Structure** (5 minutes)

```bash
mkdir -p src/services/huggingface/llm
mkdir -p src/services/huggingface/api
mkdir -p src/services/huggingface/utils
```

#### **Step 3: Extract First Module** (1 hour)

**Create**: `src/services/huggingface/llm/discovery.service.ts`

```typescript
/**
 * HuggingFace Model Discovery Service
 *
 * Responsibilities:
 * - Search Chinese language models on HuggingFace
 * - Fetch model details and metadata
 * - Filter models by size, task, license
 * - Validate model compatibility
 */

import type { OrganizationSlug } from '@/types/organization'

export interface ModelSearchFilters {
  query?: string
  maxSize?: string  // '7B', '13B', '70B'
  tasks?: string[]
  license?: string[]
  minDownloads?: number
  minLikes?: number
}

export interface ChineseModel {
  id: string
  name: string
  author: string
  downloads: number
  likes: number
  size: string
  task: string
  license: string
  tags: string[]
}

export class ModelDiscoveryService {
  private baseUrl = 'https://huggingface.co/api'
  private organizationTokens: Map<OrganizationSlug, string>

  constructor(tokens: Map<OrganizationSlug, string>) {
    this.organizationTokens = tokens
  }

  /**
   * Search for Chinese language models
   */
  async searchChineseModels(
    organization: OrganizationSlug,
    filters: ModelSearchFilters = {}
  ): Promise<ChineseModel[]> {
    const token = this.organizationTokens.get(organization)
    if (!token) {
      throw new Error(`No HuggingFace token for ${organization}`)
    }

    // Extract original search logic here (Lines 50-150)
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    const models = await response.json()
    return this.filterChineseModels(models, filters)
  }

  /**
   * Fetch detailed information for a specific model
   */
  async fetchModelDetails(modelId: string, organization: OrganizationSlug): Promise<ChineseModel> {
    // Extract original fetch logic here (Lines 151-200)
    const token = this.organizationTokens.get(organization)
    const response = await fetch(`${this.baseUrl}/models/${modelId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    return response.json()
  }

  /**
   * Filter models for Chinese language support
   */
  private filterChineseModels(models: any[], filters: ModelSearchFilters): ChineseModel[] {
    // Extract original filter logic here (Lines 201-250)
    return models
      .filter(m => this.isChineseModel(m))
      .filter(m => this.matchesFilters(m, filters))
      .map(m => this.transformToChineseModel(m))
  }

  private isChineseModel(model: any): boolean {
    const chineseKeywords = ['qwen', 'deepseek', 'chatglm', 'baichuan', 'internlm', 'yi']
    const modelName = model.id.toLowerCase()
    return chineseKeywords.some(keyword => modelName.includes(keyword))
  }

  private matchesFilters(model: any, filters: ModelSearchFilters): boolean {
    // Implement filter matching logic
    return true  // Simplified
  }

  private transformToChineseModel(model: any): ChineseModel {
    return {
      id: model.id,
      name: model.modelId || model.id,
      author: model.author,
      downloads: model.downloads || 0,
      likes: model.likes || 0,
      size: this.extractSize(model),
      task: model.pipeline_tag || 'text-generation',
      license: model.license || 'unknown',
      tags: model.tags || [],
    }
  }

  private extractSize(model: any): string {
    // Extract model size from tags or config
    return '7B'  // Simplified
  }
}
```

**Benefits of this extraction**:
- ✅ Single responsibility: Model discovery only
- ✅ Clear interface: `ModelSearchFilters` input, `ChineseModel[]` output
- ✅ Easy to test: Mock HTTP responses
- ✅ Reusable: Can use in other services

#### **Step 4: Extract Second Module** (1 hour)

**Create**: `src/services/huggingface/llm/deployment.service.ts`

```typescript
/**
 * Model Deployment Service
 *
 * Responsibilities:
 * - Deploy models to RunPod serverless
 * - Configure deployment settings
 * - Manage deployment lifecycle
 * - Handle deployment errors
 */

import type { OrganizationSlug } from '@/types/organization'
import { RunPodApiClient } from '../api/client'

export interface DeploymentConfig {
  hfModelId: string
  organization: OrganizationSlug
  instanceConfig: {
    gpuTypeId: string
    gpuCount: number
    memoryGb: number
    storageGb: number
  }
  templateId?: string
  environmentVars?: Record<string, string>
}

export interface DeploymentResult {
  success: boolean
  endpointId: string
  endpointUrl: string
  pricing: {
    hourly: number
    monthly: number
  }
  estimatedStartupTime: number
}

export class ModelDeploymentService {
  private runpodClient: RunPodApiClient

  constructor(runpodClient: RunPodApiClient) {
    this.runpodClient = runpodClient
  }

  /**
   * Deploy a model to RunPod serverless infrastructure
   */
  async deployModel(config: DeploymentConfig): Promise<DeploymentResult> {
    // Validate configuration
    this.validateDeploymentConfig(config)

    // Prepare deployment payload
    const payload = this.prepareDeploymentPayload(config)

    // Submit to RunPod
    const response = await this.runpodClient.createEndpoint(payload)

    // Calculate pricing
    const pricing = this.calculatePricing(config)

    return {
      success: true,
      endpointId: response.id,
      endpointUrl: response.url,
      pricing,
      estimatedStartupTime: this.estimateStartupTime(config)
    }
  }

  /**
   * Validate deployment configuration
   */
  private validateDeploymentConfig(config: DeploymentConfig): void {
    if (!config.hfModelId) {
      throw new Error('Model ID is required')
    }
    if (!config.instanceConfig.gpuTypeId) {
      throw new Error('GPU type is required')
    }
    // More validation...
  }

  /**
   * Prepare RunPod API payload
   */
  private prepareDeploymentPayload(config: DeploymentConfig): any {
    return {
      name: `chinese-llm-${config.hfModelId.replace('/', '-')}`,
      template_id: config.templateId || 'vllm-runpod-serverless',
      gpu_count: config.instanceConfig.gpuCount,
      gpu_type_id: config.instanceConfig.gpuTypeId,
      env: {
        MODEL_NAME: config.hfModelId,
        ...config.environmentVars
      }
    }
  }

  /**
   * Calculate deployment pricing
   */
  private calculatePricing(config: DeploymentConfig): { hourly: number; monthly: number } {
    // Pricing logic based on GPU type and count
    const baseRate = 0.79  // Per GPU hour for A100
    const hourly = baseRate * config.instanceConfig.gpuCount
    const monthly = hourly * 730  // Average hours per month

    return { hourly, monthly }
  }

  private estimateStartupTime(config: DeploymentConfig): number {
    // Estimate based on model size
    const sizeGB = config.instanceConfig.storageGb
    return sizeGB < 10 ? 60 : sizeGB < 50 ? 180 : 300  // seconds
  }
}
```

#### **Step 5: Create Orchestrator** (30 minutes)

**Create**: `src/services/huggingface/llm/index.ts` (Main facade)

```typescript
/**
 * Unified Chinese LLM Service
 *
 * This is the main entry point that orchestrates all LLM operations.
 * It delegates to specialized services for each responsibility.
 */

import { ModelDiscoveryService } from './discovery.service'
import { ModelDeploymentService } from './deployment.service'
import { ModelInferenceService } from './inference.service'
import { ModelHealthService } from './health.service'
import { RunPodApiClient } from '../api/client'
import type { OrganizationSlug } from '@/types/organization'

export class UnifiedChineseLLMService {
  private discovery: ModelDiscoveryService
  private deployment: ModelDeploymentService
  private inference: ModelInferenceService
  private health: ModelHealthService

  constructor(config: {
    hfTokens: Map<OrganizationSlug, string>
    runpodApiKey: string
  }) {
    // Initialize API client
    const runpodClient = new RunPodApiClient(config.runpodApiKey)

    // Initialize services
    this.discovery = new ModelDiscoveryService(config.hfTokens)
    this.deployment = new ModelDeploymentService(runpodClient)
    this.inference = new ModelInferenceService(runpodClient)
    this.health = new ModelHealthService(runpodClient)
  }

  // ========================================
  // Public API - Delegate to services
  // ========================================

  async searchChineseModels(org: OrganizationSlug, filters?: any) {
    return this.discovery.searchChineseModels(org, filters)
  }

  async deployModelToRunPod(config: any) {
    return this.deployment.deployModel(config)
  }

  async runInference(request: any) {
    return this.inference.execute(request)
  }

  async checkRunPodHealth(endpointId: string) {
    return this.health.checkHealth(endpointId)
  }

  // More delegations...
}
```

**Benefits**:
- ✅ Each service is 150-250 lines (manageable)
- ✅ Clear separation of concerns
- ✅ Easy to test each module independently
- ✅ Main service is just an orchestrator (100 lines)
- ✅ Can swap implementations easily

#### **Step 6: Update Tests** (1 hour)

```typescript
// Before: One massive test file (500+ lines)
describe('UnifiedChineseLLMService', () => { ... })

// After: Separate test files
describe('ModelDiscoveryService', () => { ... })      // discovery.service.test.ts
describe('ModelDeploymentService', () => { ... })     // deployment.service.test.ts
describe('ModelInferenceService', () => { ... })      // inference.service.test.ts
describe('ModelHealthService', () => { ... })         // health.service.test.ts
describe('UnifiedChineseLLMService', () => { ... })   // index.test.ts (integration)
```

---

## 📋 Splitting Checklist (Per Service File)

### **Preparation**
- [ ] Read through entire file
- [ ] Identify logical groupings (list methods by responsibility)
- [ ] Draw dependency graph (what calls what)
- [ ] Plan directory structure
- [ ] Create feature branch

### **Extraction**
- [ ] Create new directory structure
- [ ] Extract first module (start with least dependencies)
- [ ] Write unit tests for extracted module
- [ ] Extract second module
- [ ] Write unit tests for second module
- [ ] Continue until all responsibilities extracted
- [ ] Create orchestrator/facade

### **Integration**
- [ ] Update imports in dependent files
- [ ] Update tests
- [ ] Run type-check (should pass)
- [ ] Run all tests (should pass)
- [ ] Manual testing

### **Cleanup**
- [ ] Remove old monolithic file
- [ ] Update documentation
- [ ] Commit with clear message
- [ ] Code review

---

## 🎯 Priority Order for Splitting

### **1. unified-llm.service.ts** (Highest Priority)
**Why**: Most complex, most used, hardest to maintain
**Estimated Time**: 4 hours
**Modules**: Discovery, Deployment, Inference, Health (4 modules)

### **2. api-client.ts** (High Priority)
**Why**: Core infrastructure, used everywhere
**Estimated Time**: 3 hours
**Modules**: Client, Retry, Cache, Error Handler (4 modules)

### **3. rollback.service.ts** (Medium Priority)
**Why**: Complex but isolated
**Estimated Time**: 2 hours
**Modules**: Snapshot, Rollback, Verification (3 modules)

### **4. vllm.service.ts** (Medium Priority)
**Why**: Can be simplified with better structure
**Estimated Time**: 2 hours
**Modules**: Native API, OpenAI Compatible, Streaming (3 modules)

---

## 🧪 Testing Strategy

### **Unit Tests** (Test each module in isolation)

```typescript
// discovery.service.test.ts
describe('ModelDiscoveryService', () => {
  let service: ModelDiscoveryService
  let mockFetch: jest.Mock

  beforeEach(() => {
    mockFetch = jest.fn()
    global.fetch = mockFetch
    service = new ModelDiscoveryService(new Map([
      ['arcade', 'mock-token']
    ]))
  })

  it('searches Chinese models', async () => {
    mockFetch.mockResolvedValueOnce({
      json: async () => [{ id: 'Qwen/Qwen2.5-7B' }]
    })

    const results = await service.searchChineseModels('arcade', {
      maxSize: '7B'
    })

    expect(results).toHaveLength(1)
    expect(results[0].name).toContain('Qwen')
  })
})
```

### **Integration Tests** (Test modules working together)

```typescript
// index.test.ts
describe('UnifiedChineseLLMService Integration', () => {
  it('completes full deployment flow', async () => {
    const service = new UnifiedChineseLLMService({
      hfTokens: new Map([['arcade', 'token']]),
      runpodApiKey: 'key'
    })

    // Search models
    const models = await service.searchChineseModels('arcade')
    expect(models.length).toBeGreaterThan(0)

    // Deploy first model
    const deployment = await service.deployModelToRunPod({
      hfModelId: models[0].id,
      organization: 'arcade',
      instanceConfig: { gpuTypeId: 'A100', gpuCount: 1 }
    })

    expect(deployment.success).toBe(true)
    expect(deployment.endpointId).toBeTruthy()
  })
})
```

---

## ⚠️ Common Pitfalls

### **1. Circular Dependencies**

```typescript
// ❌ WRONG - Circular dependency
// discovery.service.ts imports deployment.service.ts
// deployment.service.ts imports discovery.service.ts

// ✅ CORRECT - One-way dependencies
// discovery.service.ts (no imports from other services)
// deployment.service.ts imports discovery.service.ts
// orchestrator imports both
```

### **2. Shared State**

```typescript
// ❌ WRONG - Modules sharing mutable state
class ModuleA {
  private cache = new Map()  // Shared!
}
class ModuleB {
  private cache = new Map()  // Same cache!
}

// ✅ CORRECT - Inject shared dependencies
class CacheService {
  private cache = new Map()
}

class ModuleA {
  constructor(private cache: CacheService) {}
}

class ModuleB {
  constructor(private cache: CacheService) {}
}
```

### **3. Over-Splitting**

```typescript
// ❌ WRONG - Too granular (50 tiny files)
src/services/llm/
├── search.ts (10 lines)
├── filter.ts (5 lines)
├── validate.ts (8 lines)
└── ... 47 more tiny files

// ✅ CORRECT - Balanced modules (150-250 lines each)
src/services/llm/
├── discovery.service.ts (200 lines - search, filter, validate)
├── deployment.service.ts (250 lines)
└── inference.service.ts (180 lines)
```

---

## 📚 Reference: Complete Example

See the working example in:
- `src/services/huggingface/llm/discovery.service.ts`
- `src/services/huggingface/llm/deployment.service.ts`
- `src/services/huggingface/llm/index.ts`

Study these to understand the pattern, then apply to other services.

---

## 💰 Cost-Benefit Analysis

| Aspect | Before (Monolithic) | After (Modular) | Improvement |
|--------|---------------------|-----------------|-------------|
| File Size | 1,162 lines | 4 × 200 lines | ✅ 71% smaller per file |
| Test Time | 10 minutes | 2 min each (parallel) | ✅ 5x faster |
| Code Review | 2 hours | 30 min per module | ✅ Faster reviews |
| Onboarding | 2 days to understand | 2 hours per module | ✅ Incremental learning |
| Bug Fixes | Touch 1000+ lines | Touch 200 lines | ✅ 80% less risk |

**ROI**: 8-12 hours investment → Save 2-3 hours per week ongoing

---

**Ready to start?** Pick `unified-llm.service.ts` first - it's the biggest win!
