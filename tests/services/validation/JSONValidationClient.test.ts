/**
 * Tests for JSON Validation Client
 */

import { JSONValidationClient, ValidationError } from '@/services/validation/JSONValidationClient'

// Mock fetch
global.fetch = jest.fn()

describe('JSONValidationClient', () => {
  let client: JSONValidationClient
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    client = new JSONValidationClient('http://localhost:8001')
    mockFetch.mockClear()
  })

  describe('validatePlan', () => {
    it('should validate a valid plan', async () => {
      const plan = {
        project_name: 'test-project',
        language: 'python' as const,
        framework: 'fastapi',
        tasks: [
          {
            agent_type: 'CodeArchitect' as const,
            description: 'Design architecture',
            dependencies: [],
            estimated_duration: 30
          }
        ],
        total_estimated_time: 30
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          validated_data: plan
        })
      } as Response)

      const result = await client.validatePlan(plan)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/validate/plan',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    it('should throw ValidationError for invalid plan', async () => {
      const plan = {
        project_name: 'test-project',
        language: 'python' as const,
        framework: 'fastapi',
        tasks: [],
        total_estimated_time: 30
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          errors: ['tasks: List should have at least 1 item after validation'],
          validated_data: null
        })
      } as Response)

      await expect(client.validatePlan(plan)).rejects.toThrow(ValidationError)
    })

    it('should handle HTTP errors', async () => {
      const plan = {
        project_name: 'test-project',
        language: 'python' as const,
        framework: 'fastapi',
        tasks: [
          {
            agent_type: 'CodeArchitect' as const,
            description: 'Design architecture',
            dependencies: [],
            estimated_duration: 30
          }
        ],
        total_estimated_time: 30
      }

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response)

      await expect(client.validatePlan(plan)).rejects.toThrow('HTTP 500')
    })
  })

  describe('validateAgentOutput', () => {
    it('should validate valid agent output', async () => {
      const output = {
        agent_type: 'BackendDeveloper',
        files_created: [
          {
            path: 'src/api/users.py',
            content: 'from fastapi import APIRouter',
            description: 'User API endpoints'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          validated_data: output
        })
      } as Response)

      const result = await client.validateAgentOutput(output)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should throw ValidationError for invalid output', async () => {
      const output = {
        agent_type: 'BackendDeveloper',
        files_created: []
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          errors: ['files_created: Field required'],
          validated_data: null
        })
      } as Response)

      await expect(client.validateAgentOutput(output)).rejects.toThrow(ValidationError)
    })
  })

  describe('validateFile', () => {
    it('should validate a valid file', async () => {
      const file = {
        path: 'src/main.py',
        content: 'print("Hello, World!")',
        description: 'Main entry point'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: true,
          errors: [],
          validated_data: file
        })
      } as Response)

      const result = await client.validateFile(file)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('should throw ValidationError for invalid file', async () => {
      const file = {
        path: 'src/main.py',
        content: '',
        description: ''
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          valid: false,
          errors: ['content: Field required', 'description: Field required'],
          validated_data: null
        })
      } as Response)

      await expect(client.validateFile(file)).rejects.toThrow(ValidationError)
    })
  })

  describe('healthCheck', () => {
    it('should return true when service is healthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'healthy',
          service: 'json-validator'
        })
      } as Response)

      const result = await client.healthCheck()

      expect(result).toBe(true)
    })

    it('should return false when service is unhealthy', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false
      } as Response)

      const result = await client.healthCheck()

      expect(result).toBe(false)
    })

    it('should return false on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await client.healthCheck()

      expect(result).toBe(false)
    })
  })

  describe('getServiceInfo', () => {
    it('should get service information', async () => {
      const serviceInfo = {
        service: 'json-validator',
        version: '1.0.0',
        status: 'running'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => serviceInfo
      } as Response)

      const result = await client.getServiceInfo()

      expect(result).toEqual(serviceInfo)
    })

    it('should throw error on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      await expect(client.getServiceInfo()).rejects.toThrow('HTTP 404')
    })
  })
})
