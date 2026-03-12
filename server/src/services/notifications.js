import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.notifications) Models.notifications = new Map();
if (!Models.notificationPreferences) Models.notificationPreferences = new Map();
if (!Models.pushSubscriptions) Models.pushSubscriptions = new Map();

// Notification types
export const NotificationTypes = {
  SURGE_ALERT: 'surge_alert',
  EARNINGS_UPDATE: 'earnings_update',
  SHIFT_REMINDER: 'shift_reminder',
  CASH_ADVANCE_ELIGIBLE: 'cash_advance_eligible',
  PAYMENT_RECEIVED: 'payment_received',
  TAX_REMINDER: 'tax_reminder',
  NEW_JOB_MATCH: 'new_job_match',
  GOAL_PROGRESS: 'goal_progress',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
};

// Default notification preferences
const DEFAULT_PREFERENCES = {
  [NotificationTypes.SURGE_ALERT]: { push: true, email: true, sms: false },
  [NotificationTypes.EARNINGS_UPDATE]: { push: true, email: false, sms: false },
  [NotificationTypes.SHIFT_REMINDER]: { push: true, email: true, sms: true },
  [NotificationTypes.CASH_ADVANCE_ELIGIBLE]: { push: true, email: true, sms: false },
  [NotificationTypes.PAYMENT_RECEIVED]: { push: true, email: true, sms: false },
  [NotificationTypes.TAX_REMINDER]: { push: true, email: true, sms: false },
  [NotificationTypes.NEW_JOB_MATCH]: { push: true, email: false, sms: false },
  [NotificationTypes.GOAL_PROGRESS]: { push: true, email: false, sms: false },
  [NotificationTypes.PROMOTION]: { push: true, email: true, sms: false },
  [NotificationTypes.SYSTEM]: { push: true, email: true, sms: false },
};

export const NotificationService = {
  // Create a notification
  create: ({ userId, type, title, body, data, priority = 'normal', expiresAt }) => {
    const notification = {
      id: uuid(),
      userId,
      type,
      title,
      body,
      data: data || {},
      priority,
      read: false,
      dismissed: false,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
    };

    Models.notifications.set(notification.id, notification);
    Models.metrics.increment(`notifications.created.${type}`);

    // Queue for delivery (in production, would trigger push/email/sms)
    NotificationService.queueDelivery(notification);

    return notification;
  },

  // Queue notification for delivery
  queueDelivery: (notification) => {
    const prefs = NotificationService.getPreferences({ userId: notification.userId });
    const typePrefs = prefs[notification.type] || DEFAULT_PREFERENCES[notification.type];

    if (typePrefs?.push) {
      // In production: send push notification
      Models.metrics.increment('notifications.push_queued');
    }
    if (typePrefs?.email) {
      // In production: queue email
      Models.metrics.increment('notifications.email_queued');
    }
    if (typePrefs?.sms) {
      // In production: queue SMS
      Models.metrics.increment('notifications.sms_queued');
    }
  },

  // Get user notifications
  getNotifications: ({ userId, unreadOnly = false, limit = 50, offset = 0 }) => {
    let notifications = Array.from(Models.notifications.values())
      .filter(n => n.userId === userId && !n.dismissed);

    // Filter expired
    const now = new Date().toISOString();
    notifications = notifications.filter(n => !n.expiresAt || n.expiresAt > now);

    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const unreadCount = notifications.filter(n => !n.read).length;

    return {
      notifications: notifications.slice(offset, offset + limit),
      total: notifications.length,
      unreadCount,
      hasMore: notifications.length > offset + limit,
    };
  },

  // Mark notification as read
  markAsRead: ({ notificationId, userId }) => {
    const notification = Models.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('notification_not_found');
    }
    notification.read = true;
    notification.readAt = new Date().toISOString();
    return notification;
  },

  // Mark all as read
  markAllAsRead: ({ userId }) => {
    const notifications = Array.from(Models.notifications.values())
      .filter(n => n.userId === userId && !n.read);

    const now = new Date().toISOString();
    for (const n of notifications) {
      n.read = true;
      n.readAt = now;
    }

    return { markedAsRead: notifications.length };
  },

  // Dismiss notification
  dismiss: ({ notificationId, userId }) => {
    const notification = Models.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw new Error('notification_not_found');
    }
    notification.dismissed = true;
    notification.dismissedAt = new Date().toISOString();
    return { dismissed: true };
  },

  // Get notification preferences
  getPreferences: ({ userId }) => {
    return Models.notificationPreferences.get(userId) || { ...DEFAULT_PREFERENCES };
  },

  // Update notification preferences
  updatePreferences: ({ userId, preferences }) => {
    const current = NotificationService.getPreferences({ userId });
    const updated = { ...current };

    for (const [type, channels] of Object.entries(preferences)) {
      if (NotificationTypes[type.toUpperCase()] || Object.values(NotificationTypes).includes(type)) {
        updated[type] = { ...updated[type], ...channels };
      }
    }

    Models.notificationPreferences.set(userId, updated);
    return updated;
  },

  // Register push subscription
  registerPushSubscription: ({ userId, subscription, platform }) => {
    const sub = {
      id: uuid(),
      userId,
      subscription,
      platform,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    Models.pushSubscriptions.set(sub.id, sub);
    return { registered: true, subscriptionId: sub.id };
  },

  // Send surge alert
  sendSurgeAlert: ({ userId, platform, multiplier, area, expiresAt }) => {
    return NotificationService.create({
      userId,
      type: NotificationTypes.SURGE_ALERT,
      title: `🔥 ${multiplier}x Surge in ${area}`,
      body: `${platform} is surging at ${multiplier}x in ${area}. Tap to see opportunities.`,
      data: { platform, multiplier, area },
      priority: 'high',
      expiresAt,
    });
  },

  // Send earnings update
  sendEarningsUpdate: ({ userId, amount, period, platform }) => {
    return NotificationService.create({
      userId,
      type: NotificationTypes.EARNINGS_UPDATE,
      title: `💰 You earned $${amount.toFixed(2)}`,
      body: `Your ${period} earnings${platform ? ` from ${platform}` : ''} have been updated.`,
      data: { amount, period, platform },
    });
  },

  // Send tax reminder
  sendTaxReminder: ({ userId, quarterlyAmount, dueDate }) => {
    return NotificationService.create({
      userId,
      type: NotificationTypes.TAX_REMINDER,
      title: '📅 Quarterly Tax Payment Due',
      body: `Your estimated payment of $${quarterlyAmount.toFixed(2)} is due ${dueDate}.`,
      data: { quarterlyAmount, dueDate },
      priority: 'high',
    });
  },

  // Get notification types with descriptions
  getNotificationTypes: () => Object.entries(NotificationTypes).map(([key, value]) => ({
    id: value,
    name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
  })),
};
