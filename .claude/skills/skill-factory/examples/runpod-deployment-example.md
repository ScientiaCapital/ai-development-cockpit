# Example: RunPod Deployment Skill

This is a complete example of a production-ready skill for your platform.

---

```yaml
---
name: runpod-deployment
description: Deploy Chinese LLM models (Qwen, DeepSeek, ChatGLM, Baichuan, Yi) to RunPod serverless with vLLM. Use when deploying models, checking deployment status, configuring vLLM settings, estimating costs, or troubleshooting deployments.
allowed-tools: Read, Write, Edit, Bash, Grep
---

# RunPod Deployment

Deploy and manage Chinese LLM models on RunPod serverless infrastructure with vLLM.

## When to Use This Skill

- Deploying a new model to RunPod
- Checking deployment status
- Configuring vLLM parameters
- Estimating deployment costs
- Troubleshooting failed deployments
- Optimizing model performance
- User asks: "deploy to RunPod", "vLLM setup", "model deployment"

## Quick Deploy

Deploy a Qwen model:
```bash
# Set environment
export RUNPOD_API_KEY="your-key"

# The service handles everything
# Just specify the model
```

## Core Operations

### 1. Deploy Model

**Purpose**: Deploy a HuggingFace model to RunPod with vLLM

**Steps**:
1. Check model exists on HuggingFace
2. Configure vLLM parameters (max_model_len, gpu_memory_utilization)
3. Select GPU type and count
4. Deploy via RunPod API
5. Wait for endpoint to be ready
6. Test inference

**Files**:
- `src/services/huggingface/unified-llm.service.ts:36-150` - Main deployment logic
- `src/services/runpod/vllm.service.ts:1-721` - vLLM configuration
- `src/services/runpod/deployment.service.ts:1-350` - RunPod API calls

### 2. Check Status

**Purpose**: Monitor deployment health and readiness

**Steps**:
```bash
# Use the monitoring service
# Checks endpoint status, health, and metrics
```

**Files**:
- `src/services/runpod/monitoring.service.ts:1-611` - Health monitoring

### 3. Estimate Costs

**Purpose**: Calculate deployment costs before launching

**Steps**:
1. Get model size and requirements
2. Select GPU configuration
3. Estimate tokens per month
4. Calculate hourly and monthly costs
5. Compare with alternatives

**Files**:
- `src/services/runpod/cost.service.ts:1-569` - Cost calculation

### 4. Configure vLLM

**Purpose**: Optimize vLLM settings for your model

**Key parameters**:
```typescript
{
  maxModelLen: 32768,              // Max sequence length
  gpuMemoryUtilization: 0.9,       // GPU memory %
  maxNumBatchedTokens: 8192,       // Batch size
  maxNumSeqs: 256,                 // Concurrent sequences
  quantization: 'awq',             // Quantization method
  tensorParallelSize: 2            // Multi-GPU parallelism
}
```

## Supported Models

### Qwen Series
- `Qwen/Qwen2.5-7B-Instruct`
- `Qwen/Qwen2.5-14B-Instruct`
- `Qwen/Qwen2.5-72B-Instruct`

### DeepSeek Series
- `deepseek-ai/DeepSeek-V2-Lite`
- `deepseek-ai/DeepSeek-Coder-V2-Instruct`

### ChatGLM Series
- `THUDM/chatglm3-6b`
- `THUDM/glm-4-9b-chat`

### Others
- `baichuan-inc/Baichuan2-7B-Chat`
- `01-ai/Yi-34B-Chat`
- `internlm/internlm2-7b-chat`

## Cost Optimization

### GPU Selection Guide

**Small models (< 10B params)**:
- RTX A4000 (16GB): $0.20/hr
- Best for: Qwen-7B, ChatGLM-6B

**Medium models (10-30B params)**:
- RTX A5000 (24GB): $0.40/hr
- Best for: Qwen-14B, Yi-34B (quantized)

**Large models (> 30B params)**:
- A100 (80GB): $1.89/hr
- Best for: Qwen-72B, DeepSeek-V2

### Quantization Benefits

- **AWQ**: 4-bit, 50% cost reduction, minimal quality loss
- **GPTQ**: 4-bit, similar to AWQ
- **FP16**: No compression, highest quality, highest cost
- **FP8**: 8-bit, 25% cost reduction, good quality

## Organization-Specific Configs

### SwaggyStacks (Developer-focused)
```typescript
{
  gpuMemoryUtilization: 0.95,    // Aggressive
  maxNumBatchedTokens: 16384,    // High throughput
  costOptimization: 'performance'
}
```

### ScientiaCapital (Enterprise-focused)
```typescript
{
  gpuMemoryUtilization: 0.85,    // Conservative
  maxNumBatchedTokens: 8192,     // Stable
  costOptimization: 'balanced'
}
```

## Troubleshooting

### Issue: Deployment Fails - Out of Memory

**Symptoms**:
```
Error: CUDA out of memory
```

**Solution**:
1. Reduce `gpuMemoryUtilization` to 0.85
2. Decrease `maxModelLen` to 16384
3. Use quantization (AWQ/GPTQ)
4. Upgrade to larger GPU

### Issue: Deployment Stuck in "Deploying"

**Symptoms**: Status doesn't change after 10 minutes

**Solution**:
```bash
# Check RunPod status
# View deployment logs
# If needed, trigger rollback
```

**Files**: `src/services/runpod/rollback.service.ts:1-701`

### Issue: High Latency

**Symptoms**: Inference takes > 5 seconds per token

**Solution**:
1. Check `tensorParallelSize` (use multi-GPU)
2. Reduce `maxNumSeqs` (less concurrent requests)
3. Use faster GPU (A100 vs A5000)
4. Optimize `maxNumBatchedTokens`

## Rollback

If deployment fails, automatic rollback occurs within 30 seconds.

Manual rollback:
```bash
# Use rollback service
# Restores previous working deployment
```

**Files**: `src/services/runpod/rollback.service.ts:150-300`

## Best Practices

✅ **Do**:
- Test with small models first
- Estimate costs before deploying
- Monitor GPU utilization
- Use quantization for cost savings
- Set up health checks

❌ **Don't**:
- Deploy without cost estimation
- Skip monitoring setup
- Use FP16 for large models (expensive)
- Ignore OOM errors (will crash)

## API Integration

### Native RunPod API
```typescript
POST /runsync
{
  "input": {
    "prompt": "Hello",
    "max_tokens": 100
  }
}
```

### OpenAI-Compatible API
```typescript
POST /v1/chat/completions
{
  "model": "model-id",
  "messages": [{"role": "user", "content": "Hello"}]
}
```

## Related Skills

- `cost-optimization` - For detailed cost analysis
- `supabase-auth-ops` - For authentication
- `e2e-testing` - For deployment validation

## Advanced Usage

For multi-region deployment, A/B testing, and advanced configurations, see [REFERENCE.md](REFERENCE.md).

## Version History

- v1.0.0 (2025-11-05): Initial deployment skill
```

---

## Why This Example Works

### 1. **Clear Description**
```yaml
description: Deploy Chinese LLM models (Qwen, DeepSeek, ChatGLM, Baichuan, Yi) to RunPod serverless with vLLM. Use when deploying models, checking deployment status, configuring vLLM settings, estimating costs, or troubleshooting deployments.
```
- ✅ Lists specific models (Qwen, DeepSeek, ChatGLM)
- ✅ Mentions platform (RunPod serverless with vLLM)
- ✅ Specifies use cases (deploy, check status, configure, estimate)
- ✅ Natural language triggers

### 2. **File References with Line Numbers**
```markdown
- `src/services/huggingface/unified-llm.service.ts:36-150` - Main deployment logic
```
- Easy navigation
- Specific locations
- Clear purposes

### 3. **Progressive Disclosure**
- Quick deploy for common case
- Detailed operations for deep dives
- Advanced usage links to REFERENCE.md

### 4. **Organization-Specific**
- SwaggyStacks config (aggressive)
- ScientiaCapital config (conservative)
- Aligns with dual-domain strategy

### 5. **Practical Troubleshooting**
Real errors with real solutions

### 6. **Cost-Conscious**
Includes cost optimization throughout (97% savings message)
