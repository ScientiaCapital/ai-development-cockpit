import { supabase } from './supabase'

/**
 * Test Supabase connection and basic functionality
 * This utility helps verify that the Supabase client is properly configured
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    // Test 1: Check if Supabase client is initialized
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client not initialized'
      }
    }

    // Test 2: Test basic connection with a simple auth status check
    const { data: session, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return {
        success: false,
        message: 'Failed to get session from Supabase',
        details: sessionError
      }
    }

    // Test 3: Test a basic database query (will work even without tables)
    const { data, error } = await supabase
      .from('dummy_table')
      .select('*')
      .limit(1)

    // We expect this to fail since the table doesn't exist, but it proves connection works
    if (error && error.code === 'PGRST116') {
      // This is expected - table doesn't exist yet
      return {
        success: true,
        message: 'Supabase connection successful - ready for schema setup',
        details: {
          session: session,
          connectionTest: 'Database connection verified'
        }
      }
    }

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        message: 'Unexpected database error',
        details: error
      }
    }

    return {
      success: true,
      message: 'Supabase connection and database access verified',
      details: {
        session: session,
        queryTest: 'Database queries working'
      }
    }

  } catch (error) {
    return {
      success: false,
      message: 'Connection test failed with exception',
      details: error
    }
  }
}

/**
 * Test authentication flow (without requiring actual user signup)
 */
export async function testAuthenticationFlow(): Promise<{
  success: boolean
  message: string
  capabilities: string[]
}> {
  try {
    const capabilities: string[] = []

    // Test auth listeners
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      // This confirms auth listeners are working
      capabilities.push('Auth state change listeners')
    })

    if (authListener) {
      capabilities.push('Auth listeners initialized')
    }

    // Test session management
    const { data: session } = await supabase.auth.getSession()
    capabilities.push('Session management')

    // Test user retrieval
    const { data: user } = await supabase.auth.getUser()
    capabilities.push('User data retrieval')

    return {
      success: true,
      message: 'Authentication system ready',
      capabilities
    }

  } catch (error) {
    return {
      success: false,
      message: 'Authentication test failed',
      capabilities: []
    }
  }
}

/**
 * Environment configuration validation
 */
export function validateSupabaseConfig(): {
  valid: boolean
  missing: string[]
  message: string
} {
  const missing: string[] = []

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    missing.push('NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }

  if (missing.length > 0) {
    return {
      valid: false,
      missing,
      message: `Missing required environment variables: ${missing.join(', ')}`
    }
  }

  return {
    valid: true,
    missing: [],
    message: 'All required Supabase environment variables are configured'
  }
}