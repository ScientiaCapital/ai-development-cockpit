#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const validModels = [
  'claude-sonnet-4.5',
  'claude-opus-4',
  'deepseek-r1',
  'kimi-k1.5',
  'gpt-4-turbo',
  'llama-3.3-70b',
  'qwen-2.5-coder-32b'
]

const model = process.argv[2]

if (!model) {
  console.error('Usage: npm run orchestrator:use <model>')
  console.log('Available models:')
  validModels.forEach(m => console.log(`  - ${m}`))
  process.exit(1)
}

if (!validModels.includes(model)) {
  console.error(`Invalid model: ${model}`)
  console.log('Available models:')
  validModels.forEach(m => console.log(`  - ${m}`))
  process.exit(1)
}

// Update .env file
const envPath = path.join(process.cwd(), '.env')
const envExamplePath = path.join(process.cwd(), '.env.example')

let envContent = ''

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf-8')
} else if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf-8')
}

// Update or add ORCHESTRATOR_MODEL
const modelRegex = /^ORCHESTRATOR_MODEL=.*/m
if (modelRegex.test(envContent)) {
  envContent = envContent.replace(modelRegex, `ORCHESTRATOR_MODEL=${model}`)
} else {
  envContent += `\nORCHESTRATOR_MODEL=${model}\n`
}

fs.writeFileSync(envPath, envContent)

console.log(`✅ Orchestrator model set to: ${model}`)
console.log(`📝 Updated .env file`)
console.log(`🔄 Restart your dev server to apply changes`)
