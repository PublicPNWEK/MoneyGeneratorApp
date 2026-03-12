/**
 * Feature Flags Service for V2
 * Manages feature availability, experiments, and controlled rollouts
 */

class FeatureFlagsService {
  constructor() {
    this.flags = {
      // Core features
      ONBOARDING_V2: {
        enabled: true,
        description: 'New v2 onboarding flow',
        rolloutPercent: 100,
      },
      JOB_MARKETPLACE: {
        enabled: true,
        description: 'Job marketplace with filtering and alerts',
        rolloutPercent: 100,
      },
      ADVANCED_ANALYTICS: {
        enabled: true,
        description: 'Advanced analytics dashboard',
        rolloutPercent: 80,
      },
      EXPORT_DATA: {
        enabled: true,
        description: 'Export financials and reports',
        rolloutPercent: 100,
      },
      SAVED_JOBS: {
        enabled: true,
        description: 'Save and alert for jobs',
        rolloutPercent: 100,
      },
      TEAM_FEATURES: {
        enabled: false,
        description: 'Team accounts and shared features',
        rolloutPercent: 0,
      },
      VOICE_INTERFACE: {
        enabled: false,
        description: 'Voice commands and Siri integration',
        rolloutPercent: 0,
      },
      PWA_MODE: {
        enabled: true,
        description: 'Progressive Web App features',
        rolloutPercent: 100,
      },
      DARK_MODE: {
        enabled: true,
        description: 'Dark mode interface',
        rolloutPercent: 100,
      },
      AI_RECOMMENDATIONS: {
        enabled: true,
        description: 'AI-powered job and expense recommendations',
        rolloutPercent: 60,
      },
      GAMIFICATION: {
        enabled: false,
        description: 'Gamified financial education',
        rolloutPercent: 0,
      },
    };
  }

  /**
   * Get all feature flags
   */
  getAllFlags() {
    return Object.entries(this.flags).reduce((acc, [key, value]) => {
      acc[key] = {
        enabled: value.enabled,
        %: value.rolloutPercent,
        description: value.description,
      };
      return acc;
    }, {});
  }

  /**
   * Check if a feature is enabled for a user
   */
  isFeatureEnabled(featureKey, userId = null) {
    const flag = this.flags[featureKey];
    if (!flag) return false;

    if (!flag.enabled) return false;

    // If rollout percent is 100%, always enabled
    if (flag.rolloutPercent === 100) return true;

    // If userId provided, use consistent hashing for rollout
    if (userId) {
      const hash = this.hashUserId(userId);
      return (hash % 100) < flag.rolloutPercent;
    }

    return false;
  }

  /**
   * Hash user ID for consistent rollout distribution
   */
  hashUserId(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get user-specific features
   */
  getUserFeatures(userId) {
    const features = {};
    Object.keys(this.flags).forEach((featureKey) => {
      features[featureKey] = this.isFeatureEnabled(featureKey, userId);
    });
    return features;
  }

  /**
   * Update feature flag (admin only)
   */
  updateFlag(featureKey, enabled, rolloutPercent = 100) {
    if (!this.flags[featureKey]) {
      throw new Error(`Feature flag '${featureKey}' does not exist`);
    }
    this.flags[featureKey].enabled = enabled;
    this.flags[featureKey].rolloutPercent = rolloutPercent;
    return this.flags[featureKey];
  }
}

export const featureFlagsService = new FeatureFlagsService();
