/**
 * User Interaction Tracking Utilities
 * Monitors user behavior, feature usage, and interaction patterns
 */

// Interaction tracking configuration
const INTERACTION_CONFIG = {
  // Track button clicks
  trackButtonClicks: true,

  // Track form interactions
  trackFormInteractions: true,

  // Track navigation events
  trackNavigation: true,

  // Track scroll behavior
  trackScrollBehavior: true,

  // Track time spent on pages
  trackTimeOnPage: true,

  // Track feature usage
  trackFeatureUsage: true,

  // Sample rate for interaction tracking (0-1)
  sampleRate: 0.3, // 30% to avoid performance impact

  // Debounce settings for scroll events (milliseconds)
  scrollDebounce: 500,

  // Maximum interactions to store per session
  maxInteractions: 500
};

/**
 * User Interaction Tracker Class
 */
class UserInteractionTracker {
  constructor() {
    this.isInitialized = false;
    this.sessionId = this.generateSessionId();
    this.interactions = [];
    this.currentPage = null;
    this.pageStartTime = null;
    this.lastScrollTime = 0;
    this.scrollDepth = 0;

    this.initialize();
  }

  /**
   * Initialize interaction tracking
   */
  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.currentPage = window.location.pathname;
    this.pageStartTime = Date.now();

    // Track page unload to calculate time on page
    window.addEventListener('beforeunload', () => {
      this.trackTimeOnPage();
    });

    // Track page visibility for accurate time calculation
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.trackTimeOnPage();
      } else if (document.visibilityState === 'visible') {
        this.pageStartTime = Date.now();
      }
    });

    // Track button clicks
    if (INTERACTION_CONFIG.trackButtonClicks) {
      this.trackButtonClicks();
    }

    // Track form interactions
    if (INTERACTION_CONFIG.trackFormInteractions) {
      this.trackFormInteractions();
    }

    // Track navigation events
    if (INTERACTION_CONFIG.trackNavigation) {
      this.trackNavigationEvents();
    }

    // Track scroll behavior
    if (INTERACTION_CONFIG.trackScrollBehavior) {
      this.trackScrollBehavior();
    }

    // Track feature usage
    if (INTERACTION_CONFIG.trackFeatureUsage) {
      this.trackFeatureUsage();
    }

    this.isInitialized = true;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `interaction_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track button clicks
   */
  trackButtonClicks() {
    document.addEventListener('click', (event) => {
      if (Math.random() > INTERACTION_CONFIG.sampleRate) return;

      const target = event.target;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');

        this.recordInteraction({
          type: 'button_click',
          element: 'button',
          elementText: button.textContent?.trim().slice(0, 100) || '',
          elementId: button.id || '',
          elementClass: button.className || '',
          buttonType: button.type || 'button',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          page: window.location.pathname,
          position: {
            x: event.clientX,
            y: event.clientY
          }
        });
      }
    });
  }

  /**
   * Track form interactions
   */
  trackFormInteractions() {
    // Track form field focus/blur
    document.addEventListener('focusin', (event) => {
      if (Math.random() > INTERACTION_CONFIG.sampleRate) return;

      const target = event.target;
      const formFields = ['INPUT', 'TEXTAREA', 'SELECT'];

      if (formFields.includes(target.tagName)) {
        this.recordInteraction({
          type: 'form_focus',
          element: target.tagName.toLowerCase(),
          fieldType: target.type || '',
          fieldName: target.name || '',
          fieldId: target.id || '',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          page: window.location.pathname
        });
      }
    });

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        this.recordInteraction({
          type: 'form_submit',
          formAction: form.action || '',
          formMethod: form.method || 'get',
          formId: form.id || '',
          fieldCount: form.elements.length,
          timestamp: Date.now(),
          sessionId: this.sessionId,
          page: window.location.pathname
        });
      }
    });
  }

  /**
   * Track navigation events
   */
  trackNavigationEvents() {
    // Track link clicks (internal navigation)
    document.addEventListener('click', (event) => {
      if (Math.random() > INTERACTION_CONFIG.sampleRate) return;

      const target = event.target;
      const link = target.closest('a');

      if (link && link.href && link.hostname === window.location.hostname) {
        this.recordInteraction({
          type: 'internal_navigation',
          fromPath: window.location.pathname,
          toPath: link.pathname,
          linkText: link.textContent?.trim().slice(0, 100) || '',
          linkId: link.id || '',
          timestamp: Date.now(),
          sessionId: this.sessionId,
          page: window.location.pathname
        });
      }
    });

    // Track browser back/forward
    window.addEventListener('popstate', (event) => {
      this.recordInteraction({
        type: 'browser_navigation',
        navigationType: 'popstate',
        fromPath: event.state?.fromPath || 'unknown',
        toPath: window.location.pathname,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        page: window.location.pathname
      });
    });
  }

  /**
   * Track scroll behavior
   */
  trackScrollBehavior() {
    let scrollTimeout;

    window.addEventListener('scroll', () => {
      if (Math.random() > INTERACTION_CONFIG.sampleRate) return;

      const now = Date.now();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentDepth = Math.round((scrollTop / scrollHeight) * 100);

      // Update max scroll depth
      if (currentDepth > this.scrollDepth) {
        this.scrollDepth = currentDepth;
      }

      // Debounce scroll events
      if (now - this.lastScrollTime > INTERACTION_CONFIG.scrollDebounce) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.recordInteraction({
            type: 'scroll',
            scrollDepth: currentDepth,
            maxScrollDepth: this.scrollDepth,
            scrollTop,
            scrollHeight,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            page: window.location.pathname
          });

          this.lastScrollTime = now;
        }, INTERACTION_CONFIG.scrollDebounce);
      }
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage() {
    // This method can be called manually to track specific feature usage
    // Example: trackFeatureUsage('chat_message_sent', { roomId: '123' });
  }

  /**
   * Record user interaction
   */
  recordInteraction(interaction) {
    const enrichedInteraction = {
      ...interaction,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      referrer: document.referrer || '',
      timestamp: interaction.timestamp,
      interactionId: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    this.interactions.push(enrichedInteraction);

    // Keep only recent interactions
    if (this.interactions.length > INTERACTION_CONFIG.maxInteractions) {
      this.interactions = this.interactions.slice(-INTERACTION_CONFIG.maxInteractions);
    }

    // Send to analytics in batches
    if (this.interactions.length % 10 === 0) {
      this.sendToAnalytics([enrichedInteraction]);
    }
  }

  /**
   * Track time spent on current page
   */
  trackTimeOnPage() {
    if (!this.pageStartTime) return;

    const timeSpent = Date.now() - this.pageStartTime;
    const minutes = Math.floor(timeSpent / 60000);
    const seconds = Math.floor((timeSpent % 60000) / 1000);

    this.recordInteraction({
      type: 'time_on_page',
      page: this.currentPage,
      timeSpent,
      timeSpentFormatted: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      timestamp: Date.now(),
      sessionId: this.sessionId
    });

    // Reset for next page
    this.pageStartTime = Date.now();
  }

  /**
   * Track custom feature usage
   */
  trackFeature(featureName, metadata = {}) {
    this.recordInteraction({
      type: 'feature_usage',
      feature: featureName,
      metadata,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: window.location.pathname
    });
  }

  /**
   * Send interactions to analytics service
   */
  sendToAnalytics(interactions) {
    // Placeholder for analytics service integration
    // Examples: Google Analytics, Mixpanel, PostHog, custom endpoint

    if (navigator.sendBeacon && interactions.length > 0) {
      const payload = {
        sessionId: this.sessionId,
        interactions,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      };

      try {
        navigator.sendBeacon('/api/analytics/interactions', JSON.stringify(payload));
      } catch (error) {
        console.warn('Failed to send interaction data:', error);
      }
    }
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats() {
    const recentInteractions = this.interactions.slice(-100); // Last 100 interactions

    const stats = {
      totalInteractions: this.interactions.length,
      recentInteractions: recentInteractions.length,
      sessionId: this.sessionId,
      byType: {},
      byPage: {},
      featuresUsed: [],
      averageTimeOnPage: 0
    };

    // Group by type and page
    recentInteractions.forEach(interaction => {
      // By type
      stats.byType[interaction.type] = (stats.byType[interaction.type] || 0) + 1;

      // By page
      stats.byPage[interaction.page] = (stats.byPage[interaction.page] || 0) + 1;

      // Collect feature usage
      if (interaction.type === 'feature_usage') {
        stats.featuresUsed.push(interaction.feature);
      }
    });

    // Calculate average time on page
    const timeOnPageInteractions = recentInteractions.filter(i => i.type === 'time_on_page');
    if (timeOnPageInteractions.length > 0) {
      const totalTime = timeOnPageInteractions.reduce((sum, i) => sum + i.timeSpent, 0);
      stats.averageTimeOnPage = Math.round(totalTime / timeOnPageInteractions.length / 1000); // seconds
    }

    return stats;
  }

  /**
   * Export interaction data for analysis
   */
  exportInteractionData() {
    return {
      sessionId: this.sessionId,
      exportTime: new Date().toISOString(),
      config: INTERACTION_CONFIG,
      stats: this.getInteractionStats(),
      recentInteractions: this.interactions.slice(-50), // Last 50 interactions
      userAgent: navigator.userAgent,
      currentPage: window.location.href
    };
  }
}

// Create singleton instance
export const userInteractionTracker = new UserInteractionTracker();

/**
 * React hook for user interaction tracking
 */
export const useInteractionTracker = () => {
  const trackFeature = React.useCallback((featureName, metadata = {}) => {
    userInteractionTracker.trackFeature(featureName, metadata);
  }, []);

  const recordInteraction = React.useCallback((interaction) => {
    userInteractionTracker.recordInteraction(interaction);
  }, []);

  return {
    trackFeature,
    recordInteraction,
    getStats: userInteractionTracker.getInteractionStats.bind(userInteractionTracker),
    exportData: userInteractionTracker.exportInteractionData.bind(userInteractionTracker)
  };
};

/**
 * Higher-order component for automatic feature usage tracking
 */
export const withFeatureTracking = (WrappedComponent, featureName) => {
  return function FeatureTrackedComponent(props) {
    React.useEffect(() => {
      // Track when component mounts (feature accessed)
      userInteractionTracker.trackFeature(`${featureName}_accessed`);

      // Track when component unmounts (feature exited)
      return () => {
        userInteractionTracker.trackFeature(`${featureName}_exited`);
      };
    }, [featureName]);

    return <WrappedComponent {...props} />;
  };
};

// React import for hooks (this will be handled by the importing component)
import React from 'react';

export default userInteractionTracker;