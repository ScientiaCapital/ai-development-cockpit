/**
 * LanguageRouter Tests
 *
 * Tests for the language adapter routing system that selects
 * the correct adapter based on target language.
 *
 * Part of Phase 3: Multi-Language Support - Task 2.2
 * Created: 2025-11-17
 */

import { describe, it, expect } from '@jest/globals'
import { LanguageRouter } from '@/adapters/LanguageRouter'
import { PythonAdapter } from '@/adapters/PythonAdapter'
import { GoAdapter } from '@/adapters/GoAdapter'
import { RustAdapter } from '@/adapters/RustAdapter'

describe('LanguageRouter', () => {
  describe('constructor', () => {
    it('should initialize with all language adapters', () => {
      const router = new LanguageRouter()
      expect(router).toBeDefined()
    })
  })

  describe('getAdapter', () => {
    it('should return PythonAdapter for python language', () => {
      const router = new LanguageRouter()
      const adapter = router.getAdapter('python')

      expect(adapter).toBeInstanceOf(PythonAdapter)
      expect(adapter.language).toBe('python')
    })

    it('should return GoAdapter for go language', () => {
      const router = new LanguageRouter()
      const adapter = router.getAdapter('go')

      expect(adapter).toBeInstanceOf(GoAdapter)
      expect(adapter.language).toBe('go')
    })

    it('should return RustAdapter for rust language', () => {
      const router = new LanguageRouter()
      const adapter = router.getAdapter('rust')

      expect(adapter).toBeInstanceOf(RustAdapter)
      expect(adapter.language).toBe('rust')
    })

    it('should throw error for typescript language (not yet implemented)', () => {
      const router = new LanguageRouter()

      expect(() => router.getAdapter('typescript')).toThrow(
        'Unsupported language: typescript'
      )
    })

    it('should throw error for unsupported language', () => {
      const router = new LanguageRouter()

      // @ts-expect-error Testing invalid language
      expect(() => router.getAdapter('java')).toThrow(
        'Unsupported language: java'
      )
    })
  })

  describe('adapter caching', () => {
    it('should return the same adapter instance for multiple calls', () => {
      const router = new LanguageRouter()

      const adapter1 = router.getAdapter('python')
      const adapter2 = router.getAdapter('python')

      expect(adapter1).toBe(adapter2)
    })

    it('should return different adapter instances for different languages', () => {
      const router = new LanguageRouter()

      const pythonAdapter = router.getAdapter('python')
      const goAdapter = router.getAdapter('go')
      const rustAdapter = router.getAdapter('rust')

      expect(pythonAdapter).not.toBe(goAdapter)
      expect(goAdapter).not.toBe(rustAdapter)
      expect(pythonAdapter).not.toBe(rustAdapter)
    })
  })

  describe('supported languages', () => {
    it('should support all three implemented languages', () => {
      const router = new LanguageRouter()

      const supportedLanguages: Array<'python' | 'go' | 'rust'> = ['python', 'go', 'rust']

      supportedLanguages.forEach((language) => {
        expect(() => router.getAdapter(language)).not.toThrow()
      })
    })
  })
})
