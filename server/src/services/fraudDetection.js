import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { Models } from '../models.js';

// Initialize storage
if (!Models.deviceFingerprints) Models.deviceFingerprints = new Map();
if (!Models.velocityRecords) Models.velocityRecords = new Map();
if (!Models.riskAssessments) Models.riskAssessments = new Map();
if (!Models.fraudAlerts) Models.fraudAlerts = new Map();
if (!Models.blockedEntities) Models.blockedEntities = new Map();

// Risk thresholds
const VELOCITY_LIMITS = {
  cash_advance: { count: 3, windowMs: 86400000, action: 'block' }, // 3 per day
  payout: { count: 10, windowMs: 3600000, action: 'review' }, // 10 per hour
  login: { count: 10, windowMs: 300000, action: 'challenge' }, // 10 per 5 min
  api_call: { count: 100, windowMs: 60000, action: 'throttle' }, // 100 per minute
  account_update: { count: 5, windowMs: 3600000, action: 'review' }, // 5 per hour
  plaid_link: { count: 3, windowMs: 86400000, action: 'block' }, // 3 per day
};

const RISK_WEIGHTS = {
  newDevice: 20,
  unusualLocation: 15,
  highValue: 10,
  velocityExceeded: 30,
  knownBadActor: 50,
  suspiciousPattern: 25,
  mismatchedData: 20,
  proxyDetected: 35,
  multipleAccounts: 40,
};

export const FraudDetectionService = {
  // Generate device fingerprint
  generateFingerprint: ({ userAgent, ip, screenResolution, timezone, language, hardwareConcurrency, deviceMemory }) => {
    const components = [
      userAgent || '',
      screenResolution || '',
      timezone || '',
      language || '',
      String(hardwareConcurrency || ''),
      String(deviceMemory || ''),
    ];
    
    return crypto.createHash('sha256')
      .update(components.join('|'))
      .digest('hex')
      .substring(0, 32);
  },

  // Register or update device fingerprint
  registerDevice: ({ userId, fingerprint, metadata }) => {
    const existing = Models.deviceFingerprints.get(fingerprint);
    
    if (existing) {
      // Update last seen
      existing.lastSeen = new Date().toISOString();
      existing.seenCount = (existing.seenCount || 0) + 1;
      if (!existing.userIds.includes(userId)) {
        existing.userIds.push(userId);
      }
      return { device: existing, isNew: false, multiUser: existing.userIds.length > 1 };
    }

    const device = {
      fingerprint,
      userIds: [userId],
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      seenCount: 1,
      metadata: metadata || {},
      isTrusted: false,
      riskScore: 0,
    };

    Models.deviceFingerprints.set(fingerprint, device);
    return { device, isNew: true, multiUser: false };
  },

  // Check velocity limits
  checkVelocity: ({ userId, actionType, metadata }) => {
    const limits = VELOCITY_LIMITS[actionType];
    if (!limits) {
      return { allowed: true, reason: 'no_limits_defined' };
    }

    const key = `${userId}:${actionType}`;
    const now = Date.now();
    const records = Models.velocityRecords.get(key) || [];

    // Remove expired records
    const validRecords = records.filter(r => now - r.timestamp < limits.windowMs);
    
    // Add current action
    validRecords.push({ timestamp: now, metadata });
    Models.velocityRecords.set(key, validRecords);

    if (validRecords.length > limits.count) {
      Models.metrics.increment(`fraud.velocity_exceeded.${actionType}`);
      
      // Create alert
      FraudDetectionService.createAlert({
        userId,
        type: 'velocity_exceeded',
        severity: limits.action === 'block' ? 'high' : 'medium',
        details: {
          actionType,
          count: validRecords.length,
          limit: limits.count,
          windowMs: limits.windowMs,
        },
      });

      return {
        allowed: limits.action !== 'block',
        action: limits.action,
        reason: 'velocity_limit_exceeded',
        currentCount: validRecords.length,
        limit: limits.count,
        windowMs: limits.windowMs,
        retryAfter: limits.windowMs - (now - validRecords[0].timestamp),
      };
    }

    return {
      allowed: true,
      currentCount: validRecords.length,
      limit: limits.count,
      remaining: limits.count - validRecords.length,
    };
  },

  // Assess risk for an action
  assessRisk: ({ userId, actionType, amount, deviceFingerprint, ip, metadata }) => {
    let riskScore = 0;
    const riskFactors = [];

    // Check device
    const device = Models.deviceFingerprints.get(deviceFingerprint);
    if (!device) {
      riskScore += RISK_WEIGHTS.newDevice;
      riskFactors.push({ factor: 'new_device', weight: RISK_WEIGHTS.newDevice });
    } else if (device.userIds.length > 1) {
      riskScore += RISK_WEIGHTS.multipleAccounts;
      riskFactors.push({ factor: 'shared_device', weight: RISK_WEIGHTS.multipleAccounts });
    }

    // Check velocity
    const velocityCheck = FraudDetectionService.checkVelocity({ userId, actionType, metadata });
    if (!velocityCheck.allowed || velocityCheck.action) {
      riskScore += RISK_WEIGHTS.velocityExceeded;
      riskFactors.push({ factor: 'velocity_exceeded', weight: RISK_WEIGHTS.velocityExceeded });
    }

    // Check amount thresholds for financial actions
    if (amount && amount > 100) {
      riskScore += RISK_WEIGHTS.highValue;
      riskFactors.push({ factor: 'high_value', weight: RISK_WEIGHTS.highValue });
    }

    // Check blocklist
    if (FraudDetectionService.isBlocked({ userId, deviceFingerprint, ip })) {
      riskScore += RISK_WEIGHTS.knownBadActor;
      riskFactors.push({ factor: 'blocked_entity', weight: RISK_WEIGHTS.knownBadActor });
    }

    // Determine risk level
    let riskLevel = 'low';
    let recommendation = 'allow';
    if (riskScore >= 70) {
      riskLevel = 'critical';
      recommendation = 'block';
    } else if (riskScore >= 50) {
      riskLevel = 'high';
      recommendation = 'review';
    } else if (riskScore >= 30) {
      riskLevel = 'medium';
      recommendation = 'challenge';
    }

    const assessment = {
      id: uuid(),
      userId,
      actionType,
      riskScore,
      riskLevel,
      recommendation,
      riskFactors,
      velocity: velocityCheck,
      amount,
      deviceFingerprint,
      ip,
      assessedAt: new Date().toISOString(),
    };

    Models.riskAssessments.set(assessment.id, assessment);
    Models.metrics.increment(`fraud.risk_assessed.${riskLevel}`);

    return assessment;
  },

  // Create fraud alert
  createAlert: ({ userId, type, severity, details }) => {
    const alert = {
      id: uuid(),
      userId,
      type,
      severity, // low, medium, high, critical
      details,
      status: 'open',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedBy: null,
      resolution: null,
    };

    Models.fraudAlerts.set(alert.id, alert);
    Models.auditLog.push({ type: 'fraud_alert_created', alert: { id: alert.id, type, severity } });
    Models.metrics.increment(`fraud.alerts.${severity}`);

    return alert;
  },

  // Get fraud alerts
  getAlerts: ({ status, severity, userId, limit = 50 }) => {
    let alerts = Array.from(Models.fraudAlerts.values());
    
    if (status) alerts = alerts.filter(a => a.status === status);
    if (severity) alerts = alerts.filter(a => a.severity === severity);
    if (userId) alerts = alerts.filter(a => a.userId === userId);
    
    alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      alerts: alerts.slice(0, limit),
      total: alerts.length,
      openCount: alerts.filter(a => a.status === 'open').length,
    };
  },

  // Resolve alert
  resolveAlert: ({ alertId, resolvedBy, resolution }) => {
    const alert = Models.fraudAlerts.get(alertId);
    if (!alert) throw new Error('alert_not_found');
    
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toISOString();
    alert.resolvedBy = resolvedBy;
    alert.resolution = resolution;
    
    Models.auditLog.push({ type: 'fraud_alert_resolved', alertId, resolution });
    return alert;
  },

  // Block entity (user, device, or IP)
  blockEntity: ({ entityType, entityValue, reason, expiresAt, blockedBy }) => {
    const key = `${entityType}:${entityValue}`;
    const block = {
      entityType,
      entityValue,
      reason,
      blockedAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      blockedBy,
      isActive: true,
    };

    Models.blockedEntities.set(key, block);
    Models.auditLog.push({ type: 'entity_blocked', entityType, reason });
    Models.metrics.increment(`fraud.blocks.${entityType}`);

    return block;
  },

  // Unblock entity
  unblockEntity: ({ entityType, entityValue, unblockedBy, reason }) => {
    const key = `${entityType}:${entityValue}`;
    const block = Models.blockedEntities.get(key);
    if (!block) throw new Error('block_not_found');

    block.isActive = false;
    block.unblockedAt = new Date().toISOString();
    block.unblockedBy = unblockedBy;
    block.unblockReason = reason;

    Models.auditLog.push({ type: 'entity_unblocked', entityType, reason });
    return { unblocked: true };
  },

  // Check if entity is blocked
  isBlocked: ({ userId, deviceFingerprint, ip }) => {
    const now = new Date();
    
    const checks = [
      { type: 'user', value: userId },
      { type: 'device', value: deviceFingerprint },
      { type: 'ip', value: ip },
    ];

    for (const check of checks) {
      if (!check.value) continue;
      const key = `${check.type}:${check.value}`;
      const block = Models.blockedEntities.get(key);
      
      if (block && block.isActive) {
        if (block.expiresAt && new Date(block.expiresAt) < now) {
          block.isActive = false;
          continue;
        }
        return true;
      }
    }

    return false;
  },

  // Detect suspicious patterns
  detectPatterns: ({ userId, events }) => {
    const patterns = [];

    // Rapid successive actions
    const timestamps = events.map(e => new Date(e.timestamp).getTime()).sort();
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avgInterval < 1000) { // Less than 1 second average
      patterns.push({ type: 'rapid_actions', avgIntervalMs: avgInterval });
    }

    // Amount patterns (round numbers)
    const amounts = events.filter(e => e.amount).map(e => e.amount);
    const roundAmounts = amounts.filter(a => a % 100 === 0 || a % 50 === 0);
    if (roundAmounts.length > amounts.length * 0.8) {
      patterns.push({ type: 'round_amounts', percentage: roundAmounts.length / amounts.length });
    }

    // Same destination pattern
    const destinations = events
      .filter(e => e.destination)
      .map(e => e.destination);
    const destCounts = {};
    for (const dest of destinations) {
      destCounts[dest] = (destCounts[dest] || 0) + 1;
    }
    const maxDestCount = Math.max(...Object.values(destCounts), 0);
    if (maxDestCount > destinations.length * 0.7) {
      patterns.push({ type: 'repeated_destination', count: maxDestCount });
    }

    return {
      userId,
      patternsDetected: patterns.length > 0,
      patterns,
      eventsAnalyzed: events.length,
      analyzedAt: new Date().toISOString(),
    };
  },

  // Get user risk profile
  getUserRiskProfile: ({ userId }) => {
    const assessments = Array.from(Models.riskAssessments.values())
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.assessedAt) - new Date(a.assessedAt));

    const alerts = Array.from(Models.fraudAlerts.values())
      .filter(a => a.userId === userId);

    const recentAssessments = assessments.slice(0, 30);
    const avgRiskScore = recentAssessments.length > 0
      ? recentAssessments.reduce((sum, a) => sum + a.riskScore, 0) / recentAssessments.length
      : 0;

    return {
      userId,
      overallRiskScore: Math.round(avgRiskScore),
      recentAssessments: recentAssessments.slice(0, 10),
      alertHistory: {
        total: alerts.length,
        open: alerts.filter(a => a.status === 'open').length,
        highSeverity: alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
      },
      isBlocked: FraudDetectionService.isBlocked({ userId }),
      lastAssessment: recentAssessments[0] || null,
    };
  },
};
