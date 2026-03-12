import { v4 as uuid } from 'uuid';
import crypto from 'crypto';
import { Models } from '../models.js';

// Initialize storage
if (!Models.automations) Models.automations = new Map();
if (!Models.automationLogs) Models.automationLogs = new Map();
if (!Models.webhookEndpoints) Models.webhookEndpoints = new Map();
if (!Models.triggerQueue) Models.triggerQueue = [];

// Supported triggers
const TRIGGER_TYPES = {
  'earnings.received': {
    name: 'Earnings Received',
    description: 'Triggered when new earnings are recorded',
    payload: ['amount', 'platform', 'timestamp', 'type'],
  },
  'expense.created': {
    name: 'Expense Created',
    description: 'Triggered when an expense is logged',
    payload: ['amount', 'category', 'description', 'timestamp'],
  },
  'advance.requested': {
    name: 'Advance Requested',
    description: 'Triggered when a cash advance is requested',
    payload: ['amount', 'status', 'timestamp'],
  },
  'goal.reached': {
    name: 'Goal Reached',
    description: 'Triggered when an earnings goal is achieved',
    payload: ['goalName', 'targetAmount', 'achievedAmount', 'timestamp'],
  },
  'surge.detected': {
    name: 'Surge Detected',
    description: 'Triggered when a surge pricing zone is detected',
    payload: ['location', 'multiplier', 'platform', 'timestamp'],
  },
  'shift.started': {
    name: 'Shift Started',
    description: 'Triggered when a work shift begins',
    payload: ['platform', 'startTime', 'location'],
  },
  'shift.ended': {
    name: 'Shift Ended',
    description: 'Triggered when a work shift ends',
    payload: ['platform', 'duration', 'earnings', 'expenses'],
  },
  'bucket.funded': {
    name: 'Bucket Funded',
    description: 'Triggered when auto-reserve allocates to a bucket',
    payload: ['bucketType', 'amount', 'newBalance', 'timestamp'],
  },
  'weekly.summary': {
    name: 'Weekly Summary',
    description: 'Triggered every week with summary data',
    payload: ['totalEarnings', 'totalExpenses', 'hoursWorked', 'platforms'],
  },
};

// Supported actions
const ACTION_TYPES = {
  'webhook': {
    name: 'Send Webhook',
    description: 'Send data to an external URL',
    config: ['url', 'method', 'headers'],
  },
  'email': {
    name: 'Send Email',
    description: 'Send an email notification',
    config: ['to', 'subject', 'template'],
  },
  'sms': {
    name: 'Send SMS',
    description: 'Send an SMS notification',
    config: ['phoneNumber', 'template'],
  },
  'push': {
    name: 'Push Notification',
    description: 'Send a push notification',
    config: ['title', 'body', 'data'],
  },
  'auto_reserve': {
    name: 'Auto Reserve',
    description: 'Automatically reserve funds to a bucket',
    config: ['bucketType', 'percentage', 'maxAmount'],
  },
  'expense_log': {
    name: 'Log Expense',
    description: 'Automatically log an expense',
    config: ['category', 'description', 'calculateMileage'],
  },
  'sync_spreadsheet': {
    name: 'Sync to Spreadsheet',
    description: 'Add row to Google Sheets or Airtable',
    config: ['provider', 'spreadsheetId', 'sheetName', 'columns'],
  },
  'zapier_trigger': {
    name: 'Zapier Trigger',
    description: 'Trigger a Zapier webhook',
    config: ['zapierWebhookUrl'],
  },
  'make_trigger': {
    name: 'Make (Integromat) Trigger',
    description: 'Trigger a Make scenario',
    config: ['makeWebhookUrl'],
  },
};

export const AutomationService = {
  // Create automation
  createAutomation: ({
    userId,
    name,
    triggerType,
    conditions,
    actions,
    isEnabled = true,
  }) => {
    if (!TRIGGER_TYPES[triggerType]) {
      throw new Error('invalid_trigger_type');
    }

    for (const action of actions) {
      if (!ACTION_TYPES[action.type]) {
        throw new Error(`invalid_action_type: ${action.type}`);
      }
    }

    const automation = {
      id: uuid(),
      userId,
      name,
      triggerType,
      conditions: conditions || [],
      actions,
      isEnabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggered: null,
      triggerCount: 0,
    };

    Models.automations.set(automation.id, automation);
    Models.auditLog.push({ type: 'automation_created', userId, automationId: automation.id });

    return automation;
  },

  // Update automation
  updateAutomation: ({ automationId, userId, updates }) => {
    const automation = Models.automations.get(automationId);
    if (!automation || automation.userId !== userId) {
      throw new Error('automation_not_found');
    }

    const allowed = ['name', 'conditions', 'actions', 'isEnabled'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        automation[key] = updates[key];
      }
    }
    automation.updatedAt = new Date().toISOString();

    return automation;
  },

  // Delete automation
  deleteAutomation: ({ automationId, userId }) => {
    const automation = Models.automations.get(automationId);
    if (!automation || automation.userId !== userId) {
      throw new Error('automation_not_found');
    }

    Models.automations.delete(automationId);
    Models.auditLog.push({ type: 'automation_deleted', userId, automationId });

    return { deleted: true };
  },

  // Get user's automations
  getAutomations: ({ userId }) => {
    const automations = [];
    for (const automation of Models.automations.values()) {
      if (automation.userId === userId) {
        automations.push(automation);
      }
    }
    return {
      automations: automations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      total: automations.length,
    };
  },

  // Fire trigger
  fireTrigger: async ({ triggerType, userId, payload }) => {
    const triggered = [];

    for (const automation of Models.automations.values()) {
      if (!automation.isEnabled) continue;
      if (automation.userId !== userId) continue;
      if (automation.triggerType !== triggerType) continue;

      // Check conditions
      if (!AutomationService.evaluateConditions(automation.conditions, payload)) {
        continue;
      }

      // Execute actions
      for (const action of automation.actions) {
        try {
          await AutomationService.executeAction(action, payload, automation);
        } catch (error) {
          AutomationService.logExecution({
            automationId: automation.id,
            status: 'error',
            action: action.type,
            error: error.message,
          });
        }
      }

      // Update stats
      automation.lastTriggered = new Date().toISOString();
      automation.triggerCount++;
      triggered.push(automation.id);
    }

    Models.metrics.increment(`automation.triggers.${triggerType}`);
    return { triggeredCount: triggered.length, automationIds: triggered };
  },

  // Evaluate conditions
  evaluateConditions: (conditions, payload) => {
    if (!conditions || conditions.length === 0) return true;

    for (const condition of conditions) {
      const value = payload[condition.field];
      const target = condition.value;

      switch (condition.operator) {
        case 'equals':
          if (value !== target) return false;
          break;
        case 'not_equals':
          if (value === target) return false;
          break;
        case 'greater_than':
          if (!(value > target)) return false;
          break;
        case 'less_than':
          if (!(value < target)) return false;
          break;
        case 'contains':
          if (!String(value).includes(target)) return false;
          break;
        case 'starts_with':
          if (!String(value).startsWith(target)) return false;
          break;
        default:
          break;
      }
    }

    return true;
  },

  // Execute action
  executeAction: async (action, payload, automation) => {
    const startTime = Date.now();

    switch (action.type) {
      case 'webhook':
      case 'zapier_trigger':
      case 'make_trigger':
        // In production, this would make actual HTTP requests
        const url = action.config.url || action.config.zapierWebhookUrl || action.config.makeWebhookUrl;
        console.log(`[Automation] Would POST to: ${url}`);
        // Simulated webhook delivery
        AutomationService.logExecution({
          automationId: automation.id,
          status: 'success',
          action: action.type,
          url,
          payload,
          duration: Date.now() - startTime,
        });
        break;

      case 'email':
        console.log(`[Automation] Would send email to: ${action.config.to}`);
        AutomationService.logExecution({
          automationId: automation.id,
          status: 'success',
          action: action.type,
          to: action.config.to,
          duration: Date.now() - startTime,
        });
        break;

      case 'sms':
        console.log(`[Automation] Would send SMS to: ${action.config.phoneNumber}`);
        AutomationService.logExecution({
          automationId: automation.id,
          status: 'success',
          action: action.type,
          duration: Date.now() - startTime,
        });
        break;

      case 'push':
        console.log(`[Automation] Would send push: ${action.config.title}`);
        AutomationService.logExecution({
          automationId: automation.id,
          status: 'success',
          action: action.type,
          duration: Date.now() - startTime,
        });
        break;

      case 'auto_reserve':
        const reserveAmount = payload.amount * (action.config.percentage / 100);
        console.log(`[Automation] Would reserve ${reserveAmount} to ${action.config.bucketType}`);
        AutomationService.logExecution({
          automationId: automation.id,
          status: 'success',
          action: action.type,
          amount: reserveAmount,
          bucket: action.config.bucketType,
          duration: Date.now() - startTime,
        });
        break;

      default:
        console.log(`[Automation] Unknown action: ${action.type}`);
    }
  },

  // Log execution
  logExecution: ({ automationId, status, action, ...details }) => {
    const log = {
      id: uuid(),
      automationId,
      status,
      action,
      details,
      timestamp: new Date().toISOString(),
    };

    const logs = Models.automationLogs.get(automationId) || [];
    logs.push(log);
    // Keep last 100 logs per automation
    if (logs.length > 100) logs.shift();
    Models.automationLogs.set(automationId, logs);

    Models.metrics.increment(`automation.actions.${status}`);
  },

  // Get execution logs
  getExecutionLogs: ({ automationId, userId, limit = 50 }) => {
    const automation = Models.automations.get(automationId);
    if (!automation || automation.userId !== userId) {
      throw new Error('automation_not_found');
    }

    const logs = Models.automationLogs.get(automationId) || [];
    return {
      logs: logs.slice(-limit).reverse(),
      total: logs.length,
    };
  },

  // Create webhook endpoint for incoming triggers
  createWebhookEndpoint: ({ userId, name, triggerType }) => {
    const token = crypto.randomBytes(24).toString('hex');
    const endpoint = {
      id: uuid(),
      userId,
      name,
      triggerType,
      token,
      url: `/api/v1/webhooks/incoming/${token}`,
      createdAt: new Date().toISOString(),
      lastReceived: null,
      requestCount: 0,
    };

    Models.webhookEndpoints.set(token, endpoint);
    return endpoint;
  },

  // Handle incoming webhook
  handleIncomingWebhook: async ({ token, payload }) => {
    const endpoint = Models.webhookEndpoints.get(token);
    if (!endpoint) {
      throw new Error('webhook_not_found');
    }

    endpoint.lastReceived = new Date().toISOString();
    endpoint.requestCount++;

    // Fire the associated trigger
    return AutomationService.fireTrigger({
      triggerType: endpoint.triggerType,
      userId: endpoint.userId,
      payload,
    });
  },

  // Get available triggers and actions
  getAvailableOptions: () => {
    return {
      triggers: Object.entries(TRIGGER_TYPES).map(([key, value]) => ({
        type: key,
        ...value,
      })),
      actions: Object.entries(ACTION_TYPES).map(([key, value]) => ({
        type: key,
        ...value,
      })),
      conditions: {
        operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'starts_with'],
      },
    };
  },

  // Automation templates
  getTemplates: () => {
    return [
      {
        id: 'auto_tax_reserve',
        name: 'Auto Tax Reserve',
        description: 'Automatically reserve 25% of earnings for taxes',
        triggerType: 'earnings.received',
        conditions: [],
        actions: [
          { type: 'auto_reserve', config: { bucketType: 'tax', percentage: 25 } },
        ],
      },
      {
        id: 'surge_alert_push',
        name: 'Surge Alert Push Notification',
        description: 'Get a push notification when surge pricing is detected',
        triggerType: 'surge.detected',
        conditions: [{ field: 'multiplier', operator: 'greater_than', value: 1.5 }],
        actions: [
          { type: 'push', config: { title: 'Surge Alert! 🚀', body: 'High demand detected nearby' } },
        ],
      },
      {
        id: 'earnings_to_sheets',
        name: 'Sync Earnings to Google Sheets',
        description: 'Add each earning to a Google Sheet',
        triggerType: 'earnings.received',
        conditions: [],
        actions: [
          { type: 'sync_spreadsheet', config: { provider: 'google', columns: ['date', 'amount', 'platform'] } },
        ],
      },
      {
        id: 'weekly_zapier',
        name: 'Weekly Summary to Zapier',
        description: 'Send weekly summary to Zapier for further automation',
        triggerType: 'weekly.summary',
        conditions: [],
        actions: [
          { type: 'zapier_trigger', config: { zapierWebhookUrl: '' } },
        ],
      },
    ];
  },

  // Create automation from template
  createFromTemplate: ({ userId, templateId, customConfig }) => {
    const templates = AutomationService.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error('template_not_found');
    }

    // Merge custom config
    const actions = template.actions.map(action => ({
      ...action,
      config: { ...action.config, ...(customConfig?.actions?.[action.type] || {}) },
    }));

    return AutomationService.createAutomation({
      userId,
      name: customConfig?.name || template.name,
      triggerType: template.triggerType,
      conditions: customConfig?.conditions || template.conditions,
      actions,
    });
  },
};
