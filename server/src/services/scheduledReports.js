import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.scheduledReports) Models.scheduledReports = new Map();

// Report frequencies
export const ReportFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
};

// Report types
export const ReportType = {
  EARNINGS_SUMMARY: 'earnings_summary',
  EXPENSE_BREAKDOWN: 'expense_breakdown',
  TAX_ESTIMATE: 'tax_estimate',
  PLATFORM_COMPARISON: 'platform_comparison',
  FULL_FINANCIAL: 'full_financial',
};

export const ScheduledReportService = {
  // Create a scheduled report
  create: ({ userId, name, reportType, frequency, format, recipients, timezone = 'America/New_York' }) => {
    const report = {
      id: uuid(),
      userId,
      name,
      reportType,
      frequency,
      format: format || 'pdf',
      recipients: recipients || [], // email addresses
      timezone,
      isActive: true,
      lastRun: null,
      nextRun: ScheduledReportService.calculateNextRun(frequency, timezone),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    Models.scheduledReports.set(report.id, report);
    Models.metrics.increment('scheduled_reports.created');

    return report;
  },

  // Calculate next run time based on frequency
  calculateNextRun: (frequency, timezone) => {
    const now = new Date();
    let next = new Date(now);

    switch (frequency) {
      case ReportFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0); // 8 AM
        break;
      case ReportFrequency.WEEKLY:
        // Next Monday at 8 AM
        const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
        next.setDate(next.getDate() + daysUntilMonday);
        next.setHours(8, 0, 0, 0);
        break;
      case ReportFrequency.MONTHLY:
        // First of next month at 8 AM
        next.setMonth(next.getMonth() + 1, 1);
        next.setHours(8, 0, 0, 0);
        break;
      case ReportFrequency.QUARTERLY:
        // First of next quarter at 8 AM
        const currentQuarter = Math.floor(next.getMonth() / 3);
        const nextQuarterMonth = (currentQuarter + 1) * 3;
        if (nextQuarterMonth >= 12) {
          next.setFullYear(next.getFullYear() + 1);
          next.setMonth(nextQuarterMonth - 12, 1);
        } else {
          next.setMonth(nextQuarterMonth, 1);
        }
        next.setHours(8, 0, 0, 0);
        break;
      default:
        next.setDate(next.getDate() + 1);
        next.setHours(8, 0, 0, 0);
    }

    return next.toISOString();
  },

  // Get all scheduled reports for a user
  getByUser: ({ userId }) => {
    return Array.from(Models.scheduledReports.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Get a specific report
  getById: ({ reportId, userId }) => {
    const report = Models.scheduledReports.get(reportId);
    if (!report || report.userId !== userId) {
      return null;
    }
    return report;
  },

  // Update a scheduled report
  update: ({ reportId, userId, updates }) => {
    const report = Models.scheduledReports.get(reportId);
    if (!report || report.userId !== userId) {
      throw new Error('report_not_found');
    }

    const allowedUpdates = ['name', 'reportType', 'frequency', 'format', 'recipients', 'timezone', 'isActive'];
    for (const key of allowedUpdates) {
      if (updates[key] !== undefined) {
        report[key] = updates[key];
      }
    }

    // Recalculate next run if frequency changed
    if (updates.frequency) {
      report.nextRun = ScheduledReportService.calculateNextRun(updates.frequency, report.timezone);
    }

    report.updatedAt = new Date().toISOString();
    return report;
  },

  // Toggle active status
  toggleActive: ({ reportId, userId }) => {
    const report = Models.scheduledReports.get(reportId);
    if (!report || report.userId !== userId) {
      throw new Error('report_not_found');
    }

    report.isActive = !report.isActive;
    report.updatedAt = new Date().toISOString();

    if (report.isActive) {
      report.nextRun = ScheduledReportService.calculateNextRun(report.frequency, report.timezone);
    }

    return report;
  },

  // Delete a scheduled report
  delete: ({ reportId, userId }) => {
    const report = Models.scheduledReports.get(reportId);
    if (!report || report.userId !== userId) {
      throw new Error('report_not_found');
    }

    Models.scheduledReports.delete(reportId);
    Models.metrics.increment('scheduled_reports.deleted');

    return { deleted: true };
  },

  // Run a report (generate and send)
  runReport: async ({ reportId, userId }) => {
    const report = Models.scheduledReports.get(reportId);
    if (!report || report.userId !== userId) {
      throw new Error('report_not_found');
    }

    // In production, this would:
    // 1. Generate the report based on reportType
    // 2. Format it according to the format (pdf, csv, etc.)
    // 3. Send it to all recipients via email
    
    report.lastRun = new Date().toISOString();
    report.nextRun = ScheduledReportService.calculateNextRun(report.frequency, report.timezone);
    report.updatedAt = new Date().toISOString();

    Models.metrics.increment(`scheduled_reports.run.${report.reportType}`);

    return {
      success: true,
      reportId: report.id,
      runAt: report.lastRun,
      nextRun: report.nextRun,
    };
  },

  // Get report types with descriptions
  getReportTypes: () => [
    { id: ReportType.EARNINGS_SUMMARY, name: 'Earnings Summary', description: 'Overview of all earnings by platform and date' },
    { id: ReportType.EXPENSE_BREAKDOWN, name: 'Expense Breakdown', description: 'Detailed breakdown of expenses by category' },
    { id: ReportType.TAX_ESTIMATE, name: 'Tax Estimate', description: 'Estimated quarterly taxes based on earnings' },
    { id: ReportType.PLATFORM_COMPARISON, name: 'Platform Comparison', description: 'Compare earnings across different platforms' },
    { id: ReportType.FULL_FINANCIAL, name: 'Full Financial Report', description: 'Comprehensive financial overview with all metrics' },
  ],

  // Get frequency options
  getFrequencyOptions: () => [
    { id: ReportFrequency.DAILY, name: 'Daily', description: 'Every day at 8 AM' },
    { id: ReportFrequency.WEEKLY, name: 'Weekly', description: 'Every Monday at 8 AM' },
    { id: ReportFrequency.MONTHLY, name: 'Monthly', description: 'First of each month at 8 AM' },
    { id: ReportFrequency.QUARTERLY, name: 'Quarterly', description: 'First of each quarter at 8 AM' },
  ],

  // Process due reports (would be called by a cron job)
  processDueReports: async () => {
    const now = new Date().toISOString();
    const dueReports = Array.from(Models.scheduledReports.values())
      .filter(r => r.isActive && r.nextRun <= now);

    const results = [];
    for (const report of dueReports) {
      try {
        const result = await ScheduledReportService.runReport({ 
          reportId: report.id, 
          userId: report.userId 
        });
        results.push({ ...result, reportName: report.name });
      } catch (error) {
        results.push({ 
          success: false, 
          reportId: report.id, 
          reportName: report.name,
          error: error.message 
        });
      }
    }

    return {
      processed: results.length,
      results,
    };
  },
};
