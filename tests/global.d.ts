/**
 * Global type declarations for test environment
 */

declare global {
  interface Window {
    switchTheme?: (org: string) => void;
    gc?: () => void;
    E2E_CONFIG?: {
      apiBaseUrl: string;
      testMode: 'mock' | 'real';
      organization: string;
      [key: string]: any;
    };
  }

  namespace globalThis {
    var gc: (() => void) | undefined;
  }
}

export {};