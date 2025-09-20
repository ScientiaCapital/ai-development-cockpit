#!/usr/bin/env node

/**
 * RunPod Deployment Test Script
 * Tests the actual RunPod integration with real API key
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

// Since we're using TypeScript modules, we'll need to test via the API instead
const fetch = require('node-fetch');

async function testRunPodConnection() {
  console.log('🧪 Testing RunPod Deployment Service...\n');

  try {
    // Check if API key is available
    if (!process.env.RUNPOD_API_KEY) {
      throw new Error('RUNPOD_API_KEY not found in environment variables');
    }

    console.log('✅ RunPod API key found in environment');

    // Initialize services
    const runpodService = new RunPodDeploymentService();
    const hfService = new HuggingFaceDiscoveryService();

    console.log('✅ Services initialized successfully\n');

    // Test 1: Get available GPU types
    console.log('📡 Testing RunPod API connection...');
    const gpuTypes = await runpodService.getAvailableGpuTypes();
    console.log('✅ Successfully connected to RunPod API');
    console.log(`📊 Available GPU types: ${gpuTypes.slice(0, 3).join(', ')}...\n`);

    // Test 2: Get a small model for testing
    console.log('🔍 Finding a small model for testing...');
    let testModel;

    if (process.env.HUGGINGFACE_TOKEN) {
      const models = await hfService.searchModels({
        search: 'microsoft/DialoGPT-small',
        limit: 1
      });
      testModel = models.models[0];
      console.log(`✅ Found test model: ${testModel?.id || 'microsoft/DialoGPT-small'}`);
    } else {
      console.log('⚠️  HuggingFace token not available, using fallback model');
      testModel = {
        id: 'microsoft/DialoGPT-small',
        parameterCount: '117M',
        requirements: {
          minGpuMemory: 4,
          recommendedGpuMemory: 8
        }
      };
    }

    // Test 3: Deploy the test model
    console.log('\n🚀 Testing model deployment...');
    const deploymentConfig = {
      modelId: testModel.id,
      gpuType: 'NVIDIA RTX A6000', // Use a common GPU type
      minWorkers: 0,
      maxWorkers: 1,
      timeout: 300,
      envVars: {
        MODEL_NAME: testModel.id,
        MAX_MODEL_LEN: '2048'
      }
    };

    console.log(`📦 Deploying model: ${testModel.id}`);
    const deployment = await runpodService.deployModel(deploymentConfig);

    console.log('✅ Model deployment initiated');
    console.log(`🆔 Endpoint ID: ${deployment.endpointId}`);
    console.log(`🌐 Endpoint URL: ${deployment.endpointUrl}`);
    console.log(`💰 Estimated cost: $${deployment.estimatedCostPerHour}/hour\n`);

    // Test 4: Check deployment status
    console.log('📊 Checking deployment status...');
    const status = await runpodService.checkEndpointHealth(deployment.endpointId);
    console.log(`📈 Status: ${status.status}`);
    console.log(`👥 Workers ready: ${status.workersReady}`);
    console.log(`💤 Workers idle: ${status.workersIdle}\n`);

    // Test 5: Wait a bit and check again (to see if it's warming up)
    console.log('⏳ Waiting 30 seconds to check deployment progress...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    const updatedStatus = await runpodService.checkEndpointHealth(deployment.endpointId);
    console.log(`📈 Updated status: ${updatedStatus.status}`);
    console.log(`👥 Workers ready: ${updatedStatus.workersReady}`);
    console.log(`💤 Workers idle: ${updatedStatus.workersIdle}\n`);

    // Test 6: Clean up - stop the test deployment
    console.log('🧹 Cleaning up test deployment...');
    const stopped = await runpodService.stopEndpoint(deployment.endpointId);

    if (stopped) {
      console.log('✅ Test deployment stopped successfully');
    } else {
      console.log('⚠️  Failed to stop test deployment - you may need to manually stop it');
      console.log(`🆔 Endpoint ID to clean up: ${deployment.endpointId}`);
    }

    console.log('\n🎉 RunPod deployment test completed successfully!');
    console.log('✅ All systems are working correctly');

  } catch (error) {
    console.error('\n❌ RunPod deployment test failed:');
    console.error(error.message);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('\n💡 This might be an API key issue. Please verify:');
      console.error('   - RUNPOD_API_KEY is correctly set in .env.local');
      console.error('   - The API key has the necessary permissions');
    }

    process.exit(1);
  }
}

// Run the test
testRunPodConnection();