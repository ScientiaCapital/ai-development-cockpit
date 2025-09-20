import { NextRequest, NextResponse } from 'next/server'

// Import our existing MCP health monitor
const MCPHealthMonitor = require('../../../../../mcp-health-monitor.js')

let healthInstance: any = null

async function getHealthInstance() {
  if (!healthInstance) {
    // Initialize health monitor with basic config
    healthInstance = new MCPHealthMonitor.default({
      servers: [
        'task-master-ai',
        'shrimp-task-manager',
        'sequential-thinking',
        'memory',
        'serena'
      ],
      checkInterval: 30000, // 30 seconds
      timeout: 5000 // 5 seconds
    })
    await healthInstance.start()
  }
  return healthInstance
}

export async function GET(request: NextRequest) {
  try {
    const health = await getHealthInstance()
    const status = await health.checkAllServers()

    const serverStatuses = Object.entries(status).map(([server, data]: [string, any]) => ({
      server,
      status: data.status,
      latency: data.latency,
      lastCheck: data.lastCheck,
      uptime: data.uptime
    }))

    const overallHealth = serverStatuses.every(s => s.status === 'healthy')

    return NextResponse.json({
      success: true,
      data: {
        overall: overallHealth ? 'healthy' : 'degraded',
        servers: serverStatuses,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Health Check Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, server } = body

    const health = await getHealthInstance()

    switch (action) {
      case 'restart':
        if (server) {
          await health.restartServer(server)
          return NextResponse.json({
            success: true,
            message: `Server ${server} restart initiated`
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Server name required for restart'
          }, { status: 400 })
        }

      case 'check':
        const status = server
          ? await health.checkServer(server)
          : await health.checkAllServers()

        return NextResponse.json({
          success: true,
          data: status
        })

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}`
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Health Action Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Health action failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}