import 'axios';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    skipAuth?: boolean;
    metadata?: {
      startTime?: number;
      retryCount?: number;
      organization?: string;
      [key: string]: any;
    };
  }
}

// Extend WebSocket interface for ping method
declare global {
  interface WebSocket {
    ping?: () => void;
  }
}