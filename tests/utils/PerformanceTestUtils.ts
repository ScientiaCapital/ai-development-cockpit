/**
 * Performance Test Utils - Web Vitals and performance measurement utilities for E2E testing
 * Provides standardized performance measurement for SLA validation
 */

import { Page } from '@playwright/test';

export interface WebVitalMetrics {
  LCP: number; // Largest Contentful Paint in milliseconds
  FID: number; // First Input Delay in milliseconds
  CLS: number; // Cumulative Layout Shift score
  FCP: number; // First Contentful Paint in milliseconds
  TTFB: number; // Time to First Byte in milliseconds
}

export interface PageLoadMetrics extends WebVitalMetrics {
  loadTime: number;
  domContentLoaded: number;
  networkRequests: number;
  totalTransferSize: number;
}

export class PerformanceTestUtils {
  constructor(private page: Page) {}

  /**
   * Measure page load performance including Web Vitals
   */
  async measurePageLoad(url: string): Promise<PageLoadMetrics> {
    const startTime = Date.now();
    
    // Navigate to the page
    await this.page.goto(url, { waitUntil: 'networkidle' });
    
    // Measure Web Vitals using browser APIs
    const webVitals = await this.page.evaluate(() => {
      return new Promise<WebVitalMetrics>((resolve) => {
        const metrics: Partial<WebVitalMetrics> = {};
        
        // LCP - Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            const lastEntry = entries[entries.length - 1];
            metrics.LCP = lastEntry.startTime;
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // FID - First Input Delay (simulated as 0 for automated testing)
        metrics.FID = 0;

        // CLS - Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          metrics.CLS = clsValue;
        }).observe({ type: 'layout-shift', buffered: true });

        // FCP - First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            metrics.FCP = entries[0].startTime;
          }
        }).observe({ type: 'paint', buffered: true });

        // TTFB - Time to First Byte
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          metrics.TTFB = navigation.responseStart - navigation.requestStart;
        }

        // Wait a bit for observers to collect data
        setTimeout(() => {
          resolve({
            LCP: metrics.LCP || 0,
            FID: metrics.FID || 0,
            CLS: metrics.CLS || 0,
            FCP: metrics.FCP || 0,
            TTFB: metrics.TTFB || 0
          });
        }, 100);
      });
    });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Get network information
    const networkInfo = await this.page.evaluate(() => {
      const entries = performance.getEntriesByType('resource');
      return {
        networkRequests: entries.length,
        totalTransferSize: entries.reduce((total, entry: any) => total + (entry.transferSize || 0), 0)
      };
    });

    // Get DOM content loaded timing
    const domContentLoaded = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0;
    });

    return {
      ...webVitals,
      loadTime,
      domContentLoaded,
      networkRequests: networkInfo.networkRequests,
      totalTransferSize: networkInfo.totalTransferSize
    };
  }

  /**
   * Measure API response time
   */
  async measureApiResponse(apiCall: () => Promise<any>): Promise<number> {
    const startTime = performance.now();
    await apiCall();
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Validate performance against SLA thresholds
   */
  validateSLA(metrics: WebVitalMetrics, thresholds: Partial<WebVitalMetrics>): boolean {
    if (thresholds.LCP && metrics.LCP > thresholds.LCP) return false;
    if (thresholds.FID && metrics.FID > thresholds.FID) return false;
    if (thresholds.CLS && metrics.CLS > thresholds.CLS) return false;
    if (thresholds.FCP && metrics.FCP > thresholds.FCP) return false;
    if (thresholds.TTFB && metrics.TTFB > thresholds.TTFB) return false;
    return true;
  }
}