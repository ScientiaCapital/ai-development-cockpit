import { NextRequest, NextResponse } from 'next/server'

// Import our existing MCP unified API (we'll need to adapt it)
const MCPUnifiedAPI = require('../../../../../mcp-unified-api.js')

let mcpInstance: any = null

async function getMCPInstance() {
  if (!mcpInstance) {
    mcpInstance = new MCPUnifiedAPI.default()
    await mcpInstance.initialize()
  }
  return mcpInstance
}

export async function GET(request: NextRequest) {
  try {
    const mcp = await getMCPInstance()
    const status = await mcp.getServerStatus()

    return NextResponse.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('MCP Unified API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get MCP status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { server, method, params } = body

    if (!server || !method) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: server and method'
      }, { status: 400 })
    }

    const mcp = await getMCPInstance()
    const result = await mcp.executeOnServer(server, method, params || {})

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('MCP Execute Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to execute MCP command',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}