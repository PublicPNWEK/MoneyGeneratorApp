/**
 * Reporting API Routes
 * v2 API endpoints for analytics and reporting
 */

import express from 'express';
import ReportingService from '../../services/reportingService.js';
import { ScheduledReportService } from '../../services/scheduledReports.js';
import { logger } from '../../logger.js';

const router = express.Router();

function escapePdfText(text) {
  return String(text ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function buildSimplePdf(lines) {
  const safeLines = Array.isArray(lines) ? lines : [String(lines ?? '')];

  const contentLines = [];
  let y = 720;
  for (const line of safeLines.slice(0, 60)) {
    contentLines.push(`72 ${y} Td (${escapePdfText(line)}) Tj`);
    y -= 16;
  }

  const streamBody = `BT\n/F1 12 Tf\n${contentLines.join('\n')}\nET\n`;

  const objects = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
  objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(streamBody, 'utf8')} >>\nstream\n${streamBody}endstream\nendobj\n`);
  objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += obj;
  }

  const xrefStart = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const off = String(offsets[i]).padStart(10, '0');
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;

  return Buffer.from(pdf, 'utf8');
}

/**
 * POST /api/v2/reporting/transaction
 * Record a transaction for analytics
 * Body: { category: "string", amount: number, type: "income|expense", date?: ISO string }
 */
router.post('/transaction', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { category, amount, type, date } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!category || amount === undefined || !type) {
      return res.status(400).json({
        success: false,
        error: 'Category, amount, and type are required'
      });
    }

    const result = await ReportingService.recordTransaction(userId, {
      category,
      amount,
      type,
      date
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error in POST /transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to record transaction'
    });
  }
});

/**
 * GET /api/v2/reporting/dashboard
 * Get dashboard metrics snapshot
 */
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const result = await ReportingService.getDashboardMetrics(userId);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard metrics'
    });
  }
});

/**
 * GET /api/v2/reporting/breakdown
 * Get category breakdown
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=income|expense|all
 */
router.get('/breakdown', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { startDate, endDate, type = 'all' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const result = await ReportingService.getCategoryBreakdown(userId, startDate, endDate, type);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /breakdown:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch category breakdown'
    });
  }
});

/**
 * GET /api/v2/reporting/trends
 * Get trend data
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&period=daily|weekly|monthly&type=income|expense
 */
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { startDate, endDate, period = 'daily', type = 'income' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const result = await ReportingService.getTrends(userId, startDate, endDate, period, type);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /trends:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trends'
    });
  }
});

/**
 * GET /api/v2/reporting/cashflow
 * Get cash flow analysis
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/cashflow', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const result = await ReportingService.getCashFlow(userId, startDate, endDate);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /cashflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cash flow'
    });
  }
});

/**
 * GET /api/v2/reporting/forecast
 * Get income forecast
 * Query: ?months=3
 */
router.get('/forecast', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const months = parseInt(req.query.months || '3');

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const result = await ReportingService.getForecast(userId, months);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /forecast:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate forecast'
    });
  }
});

/**
 * GET /api/v2/reporting/tax-summary
 * Get tax summary for a year
 * Query: ?year=2024
 */
router.get('/tax-summary', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const year = parseInt(req.query.year || new Date().getFullYear());

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const result = await ReportingService.getTaxSummary(userId, year);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /tax-summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch tax summary'
    });
  }
});

/**
 * POST /api/v2/reporting/generate
 * Generate comprehensive report
 * Body: { reportType: "income|expense|cashflow|tax_summary|summary", startDate, endDate, format?: "json|csv|pdf" }
 */
router.post('/generate', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { reportType, startDate, endDate, format = 'json' } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!reportType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'reportType, startDate, and endDate are required'
      });
    }

    const result = await ReportingService.generateReport(
      userId,
      reportType,
      startDate,
      endDate,
      format
    );

    // If CSV, set proper headers
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
      res.send(result.report.data);
    } else {
      res.json(result);
    }
  } catch (error) {
    logger.error('Error in POST /generate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report'
    });
  }
});

/**
 * GET /api/v2/reporting/export-csv
 * Export transactions to CSV
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=income|expense|all
 */
router.get('/export-csv', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const { startDate, endDate, type = 'all' } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'startDate and endDate are required'
      });
    }

    const result = await ReportingService.exportCSV(userId, startDate, endDate, type);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (error) {
    logger.error('Error in GET /export-csv:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export CSV'
    });
  }
});

/**
 * GET /api/v2/reporting/export-pdf
 * Server-generated PDF (simple) for a given report type/date range.
 * Query: ?reportType=summary&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/export-pdf', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'] || req.query.userId;
    const { reportType = 'summary', startDate, endDate } = req.query;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User authentication required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
    }

    // Leverage existing generator for numbers; we emit a minimal PDF.
    const generated = await ReportingService.generateReport(userId, String(reportType), String(startDate), String(endDate), 'json');

    const lines = [
      'Money Generator Report',
      `Type: ${reportType}`,
      `Period: ${startDate} to ${endDate}`,
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      `Payload keys: ${Object.keys(generated?.report?.data || {}).join(', ') || 'n/a'}`,
    ];

    const pdf = buildSimplePdf(lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="moneygen-report.pdf"');
    res.send(pdf);
  } catch (error) {
    logger.error('Error in GET /export-pdf:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to export PDF' });
  }
});

/**
 * GET /api/v2/reporting/reports
 * Get user's saved reports
 * Query: ?limit=10
 */
router.get('/reports', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];
    const limit = Math.min(parseInt(req.query.limit || '10'), 100);

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const result = await ReportingService.getReports(userId, limit);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /reports:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch reports'
    });
  }
});

/**
 * GET /api/v2/reporting/insights
 * Get AI-powered insights and recommendations
 */
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user?.id || req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const result = await ReportingService.getInsights(userId);
    res.json(result);
  } catch (error) {
    logger.error('Error in GET /insights:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch insights'
    });
  }
});

// ==================== SCHEDULED REPORTS ====================

// Get all scheduled reports for a user
router.get('/scheduled', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'demo-user';
    const reports = ScheduledReportService.getByUser({ userId });
    res.json({ success: true, reports });
  } catch (error) {
    logger.error('Error in GET /scheduled:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get report type options
router.get('/scheduled/types', (req, res) => {
  res.json({ success: true, types: ScheduledReportService.getReportTypes() });
});

// Get frequency options
router.get('/scheduled/frequencies', (req, res) => {
  res.json({ success: true, frequencies: ScheduledReportService.getFrequencyOptions() });
});

// Create a scheduled report
router.post('/scheduled', (req, res) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';
    const { name, reportType, frequency, format, recipients, timezone } = req.body;

    if (!name || !reportType || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'name, reportType, and frequency are required'
      });
    }

    const report = ScheduledReportService.create({
      userId,
      name,
      reportType,
      frequency,
      format,
      recipients,
      timezone,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    logger.error('Error in POST /scheduled:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get a specific scheduled report
router.get('/scheduled/:reportId', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'demo-user';
    const report = ScheduledReportService.getById({
      reportId: req.params.reportId,
      userId,
    });

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    res.json({ success: true, report });
  } catch (error) {
    logger.error('Error in GET /scheduled/:reportId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update a scheduled report
router.put('/scheduled/:reportId', (req, res) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';
    const report = ScheduledReportService.update({
      reportId: req.params.reportId,
      userId,
      updates: req.body,
    });

    res.json({ success: true, report });
  } catch (error) {
    if (error.message === 'report_not_found') {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    logger.error('Error in PUT /scheduled/:reportId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle active status
router.post('/scheduled/:reportId/toggle', (req, res) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';
    const report = ScheduledReportService.toggleActive({
      reportId: req.params.reportId,
      userId,
    });

    res.json({ success: true, report });
  } catch (error) {
    if (error.message === 'report_not_found') {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    logger.error('Error in POST /scheduled/:reportId/toggle:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run a report immediately
router.post('/scheduled/:reportId/run', async (req, res) => {
  try {
    const userId = req.body.userId || req.headers['x-user-id'] || 'demo-user';
    const result = await ScheduledReportService.runReport({
      reportId: req.params.reportId,
      userId,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'report_not_found') {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    logger.error('Error in POST /scheduled/:reportId/run:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a scheduled report
router.delete('/scheduled/:reportId', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'] || 'demo-user';
    ScheduledReportService.delete({
      reportId: req.params.reportId,
      userId,
    });

    res.json({ success: true, deleted: true });
  } catch (error) {
    if (error.message === 'report_not_found') {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    logger.error('Error in DELETE /scheduled/:reportId:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
