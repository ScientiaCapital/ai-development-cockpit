// Global TypeScript declarations for PWA APIs

// PWA Background Sync API
interface SyncManager {
  /**
   * Registers a background sync event
   * @param tag - Unique identifier for the sync event
   */
  register(tag: string): Promise<void>;
  
  /**
   * Gets all registered sync tags
   */
  getTags(): Promise<string[]>;
}

// Service Worker Registration with PWA extensions
interface ServiceWorkerRegistration {
  /**
   * Background sync manager for PWA offline functionality
   */
  readonly sync: SyncManager;
}

// Extend Navigator interface to include PWA-specific properties
declare global {
  interface Navigator {
    /**
     * Returns true if the web app is running in standalone mode (installed as a PWA)
     * This property is available on iOS Safari and other browsers that support PWA installation
     * @see https://developer.mozilla.org/en-US/docs/Web/API/Navigator/standalone
     */
    readonly standalone?: boolean;
  }

  interface Window {
    /**
     * Navigator interface with PWA extensions
     */
    navigator: Navigator;
    
    /**
     * Background sync API for PWA offline message queuing
     */
    backgroundSync?: {
      queueMessage: (messageData: any) => Promise<string>;
      isOnline: boolean;
      queuedCount: number;
      pendingMessages: any[];
    };
  }
}

// This empty export ensures this file is treated as a module
export {};