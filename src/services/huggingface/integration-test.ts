/**
 * Integration Test for Unified Chinese LLM Service
 * Tests the real RunPod integration with HuggingFace model discovery
 */

import { UnifiedChineseLLMService } from './unified-llm.service';

export async function testUnifiedService() {
  console.log('🚀 Starting Unified Chinese LLM Service Integration Test');

  const service = new UnifiedChineseLLMService();

  try {
    // Test 1: Health Check
    console.log('\n📊 Testing health check...');
    const health = await service.healthCheck();
    console.log('Health status:', health);

    // Test 2: Search Chinese Models
    console.log('\n🔍 Searching for Chinese models...');
    const searchResults = await service.searchChineseModels({
      organization: 'swaggystacks',
      query: 'qwen',
      maxSize: '7B',
      limit: 5
    });

    console.log(`Found ${searchResults.models.length} Chinese models:`);
    searchResults.models.forEach(model => {
      console.log(`  - ${model.id} (${model.size}, ${model.downloads} downloads)`);
    });

    // Test 3: Get Popular Models
    console.log('\n⭐ Getting popular Chinese models...');
    const popularResults = await service.getPopularChineseModels('swaggystacks');

    if (popularResults.success) {
      console.log(`Found ${popularResults.models.length} popular models:`);
      popularResults.models.slice(0, 3).forEach(model => {
        console.log(`  - ${model.id} (${model.downloads} downloads, ${model.likes} likes)`);
      });
    }

    // Test 4: Model Deployment (Dry Run)
    console.log('\n🚀 Testing model deployment configuration...');
    if (searchResults.models.length > 0) {
      const firstModel = searchResults.models[0];
      console.log(`Would deploy: ${firstModel.id}`);

      // Create deployment config without actually deploying
      const deploymentConfig = {
        organization: 'swaggystacks',
        hfModelId: firstModel.id,
        instanceConfig: {
          gpuTypeId: 'NVIDIA RTX A5000',
          gpuCount: 1,
          containerDiskInGb: 50,
          minWorkers: 0,
          maxWorkers: 1
        },
        vllmConfig: {
          maxModelLen: 4096,
          quantization: 'fp16' as const,
          flashAttention: true
        },
        autoStart: false // Don't actually start for test
      };

      console.log('Deployment configuration created:', deploymentConfig);
    }

    // Test 5: Check deployed models
    console.log('\n📋 Checking deployed models...');
    const deployedModels = service.getDeployedModels();
    console.log(`Currently deployed models: ${deployedModels.size}`);

    for (const [modelId, config] of deployedModels.entries()) {
      console.log(`  - ${modelId}: ${config.deploymentStatus} (endpoint: ${config.runpodEndpointId})`);
    }

    console.log('\n✅ Integration test completed successfully!');
    return {
      success: true,
      searchResults: searchResults.models.length,
      popularModels: popularResults.models?.length || 0,
      deployedModels: deployedModels.size,
      healthStatus: health.healthy
    };

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    // Cleanup
    await service.disconnect();
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testUnifiedService()
    .then(result => {
      console.log('\n📊 Test Results:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}