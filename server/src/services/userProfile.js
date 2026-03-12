import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.userProfiles) Models.userProfiles = new Map();
if (!Models.userGoals) Models.userGoals = new Map();
if (!Models.userSettings) Models.userSettings = new Map();

// Work modes
export const WorkModes = {
  DELIVERY: 'delivery',
  RIDESHARE: 'rideshare',
  FREELANCE: 'freelance',
  TASKRABBIT: 'taskrabbit',
  MULTI_APP: 'multi_app',
};

// Goal types
export const GoalTypes = {
  DAILY_EARNINGS: 'daily_earnings',
  WEEKLY_EARNINGS: 'weekly_earnings',
  MONTHLY_EARNINGS: 'monthly_earnings',
  SAVINGS_TARGET: 'savings_target',
  HOURS_WORKED: 'hours_worked',
};

export const UserProfileService = {
  // Create or update user profile
  upsertProfile: ({ userId, data }) => {
    const existing = Models.userProfiles.get(userId);
    
    const profile = {
      userId,
      displayName: data.displayName || existing?.displayName || null,
      email: data.email || existing?.email || null,
      phone: data.phone || existing?.phone || null,
      avatarUrl: data.avatarUrl || existing?.avatarUrl || null,
      timezone: data.timezone || existing?.timezone || 'America/New_York',
      currency: data.currency || existing?.currency || 'USD',
      workMode: data.workMode || existing?.workMode || WorkModes.MULTI_APP,
      workAreas: data.workAreas || existing?.workAreas || [],
      vehicleInfo: data.vehicleInfo || existing?.vehicleInfo || null,
      bio: data.bio || existing?.bio || null,
      skills: data.skills || existing?.skills || [],
      portfolioUrl: data.portfolioUrl || existing?.portfolioUrl || null,
      onboardingCompleted: data.onboardingCompleted ?? existing?.onboardingCompleted ?? false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Models.userProfiles.set(userId, profile);
    Models.auditLog.push({ type: 'profile_updated', userId });
    
    return profile;
  },

  // Get user profile
  getProfile: ({ userId }) => {
    return Models.userProfiles.get(userId) || null;
  },

  // Set work mode
  setWorkMode: ({ userId, workMode }) => {
    if (!Object.values(WorkModes).includes(workMode)) {
      throw new Error('invalid_work_mode');
    }
    const profile = Models.userProfiles.get(userId) || { userId };
    profile.workMode = workMode;
    profile.updatedAt = new Date().toISOString();
    Models.userProfiles.set(userId, profile);
    return profile;
  },

  // Create a goal
  createGoal: ({ userId, type, target, period, startDate, endDate }) => {
    if (!Object.values(GoalTypes).includes(type)) {
      throw new Error('invalid_goal_type');
    }

    const goal = {
      id: uuid(),
      userId,
      type,
      target,
      current: 0,
      period: period || null,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    Models.userGoals.set(goal.id, goal);
    Models.metrics.increment('goals.created');
    return goal;
  },

  // Update goal progress
  updateGoalProgress: ({ goalId, userId, progress }) => {
    const goal = Models.userGoals.get(goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error('goal_not_found');
    }

    goal.current = progress;
    goal.updatedAt = new Date().toISOString();

    if (goal.current >= goal.target) {
      goal.status = 'completed';
      goal.completedAt = new Date().toISOString();
      Models.metrics.increment('goals.completed');
    }

    return goal;
  },

  // Get user goals
  getGoals: ({ userId, status }) => {
    let goals = Array.from(Models.userGoals.values())
      .filter(g => g.userId === userId);

    if (status) {
      goals = goals.filter(g => g.status === status);
    }

    // Calculate progress percentages
    return goals.map(g => ({
      ...g,
      progressPercent: Math.min(100, Math.round((g.current / g.target) * 100)),
    }));
  },

  // Delete goal
  deleteGoal: ({ goalId, userId }) => {
    const goal = Models.userGoals.get(goalId);
    if (!goal || goal.userId !== userId) {
      throw new Error('goal_not_found');
    }
    Models.userGoals.delete(goalId);
    return { deleted: true };
  },

  // Get/update user settings
  getSettings: ({ userId }) => {
    return Models.userSettings.get(userId) || {
      userId,
      theme: 'system',
      language: 'en',
      distanceUnit: 'miles',
      currencyDisplay: 'symbol',
      compactNumbers: false,
      showCents: true,
      autoStartShift: false,
      surgeAlerts: true,
      earningsGoalNotifications: true,
      weekStartsOn: 'sunday',
      defaultPlatform: null,
      jobPreferences: {
        status: {},
        alertsEnabled: true,
      },
    };
  },

  updateSettings: ({ userId, settings }) => {
    const current = UserProfileService.getSettings({ userId });
    const updated = { ...current, ...settings, userId, updatedAt: new Date().toISOString() };
    Models.userSettings.set(userId, updated);
    return updated;
  },

  // Get dashboard data
  getDashboard: ({ userId }) => {
    const profile = UserProfileService.getProfile({ userId }) || {};
    const goals = UserProfileService.getGoals({ userId, status: 'active' });
    const settings = UserProfileService.getSettings({ userId });

    // Get connected platforms
    const connectedPlatforms = Array.from(Models.gigConnections?.values() || [])
      .filter(c => c.userId === userId && c.status === 'connected')
      .map(c => c.platform);

    // Get today's earnings
    const today = new Date().toISOString().split('T')[0];
    const todayEarnings = Array.from(Models.gigEarnings?.values() || [])
      .filter(e => e.userId === userId && e.recordedAt.startsWith(today))
      .reduce((sum, e) => sum + e.amount, 0);

    // Get active shifts
    const activeShifts = Array.from(Models.gigShifts?.values() || [])
      .filter(s => s.userId === userId && !s.endTime)
      .length;

    // Get pending advance
    const pendingAdvances = Array.from(Models.cashAdvances?.values() || [])
      .filter(a => a.userId === userId && a.status === 'pending')
      .reduce((sum, a) => sum + a.amount, 0);

    // Get unread notifications count
    const unreadNotifications = Array.from(Models.notifications?.values() || [])
      .filter(n => n.userId === userId && !n.read && !n.dismissed)
      .length;

    return {
      profile: {
        displayName: profile.displayName,
        workMode: profile.workMode,
        avatarUrl: profile.avatarUrl,
      },
      stats: {
        todayEarnings,
        connectedPlatforms: connectedPlatforms.length,
        activeGoals: goals.length,
        activeShifts,
        pendingAdvances,
        unreadNotifications,
      },
      goals: goals.slice(0, 3),
      connectedPlatforms,
      settings: {
        theme: settings.theme,
        surgeAlerts: settings.surgeAlerts,
      },
    };
  },

  // Get work modes
  getWorkModes: () => Object.entries(WorkModes).map(([key, value]) => ({
    id: value,
    name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    description: getWorkModeDescription(value),
  })),

  // Get goal types
  getGoalTypes: () => Object.entries(GoalTypes).map(([key, value]) => ({
    id: value,
    name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
  })),
};

function getWorkModeDescription(mode) {
  const descriptions = {
    [WorkModes.DELIVERY]: 'Optimized for food delivery and courier work',
    [WorkModes.RIDESHARE]: 'Features for Uber, Lyft, and rideshare drivers',
    [WorkModes.FREELANCE]: 'Tools for digital freelancers and remote workers',
    [WorkModes.TASKRABBIT]: 'Task-based and local service work',
    [WorkModes.MULTI_APP]: 'Juggling multiple platforms and gig types',
  };
  return descriptions[mode] || '';
}
