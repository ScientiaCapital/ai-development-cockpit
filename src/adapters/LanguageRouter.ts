/**
 * Language Router - Adapter Selection System
 *
 * Routes agent requests to the appropriate language adapter based on
 * the target programming language. Manages adapter instances and ensures
 * correct adapter selection for multi-language code generation.
 *
 * Part of Phase 3: Multi-Language Support - Task 2.2
 * Created: 2025-11-17
 */

import { LanguageAdapter } from './LanguageAdapter'
import { PythonAdapter } from './PythonAdapter'
import { GoAdapter } from './GoAdapter'
import { RustAdapter } from './RustAdapter'

/**
 * LanguageRouter - Selects the correct language adapter
 *
 * Manages a registry of language adapters and provides
 * efficient adapter selection based on target language.
 *
 * Features:
 * - Singleton adapter instances (one per language)
 * - Fast adapter lookup via Map
 * - Clear error messages for unsupported languages
 * - Extensible design for future language support
 *
 * @example
 * ```typescript
 * const router = new LanguageRouter()
 * const adapter = router.getAdapter('python')
 * const code = await adapter.adaptCode(output, context)
 * ```
 */
export class LanguageRouter {
  /**
   * Registry of language adapters
   * Key: language name ('python', 'go', 'rust')
   * Value: adapter instance
   */
  private adapters: Map<string, LanguageAdapter>

  /**
   * Initialize router with all available language adapters
   */
  constructor() {
    this.adapters = new Map<string, LanguageAdapter>([
      ['python', new PythonAdapter()],
      ['go', new GoAdapter()],
      ['rust', new RustAdapter()],
    ])
  }

  /**
   * Get the adapter for a specific language
   *
   * Returns the appropriate language adapter instance based on
   * the target language. Throws error if language is not supported.
   *
   * @param {string} language - Target programming language
   * @returns {LanguageAdapter} The language adapter instance
   * @throws {Error} If language is not supported
   *
   * @example
   * ```typescript
   * const router = new LanguageRouter()
   *
   * // Get Python adapter
   * const pythonAdapter = router.getAdapter('python')
   *
   * // Get Go adapter
   * const goAdapter = router.getAdapter('go')
   * ```
   */
  getAdapter(language: 'typescript' | 'python' | 'go' | 'rust'): LanguageAdapter {
    const adapter = this.adapters.get(language)

    if (!adapter) {
      throw new Error(`Unsupported language: ${language}`)
    }

    return adapter
  }
}
