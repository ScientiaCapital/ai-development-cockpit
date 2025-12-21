import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface TemplateField {
  name: string
  type: string
  required: boolean
  options: string[] | null
}

interface TemplateGroup {
  name: string
  order: number
  fields: TemplateField[]
}

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
  groups: TemplateGroup[]
}

interface TemplatesData {
  templates: Record<string, Template[]>
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trade: string; name: string }> }
) {
  try {
    const { trade, name } = await params
    const dataPath = path.join(process.cwd(), 'public', 'templates.json')
    const content = fs.readFileSync(dataPath, 'utf8')
    const data = JSON.parse(content) as TemplatesData

    const templates = data.templates[trade]
    if (!templates) {
      return NextResponse.json({ error: `Trade not found: ${trade}` }, { status: 404 })
    }

    const template = templates.find(t => t.slug === name || t.file === `${name}.yaml`)
    if (!template) {
      return NextResponse.json({ error: `Template not found: ${name}` }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error loading template:', error)
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 })
  }
}
