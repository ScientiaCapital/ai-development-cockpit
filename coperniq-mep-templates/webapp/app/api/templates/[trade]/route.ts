import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface Template {
  trade: string
  name: string
  file: string
  slug: string
  emoji: string
  description: string
  phase: string | null
  category?: string
  work_order_type?: string
  fields_count: number
  groups_count: number
}

interface TemplatesData {
  templates: Record<string, Template[]>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trade: string }> }
) {
  try {
    const { trade } = await params
    const dataPath = path.join(process.cwd(), 'public', 'templates.json')
    const content = fs.readFileSync(dataPath, 'utf8')
    const data = JSON.parse(content) as TemplatesData

    const templates = data.templates[trade]
    if (!templates) {
      return NextResponse.json({ error: `Trade not found: ${trade}` }, { status: 404 })
    }

    return NextResponse.json({
      trade,
      templates,
      total: templates.length
    })
  } catch (error) {
    console.error('Error loading templates:', error)
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 })
  }
}
