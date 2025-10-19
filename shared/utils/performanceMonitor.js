/**
 * Performance Monitoring Utilities for Navigation Flows and User Interactions
 * Tracks page load times, route changes, and user interaction patterns
 */

// Performance tracking configuration
const PERFORMANCE_CONFIG = {
  // Track Core Web Vitals
  trackWebVitals: true,

  // Track route changes
  trackRouteChanges: true,

  // Track user interactions
  trackInteractions: true,

  // Track API call performance
  trackApiCalls: true,

  // Performance thresholds (in milliseconds)
  thresholds: {
    pageLoad: 3000,      // 3 seconds
    routeChange: 1000,   // 1 second
    interaction: 100,    // 100ms for interactions
    apiCall: 2000        // 2 seconds for API calls
  },

  // Sample rate for performance tracking (0-1)
  sampleRate: 1.0 // 100% in development, reduce in production
};

/**
 * Performance Monitor Class
 */
class PerformanceMonitor {
  constructor() {
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
    this.performanceData = [];
    this.currentPage = null;
    this.routeStartTime = null;

    this.initialize();
  }

  /**
   * Initialize performance monitoring
   */
  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Track page visibility changes for accurate timing
    this.trackVisibilityChanges();

    // Track Core Web Vitals if supported
    if (PERFORMANCE_CONFIG.trackWebVitals) {
      this.trackCoreWebVitals();
    }

    // Track route changes (React Router)
    if (PERFORMANCE_CONFIG.trackRouteChanges) {
      this.trackRouteChanges();
    }

    // Track user interactions
    if (PERFORMANCE_CONFIG.trackInteractions) {
      this.trackUserInteractions();
    }

    this.isInitialized = true;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `perf_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track page visibility changes for accurate performance measurement
   */
  trackVisibilityChanges() {
    document.addEventListener('visibilitychange', () => {
      const timestamp = Date.now();
      const visibilityState = document.visibilityState;

      this.recordPerformanceMetric({
        type: 'visibility_change',
        timestamp,
        sessionId: this.sessionId,
        page: window.location.pathname,
        visibilityState,
        hiddenDuration: visibilityState === 'visible' ? timestamp - (this.lastHiddenTime || timestamp) : 0
      });

      if (visibilityState === 'hidden') {
        this.lastHiddenTime = timestamp;
      }
    });
  }

  /**
   * Track Core Web Vitals (LCP, FID, CLS)
   */
  trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];

          this.recordPerformanceMetric({
            type: 'web_vital',
            metric: 'LCP',
            value: lastEntry.startTime,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            page: window.location.pathname,
            threshold: PERFORMANCE_CONFIG.thresholds.pageLoad,
            status: lastEntry.startTime > PERFORMANCE_CONFIG.thresholds.pageLoad ? 'poor' : 'good'
          });
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordPerformanceMetric({
              type: 'web_vital',
              metric: 'FID',
              value: entry.processingStart - entry.startTime,
              timestamp: Date.now(),
              sessionId: this.sessionId,
              page: window.location.pathname,
              threshold: 100, // Standard FID threshold
              status: (entry.processingStart - entry.startTime) > 100 ? 'poor' : 'good'
            });
          });
        });

        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          this.recordPerformanceMetric({
            type: 'web_vital',
            metric: 'CLS',
            value: clsValue,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            page: window.location.pathname,
            threshold: 0.1, // Standard CLS threshold
            status: clsValue > 0.1 ? 'poor' : 'good'
          });
        });

        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Failed to initialize Core Web Vitals tracking:', error);
      }
    }
  }

  /**
   * Track React Router navigation performance
   */
  trackRouteChanges() {
    // Store original pushState and replaceState if available
    if (window.history.pushState) {
      const originalPushState = window.history.pushState;
      window.history.pushState = (...args) => {
        this.recordRouteChange('pushstate', args[0]);
        return originalPushState.apply(window.history, args);
      };
    }

    if (window.history.replaceState) {
      const originalReplaceState = window.history.replaceState;
      window.history.replaceState = (...args) => {
        this.recordRouteChange('replacestate', args[0]);
        return originalReplaceState.apply(window.history, args);
      };
    }

    // Track popstate events (back/forward navigation)
    window.addEventListener('popstate', (event) => {
      this.recordRouteChange('popstate', event.state);
    });
  }

  /**
   * Record route change performance
   */
  recordRouteChange(type, state) {
    const timestamp = Date.now();
    const fromPath = this.currentPage;
    const toPath = window.location.pathname;

    if (this.routeStartTime) {
      const duration = timestamp - this.routeStartTime;

      this.recordPerformanceMetric({
        type: 'route_change',
        timestamp,
        sessionId: this.sessionId,
        fromPath,
        toPath,
        duration,
        changeType: type,
        threshold: PERFORMANCE_CONFIG.thresholds.routeChange,
        status: duration > PERFORMANCE_CONFIG.thresholds.routeChange ? 'slow' : 'fast'
      });
    }

    this.currentPage = toPath;
    this.routeStartTime = timestamp;
  }

  /**
   * Track user interactions (clicks, form submissions, etc.)
   */
  trackUserInteractions() {
    // Track clicks on interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target;
      const interactiveElements = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];

      if (interactiveElements.includes(target.tagName)) {
        const interactionStart = performance.now();

        // Use requestIdleCallback if available to measure interaction response
        if (window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            const interactionEnd = performance.now();
            const duration = interactionEnd - interactionStart;

            this.recordPerformanceMetric({
              type: 'user_interaction',
              interactionType: 'click',
              element: target.tagName,
              elementText: target.textContent?.slice(0, 50) || '',
              elementId: target.id || '',
              elementClass: target.className || '',
              timestamp: Date.now(),
              sessionId: this.sessionId,
              page: window.location.pathname,
              duration,
              threshold: PERFORMANCE_CONFIG.thresholds.interaction,
              status: duration > PERFORMANCE_CONFIG.thresholds.interaction ? 'slow' : 'fast'
            });
          });
        }
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.recordPerformanceMetric({
          type: 'user_interaction',
          interactionType: 'form_submit',
          formAction: form.action || '',
          formMethod: form.method || 'get',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          page: window.location.pathname
        });
      }
    });
  }

  /**
   * Record performance metric
   */
  recordPerformanceMetric(metric) {
    // Apply sampling rate
    if (Math.random() > PERFORMANCE_CONFIG.sampleRate) {
      return;
    }

    const enrichedMetric = {
      ...metric,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
      } : null,
      connection: navigator.connection ? {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      } : null
    };

    this.performanceData.push(enrichedMetric);

    // Keep only recent metrics (last 1000)
    if (this.performanceData.length > 1000) {
      this.performanceData = this.performanceData.slice(-1000);
    }

    // Log performance issues
    if (metric.status === 'slow' || metric.status === 'poor') {
      console.warn('Performance Issue Detected:', enrichedMetric);
    }

    // In production, send to analytics service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(enrichedMetric);
    }
  }

  /**
   * Send performance data to analytics service
   */
  sendToAnalytics(metric) {
    // Placeholder for analytics service integration
    // Examples: Google Analytics, Mixpanel, custom analytics endpoint

    if (navigator.sendBeacon) {
      // Use sendBeacon for reliable delivery
      const data = JSON.stringify(metric);
      navigator.sendBeacon('/api/analytics/performance', data);
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const recentData = this.performanceData.slice(-100); // Last 100 metrics

    const stats = {
      totalMetrics: this.performanceData.length,
      recentMetrics: recentData.length,
      sessionId: this.sessionId,
      byType: {},
      byStatus: {},
      averages: {},
      slowOperations: []
    };

    // Group by type and status
    recentData.forEach(metric => {
      // By type
      stats.byType[metric.type] = (stats.byType[metric.type] || 0) + 1;

      // By status
      if (metric.status) {
        stats.byStatus[metric.status] = (stats.byStatus[metric.status] || 0) + 1;
      }

      // Collect slow operations
      if (metric.status === 'slow' || metric.status === 'poor') {
        stats.slowOperations.push(metric);
      }
    });

    // Calculate averages
    const durations = recentData
      .filter(m => m.duration)
      .map(m => m.duration);

    if (durations.length > 0) {
      stats.averages.duration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    return stats;
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData() {
    return {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      config: PERFORMANCE_CONFIG,
      stats: this.getPerformanceStats(),
      recentMetrics: this.performanceData.slice(-50), // Last 50 metrics
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for performance monitoring
 */
export const usePerformanceMonitor = () => {
  const startTiming = React.useCallback((operation) => {
    const startTime = performance.now();
    return {
      end: (additionalData = {}) => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        performanceMonitor.recordPerformanceMetric({
          type: 'custom_operation',
          operation,
          duration,
          timestamp: Date.now(),
          sessionId: performanceMonitor.sessionId,
          page: window.location.pathname,
          ...additionalData
        });

        return duration;
      }
    };
  }, []);

  const recordMetric = React.useCallback((metric) => {
    performanceMonitor.recordPerformanceMetric({
      ...metric,
      timestamp: Date.now(),
      sessionId: performanceMonitor.sessionId,
      page: window.location.pathname
    });
  }, []);

  return {
    startTiming,
    recordMetric,
    getStats: performanceMonitor.getPerformanceStats.bind(performanceMonitor),
    exportData: performanceMonitor.exportPerformanceData.bind(performanceMonitor)
  };
};

// React import for hooks (this will be handled by the importing component)
import React from 'react';

export default performanceMonitor;