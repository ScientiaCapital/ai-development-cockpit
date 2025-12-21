import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface FormSubmission {
  id?: string
  template_name: string
  template_trade: string
  form_title: string
  form_data: Record<string, string>
  status: 'draft' | 'submitted'
  submitted_by: string
  created_at?: string
  updated_at?: string
  submitted_at?: string
}

// GET - List submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const trade = searchParams.get('trade')
    const limit = parseInt(searchParams.get('limit') || '50')

    let query = supabase
      .from('form_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    if (trade) {
      query = query.eq('template_trade', trade)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ submissions: data || [] })
  } catch (error) {
    console.error('GET submissions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}

// POST - Create new submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FormSubmission

    const { template_name, template_trade, form_title, form_data, status, submitted_by } = body

    if (!template_name || !form_data) {
      return NextResponse.json(
        { error: 'template_name and form_data are required' },
        { status: 400 }
      )
    }

    const submission = {
      template_name,
      template_trade: template_trade || 'unknown',
      form_title: form_title || `${template_name} - ${new Date().toLocaleDateString()}`,
      form_data,
      status: status || 'draft',
      submitted_by: submitted_by || 'anonymous',
      submitted_at: status === 'submitted' ? new Date().toISOString() : null
    }

    const { data, error } = await supabase
      .from('form_submissions')
      .insert(submission)
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      submission: data,
      message: status === 'submitted' ? 'Form submitted successfully' : 'Draft saved'
    })
  } catch (error) {
    console.error('POST submission error:', error)
    return NextResponse.json(
      { error: 'Failed to save submission' },
      { status: 500 }
    )
  }
}
