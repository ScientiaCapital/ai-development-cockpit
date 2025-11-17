import { POST, GET } from '@/app/api/orchestrator/review/route'
import { AgentOrchestrator } from '@/orchestrator/AgentOrchestrator'
import { NextRequest } from 'next/server'

// Mock the orchestrator
jest.mock('@/orchestrator/AgentOrchestrator')

describe('POST /api/orchestrator/review', () => {
  let mockReviewCodebase: jest.Mock

  beforeEach(() => {
    mockReviewCodebase = jest.fn()
    ;(AgentOrchestrator.getInstance as jest.Mock).mockReturnValue({
      reviewCodebase: mockReviewCodebase
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return 400 if projectPath is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/orchestrator/review', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('projectPath is required')
  })

  it('should return 400 if projectPath is not a string', async () => {
    const request = new NextRequest('http://localhost:3000/api/orchestrator/review', {
      method: 'POST',
      body: JSON.stringify({ projectPath: 123 })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('must be a string')
  })

  it('should call orchestrator.reviewCodebase with projectPath', async () => {
    mockReviewCodebase.mockResolvedValue({
      summary: 'Test review',
      architecture: {},
      existingAgents: ['BackendDeveloper'],
      patterns: { hasAgents: true }
    })

    const request = new NextRequest('http://localhost:3000/api/orchestrator/review', {
      method: 'POST',
      body: JSON.stringify({ projectPath: '/test/project' })
    })

    await POST(request)

    expect(mockReviewCodebase).toHaveBeenCalledWith('/test/project')
  })

  it('should return 200 with review data on success', async () => {
    const mockReview = {
      summary: 'Test codebase review',
      architecture: { src: { agents: 'file' } },
      existingAgents: ['BackendDeveloper', 'FrontendDeveloper'],
      patterns: { hasAgents: true, hasComponents: true }
    }

    mockReviewCodebase.mockResolvedValue(mockReview)

    const request = new NextRequest('http://localhost:3000/api/orchestrator/review', {
      method: 'POST',
      body: JSON.stringify({ projectPath: '/test/project' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockReview)
  })

  it('should return 500 on orchestrator error', async () => {
    mockReviewCodebase.mockRejectedValue(new Error('Review failed'))

    const request = new NextRequest('http://localhost:3000/api/orchestrator/review', {
      method: 'POST',
      body: JSON.stringify({ projectPath: '/test/project' })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Review failed')
  })
})

describe('GET /api/orchestrator/review', () => {
  it('should return API health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/orchestrator/review', {
      method: 'GET'
    })

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.methods).toContain('POST')
  })
})
