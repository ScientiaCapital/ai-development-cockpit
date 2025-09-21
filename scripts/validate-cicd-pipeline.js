#!/usr/bin/env node

/**
 * CI/CD Pipeline Validation Script
 * 
 * This script validates the complete CI/CD pipeline setup and configuration.
 * It checks all workflow files, dependencies, and integration points.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Configuration
const WORKFLOW_DIR = '.github/workflows';
const REQUIRED_WORKFLOWS = [
  'ci.yml',
  'deploy.yml', 
  'security.yml',
  'performance.yml',
  'e2e-testing.yml',
  'cd-with-e2e.yml'
];

const REQUIRED_FILES = [
  '.github/dependabot.yml',
  'package.json',
  'playwright.config.ts',
  'jest.config.js',
  'next.config.js',
  'tsconfig.json'
];

// Validation results
const results = {
  workflows: {},
  files: {},
  configuration: {},
  security: {},
  performance: {},
  integration: {},
  summary: {
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

// Logging utilities
const logger = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => {
    console.log(`✅ ${msg}`);
    results.summary.passed++;
  },
  warning: (msg) => {
    console.log(`⚠️  ${msg}`);
    results.summary.warnings++;
  },
  error: (msg) => {
    console.log(`❌ ${msg}`);
    results.summary.failed++;
  },
  section: (title) => console.log(`\n🔍 ${title}\n${'='.repeat(50)}`)
};

// Utility functions
function fileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath));
}

function readYamlFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    return yaml.parse(content);
  } catch (error) {
    logger.error(`Failed to parse YAML file ${filePath}: ${error.message}`);
    return null;
  }
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), filePath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logger.error(`Failed to parse JSON file ${filePath}: ${error.message}`);
    return null;
  }
}

// Validation functions
function validateWorkflowFiles() {
  logger.section('Validating GitHub Actions Workflows');
  
  REQUIRED_WORKFLOWS.forEach(workflow => {
    const filePath = `${WORKFLOW_DIR}/${workflow}`;
    
    if (fileExists(filePath)) {
      logger.success(`Found workflow: ${workflow}`);
      
      const workflowContent = readYamlFile(filePath);
      if (workflowContent) {
        results.workflows[workflow] = validateWorkflowContent(workflow, workflowContent);
      }
    } else {
      logger.error(`Missing required workflow: ${workflow}`);
      results.workflows[workflow] = { exists: false, valid: false };
    }
  });
}

function validateWorkflowContent(workflowName, content) {
  const validation = {
    exists: true,
    valid: true,
    issues: []
  };

  // Check basic structure
  if (!content.name) {
    validation.issues.push('Missing workflow name');
    validation.valid = false;
  }

  if (!content.on) {
    validation.issues.push('Missing trigger configuration');
    validation.valid = false;
  }

  if (!content.jobs || Object.keys(content.jobs).length === 0) {
    validation.issues.push('No jobs defined');
    validation.valid = false;
  }

  // Workflow-specific validations
  switch (workflowName) {
    case 'ci.yml':
      validateCIWorkflow(content, validation);
      break;
    case 'deploy.yml':
      validateDeployWorkflow(content, validation);
      break;
    case 'security.yml':
      validateSecurityWorkflow(content, validation);
      break;
    case 'performance.yml':
      validatePerformanceWorkflow(content, validation);
      break;
  }

  if (validation.valid) {
    logger.success(`${workflowName} is valid`);
  } else {
    logger.error(`${workflowName} has issues: ${validation.issues.join(', ')}`);
  }

  return validation;
}

function validateCIWorkflow(content, validation) {
  const requiredJobs = ['build-and-quality', 'test-suite', 'security-scan', 'quality-gates'];
  const jobs = Object.keys(content.jobs || {});
  
  requiredJobs.forEach(job => {
    if (!jobs.includes(job)) {
      validation.issues.push(`Missing required job: ${job}`);
      validation.valid = false;
    }
  });

  // Check for quality gates
  if (content.jobs && content.jobs['quality-gates']) {
    logger.success('CI workflow includes quality gates');
  } else {
    validation.issues.push('Missing quality gates job');
    validation.valid = false;
  }
}

function validateDeployWorkflow(content, validation) {
  const requiredJobs = ['pre-deployment', 'deploy-green', 'traffic-switch', 'post-deployment-e2e'];
  const jobs = Object.keys(content.jobs || {});
  
  requiredJobs.forEach(job => {
    if (!jobs.includes(job)) {
      validation.issues.push(`Missing required job: ${job}`);
      validation.valid = false;
    }
  });

  // Check for blue-green deployment
  if (JSON.stringify(content).includes('blue') && JSON.stringify(content).includes('green')) {
    logger.success('Deploy workflow includes blue-green deployment');
  } else {
    validation.issues.push('Missing blue-green deployment configuration');
    validation.valid = false;
  }
}

function validateSecurityWorkflow(content, validation) {
  const requiredJobs = ['dependency-scan', 'secrets-scan', 'sast-scan', 'license-scan'];
  const jobs = Object.keys(content.jobs || {});
  
  requiredJobs.forEach(job => {
    if (!jobs.includes(job)) {
      validation.issues.push(`Missing required job: ${job}`);
      validation.valid = false;
    }
  });
}

function validatePerformanceWorkflow(content, validation) {
  const requiredJobs = ['bundle-analysis', 'lighthouse-audit', 'load-testing'];
  const jobs = Object.keys(content.jobs || {});
  
  requiredJobs.forEach(job => {
    if (!jobs.includes(job)) {
      validation.issues.push(`Missing required job: ${job}`);
      validation.valid = false;
    }
  });
}

function validateRequiredFiles() {
  logger.section('Validating Required Configuration Files');
  
  REQUIRED_FILES.forEach(file => {
    if (fileExists(file)) {
      logger.success(`Found required file: ${file}`);
      results.files[file] = { exists: true };
      
      // Validate specific files
      if (file === 'package.json') {
        validatePackageJson();
      } else if (file === '.github/dependabot.yml') {
        validateDependabot();
      }
    } else {
      logger.error(`Missing required file: ${file}`);
      results.files[file] = { exists: false };
    }
  });
}

function validatePackageJson() {
  const packageJson = readJsonFile('package.json');
  if (!packageJson) return;

  // Check required scripts
  const requiredScripts = [
    'build', 'dev', 'start', 'lint', 'type-check', 'test',
    'test:e2e', 'test:coverage'
  ];

  const scripts = packageJson.scripts || {};
  const missingScripts = requiredScripts.filter(script => !scripts[script]);

  if (missingScripts.length === 0) {
    logger.success('All required npm scripts are present');
  } else {
    logger.warning(`Missing npm scripts: ${missingScripts.join(', ')}`);
  }

  // Check for security-related dependencies
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const securityTools = ['@playwright/test', 'jest', 'eslint'];
  const hasSecurityTools = securityTools.some(tool => dependencies[tool]);

  if (hasSecurityTools) {
    logger.success('Security and testing tools are configured');
  } else {
    logger.warning('Missing security and testing dependencies');
  }
}

function validateDependabot() {
  const dependabot = readYamlFile('.github/dependabot.yml');
  if (!dependabot) return;

  if (dependabot.version === 2) {
    logger.success('Dependabot configuration is valid');
  } else {
    logger.error('Invalid Dependabot configuration version');
  }

  // Check for npm updates
  const updates = dependabot.updates || [];
  const hasNpmUpdates = updates.some(update => update['package-ecosystem'] === 'npm');

  if (hasNpmUpdates) {
    logger.success('Dependabot configured for npm updates');
  } else {
    logger.warning('Dependabot not configured for npm updates');
  }
}

function validateSecurityConfiguration() {
  logger.section('Validating Security Configuration');

  // Check for .env.example
  if (fileExists('.env.example')) {
    logger.success('Environment variables template exists');
  } else {
    logger.warning('Missing .env.example file');
  }

  // Check .gitignore for security
  if (fileExists('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf8');
    const securityPatterns = ['.env', 'node_modules', '*.log'];
    const missingPatterns = securityPatterns.filter(pattern => !gitignore.includes(pattern));

    if (missingPatterns.length === 0) {
      logger.success('Gitignore includes security patterns');
    } else {
      logger.warning(`Gitignore missing patterns: ${missingPatterns.join(', ')}`);
    }
  }

  // Check for secrets in repository
  const sensitiveFiles = ['.env', '.env.local', '.env.production'];
  const foundSensitiveFiles = sensitiveFiles.filter(file => fileExists(file));

  if (foundSensitiveFiles.length === 0) {
    logger.success('No sensitive files found in repository');
  } else {
    logger.error(`Sensitive files found in repository: ${foundSensitiveFiles.join(', ')}`);
  }
}

function validatePerformanceConfiguration() {
  logger.section('Validating Performance Configuration');

  // Check Next.js configuration
  if (fileExists('next.config.js')) {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    if (nextConfig.includes('compress') || nextConfig.includes('optimization')) {
      logger.success('Next.js performance optimizations configured');
    } else {
      logger.warning('Next.js performance optimizations not configured');
    }
  }

  // Check for bundle analyzer
  const packageJson = readJsonFile('package.json');
  if (packageJson && packageJson.dependencies && packageJson.dependencies['@next/bundle-analyzer']) {
    logger.success('Bundle analyzer configured');
  } else {
    logger.warning('Bundle analyzer not configured');
  }

  // Check Playwright configuration
  if (fileExists('playwright.config.ts')) {
    logger.success('Playwright E2E testing configured');
  } else {
    logger.error('Playwright configuration missing');
  }
}

function validateMonitoringIntegration() {
  logger.section('Validating Monitoring Integration');

  // Check for monitoring script
  if (fileExists('scripts/deployment-monitoring.js')) {
    logger.success('Deployment monitoring script exists');
  } else {
    logger.error('Deployment monitoring script missing');
  }

  // Check for monitoring configuration
  const packageJson = readJsonFile('package.json');
  if (packageJson && packageJson.dependencies) {
    const hasPrometheus = packageJson.dependencies['prom-client'];
    const hasOpenTelemetry = Object.keys(packageJson.dependencies).some(dep => dep.includes('opentelemetry'));

    if (hasPrometheus || hasOpenTelemetry) {
      logger.success('Monitoring dependencies configured');
    } else {
      logger.warning('Monitoring dependencies not found');
    }
  }
}

function validateIntegration() {
  logger.section('Validating CI/CD Integration');

  // Check workflow dependencies
  const workflows = ['ci.yml', 'deploy.yml', 'security.yml', 'performance.yml'];
  let integrationValid = true;

  workflows.forEach(workflow => {
    const filePath = `${WORKFLOW_DIR}/${workflow}`;
    if (fileExists(filePath)) {
      const content = readYamlFile(filePath);
      if (content && content.on) {
        const triggers = Array.isArray(content.on) ? content.on : Object.keys(content.on);
        if (triggers.includes('workflow_dispatch')) {
          logger.success(`${workflow} supports manual triggering`);
        } else {
          logger.warning(`${workflow} missing manual trigger support`);
        }
      }
    }
  });

  // Check for deployment pipeline integration
  const deployWorkflow = readYamlFile(`${WORKFLOW_DIR}/deploy.yml`);
  if (deployWorkflow && JSON.stringify(deployWorkflow).includes('monitoring')) {
    logger.success('Deployment workflow includes monitoring integration');
  } else {
    logger.warning('Deployment workflow missing monitoring integration');
  }

  // Check for artifact handling
  const ciWorkflow = readYamlFile(`${WORKFLOW_DIR}/ci.yml`);
  if (ciWorkflow && JSON.stringify(ciWorkflow).includes('upload-artifact')) {
    logger.success('CI workflow includes artifact handling');
  } else {
    logger.warning('CI workflow missing artifact handling');
  }
}

function generateReport() {
  logger.section('CI/CD Pipeline Validation Summary');

  const totalChecks = results.summary.passed + results.summary.failed + results.summary.warnings;
  const successRate = totalChecks > 0 ? (results.summary.passed / totalChecks * 100).toFixed(1) : 0;

  console.log(`
📊 Validation Summary:
- Total Checks: ${totalChecks}
- Passed: ${results.summary.passed} ✅
- Failed: ${results.summary.failed} ❌
- Warnings: ${results.summary.warnings} ⚠️
- Success Rate: ${successRate}%

🎯 CI/CD Pipeline Status: ${results.summary.failed === 0 ? 'READY FOR PRODUCTION' : 'NEEDS ATTENTION'}
`);

  // Write detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary: results.summary,
    successRate: parseFloat(successRate),
    status: results.summary.failed === 0 ? 'READY' : 'NEEDS_ATTENTION',
    details: results
  };

  fs.writeFileSync('cicd-validation-report.json', JSON.stringify(report, null, 2));
  logger.info('Detailed report saved to cicd-validation-report.json');

  // Exit with appropriate code
  process.exit(results.summary.failed > 0 ? 1 : 0);
}

// Main execution
function main() {
  console.log(`
🚀 CI/CD Pipeline Validation Script
=====================================

Validating comprehensive CI/CD pipeline setup for dual-domain LLM platform...
`);

  validateWorkflowFiles();
  validateRequiredFiles();
  validateSecurityConfiguration();
  validatePerformanceConfiguration();
  validateMonitoringIntegration();
  validateIntegration();
  generateReport();
}

// CLI interface
if (require.main === module) {
  main();
}

module.exports = {
  validateWorkflowFiles,
  validateRequiredFiles,
  validateSecurityConfiguration,
  validatePerformanceConfiguration,
  validateMonitoringIntegration,
  validateIntegration,
  results
};