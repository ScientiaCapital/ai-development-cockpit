#!/usr/bin/env tsx

import { validateSupabaseConfig, testSupabaseConnection, testAuthenticationFlow } from '../src/lib/supabase-test'

/**
 * Test script for Supabase setup verification
 * Run with: tsx scripts/test-supabase-setup.ts
 */
async function main() {
  console.log('🧪 Testing Supabase Setup and Configuration\n')

  // Step 1: Validate environment configuration
  console.log('1️⃣ Validating environment configuration...')
  const configValidation = validateSupabaseConfig()

  if (!configValidation.valid) {
    console.error(`❌ ${configValidation.message}`)
    console.log('\n📝 To fix this:')
    console.log('1. Copy .env.example to .env')
    console.log('2. Add your Supabase project URL and anonymous key')
    console.log('3. Make sure the variables are properly exported\n')
    process.exit(1)
  }

  console.log(`✅ ${configValidation.message}\n`)

  // Step 2: Test Supabase connection
  console.log('2️⃣ Testing Supabase connection...')
  const connectionTest = await testSupabaseConnection()

  if (!connectionTest.success) {
    console.error(`❌ ${connectionTest.message}`)
    if (connectionTest.details) {
      console.error('Details:', connectionTest.details)
    }
    console.log('\n📝 To fix this:')
    console.log('1. Verify your NEXT_PUBLIC_SUPABASE_URL is correct')
    console.log('2. Verify your NEXT_PUBLIC_SUPABASE_ANON_KEY is correct')
    console.log('3. Check that your Supabase project is running\n')
    process.exit(1)
  }

  console.log(`✅ ${connectionTest.message}`)
  if (connectionTest.details) {
    console.log('   Session state:', connectionTest.details.session ? 'Active' : 'No active session')
  }
  console.log('')

  // Step 3: Test authentication capabilities
  console.log('3️⃣ Testing authentication system...')
  const authTest = await testAuthenticationFlow()

  if (!authTest.success) {
    console.error(`❌ ${authTest.message}`)
    process.exit(1)
  }

  console.log(`✅ ${authTest.message}`)
  console.log('   Available capabilities:')
  authTest.capabilities.forEach(cap => {
    console.log(`   - ${cap}`)
  })
  console.log('')

  // Summary
  console.log('🎉 Supabase Setup Complete!')
  console.log('')
  console.log('✅ All tests passed')
  console.log('✅ Environment variables configured')
  console.log('✅ Supabase client initialized')
  console.log('✅ Database connection verified')
  console.log('✅ Authentication system ready')
  console.log('')
  console.log('🚀 Ready to implement authentication flows!')
}

// Execute if run directly
if (require.main === module) {
  main().catch(error => {
    console.error('🚨 Test script failed:', error)
    process.exit(1)
  })
}

export default main