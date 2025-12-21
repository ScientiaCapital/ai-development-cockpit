import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

interface TradeInfo {
  trade: string
  count: number
  phases: Record<string, number>
}

interface TemplatesData {
  total_templates: number
  trades: TradeInfo[]
}

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'public', 'templates.json')
    const content = fs.readFileSync(dataPath, 'utf8')
    const data = JSON.parse(content) as TemplatesData

    return NextResponse.json({
      total_templates: data.total_templates,
      trades: data.trades
    })
  } catch (error) {
    console.error('Error loading trades:', error)
    return NextResponse.json({ error: 'Failed to load trades' }, { status: 500 })
  }
}
