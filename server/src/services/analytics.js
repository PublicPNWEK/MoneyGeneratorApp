import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.analyticsSnapshots) Models.analyticsSnapshots = new Map();
if (!Models.reports) Models.reports = new Map();
if (!Models.customMetrics) Models.customMetrics = new Map();

export const AnalyticsService = {
  // Calculate earnings analytics
  getEarningsAnalytics: ({ userId, startDate, endDate, groupBy = 'day' }) => {
    const earnings = Array.from(Models.earnings?.values() || [])
      .filter(e => e.userId === userId)
      .filter(e => {
        const date = new Date(e.timestamp);
        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();
        return date >= start && date <= end;
      });

    const grouped = {};
    const byPlatform = {};
    const byType = {};
    let total = 0;
    let count = 0;

    for (const earning of earnings) {
      total += earning.amount;
      count++;

      // Group by time
      const date = new Date(earning.timestamp);
      let key;
      switch (groupBy) {
        case 'hour':
          key = date.toISOString().substring(0, 13);
          break;
        case 'day':
          key = date.toISOString().substring(0, 10);
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().substring(0, 10);
          break;
        case 'month':
          key = date.toISOString().substring(0, 7);
          break;
        default:
          key = date.toISOString().substring(0, 10);
      }
      
      if (!grouped[key]) grouped[key] = { amount: 0, count: 0 };
      grouped[key].amount += earning.amount;
      grouped[key].count++;

      // By platform
      const platform = earning.platform || 'Unknown';
      if (!byPlatform[platform]) byPlatform[platform] = { amount: 0, count: 0 };
      byPlatform[platform].amount += earning.amount;
      byPlatform[platform].count++;

      // By type
      const type = earning.type || 'earnings';
      if (!byType[type]) byType[type] = { amount: 0, count: 0 };
      byType[type].amount += earning.amount;
      byType[type].count++;
    }

    return {
      userId,
      period: { startDate, endDate },
      summary: {
        total,
        count,
        average: count > 0 ? total / count : 0,
      },
      timeSeries: Object.entries(grouped)
        .map(([key, data]) => ({ date: key, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byPlatform: Object.entries(byPlatform)
        .map(([platform, data]) => ({ platform, ...data }))
        .sort((a, b) => b.amount - a.amount),
      byType: Object.entries(byType)
        .map(([type, data]) => ({ type, ...data }))
        .sort((a, b) => b.amount - a.amount),
    };
  },

  // Calculate profitability
  getProfitabilityAnalysis: ({ userId, startDate, endDate }) => {
    const earnings = Array.from(Models.earnings?.values() || [])
      .filter(e => e.userId === userId)
      .filter(e => !startDate || new Date(e.timestamp) >= new Date(startDate))
      .filter(e => !endDate || new Date(e.timestamp) <= new Date(endDate));

    const expenses = Array.from(Models.expenses?.values() || [])
      .filter(e => e.userId === userId)
      .filter(e => !startDate || new Date(e.timestamp) >= new Date(startDate))
      .filter(e => !endDate || new Date(e.timestamp) <= new Date(endDate));

    const shifts = Array.from(Models.shifts?.values() || [])
      .filter(s => s.userId === userId)
      .filter(s => !startDate || new Date(s.startTime) >= new Date(startDate))
      .filter(s => !endDate || new Date(s.startTime) <= new Date(endDate));

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalHours = shifts.reduce((sum, s) => {
      if (s.endTime) {
        return sum + (new Date(s.endTime) - new Date(s.startTime)) / 3600000;
      }
      return sum;
    }, 0);

    const netProfit = totalEarnings - totalExpenses;
    const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;
    const effectiveHourlyRate = totalHours > 0 ? netProfit / totalHours : 0;

    // By platform profitability
    const platformMetrics = {};
    for (const earning of earnings) {
      const platform = earning.platform || 'Unknown';
      if (!platformMetrics[platform]) {
        platformMetrics[platform] = { earnings: 0, hours: 0 };
      }
      platformMetrics[platform].earnings += earning.amount;
    }
    for (const shift of shifts) {
      const platform = shift.platform || 'Unknown';
      if (!platformMetrics[platform]) {
        platformMetrics[platform] = { earnings: 0, hours: 0 };
      }
      if (shift.endTime) {
        platformMetrics[platform].hours += (new Date(shift.endTime) - new Date(shift.startTime)) / 3600000;
      }
    }

    return {
      userId,
      period: { startDate, endDate },
      summary: {
        totalEarnings,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        totalHours: Math.round(totalHours * 100) / 100,
        grossHourlyRate: totalHours > 0 ? Math.round((totalEarnings / totalHours) * 100) / 100 : 0,
        effectiveHourlyRate: Math.round(effectiveHourlyRate * 100) / 100,
      },
      byPlatform: Object.entries(platformMetrics)
        .map(([platform, data]) => ({
          platform,
          earnings: data.earnings,
          hours: Math.round(data.hours * 100) / 100,
          hourlyRate: data.hours > 0 ? Math.round((data.earnings / data.hours) * 100) / 100 : 0,
        }))
        .sort((a, b) => b.hourlyRate - a.hourlyRate),
      expenseBreakdown: AnalyticsService.getExpenseBreakdown({ userId, startDate, endDate }),
    };
  },

  // Expense breakdown
  getExpenseBreakdown: ({ userId, startDate, endDate }) => {
    const expenses = Array.from(Models.expenses?.values() || [])
      .filter(e => e.userId === userId)
      .filter(e => !startDate || new Date(e.timestamp) >= new Date(startDate))
      .filter(e => !endDate || new Date(e.timestamp) <= new Date(endDate));

    const byCategory = {};
    let total = 0;

    for (const expense of expenses) {
      const category = expense.category || 'Other';
      if (!byCategory[category]) byCategory[category] = 0;
      byCategory[category] += expense.amount;
      total += expense.amount;
    }

    return {
      total,
      byCategory: Object.entries(byCategory)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: total > 0 ? Math.round((amount / total) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.amount - a.amount),
    };
  },

  // Time analysis
  getTimeAnalysis: ({ userId, startDate, endDate }) => {
    const shifts = Array.from(Models.shifts?.values() || [])
      .filter(s => s.userId === userId && s.endTime)
      .filter(s => !startDate || new Date(s.startTime) >= new Date(startDate))
      .filter(s => !endDate || new Date(s.startTime) <= new Date(endDate));

    const byDayOfWeek = Array(7).fill(null).map(() => ({ hours: 0, earnings: 0, count: 0 }));
    const byHourOfDay = Array(24).fill(null).map(() => ({ hours: 0, earnings: 0, count: 0 }));

    for (const shift of shifts) {
      const start = new Date(shift.startTime);
      const hours = (new Date(shift.endTime) - start) / 3600000;
      const earnings = shift.earnings || 0;

      byDayOfWeek[start.getDay()].hours += hours;
      byDayOfWeek[start.getDay()].earnings += earnings;
      byDayOfWeek[start.getDay()].count++;

      byHourOfDay[start.getHours()].hours += hours;
      byHourOfDay[start.getHours()].earnings += earnings;
      byHourOfDay[start.getHours()].count++;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Find best times
    const bestDay = byDayOfWeek
      .map((d, i) => ({ day: days[i], hourlyRate: d.hours > 0 ? d.earnings / d.hours : 0, ...d }))
      .sort((a, b) => b.hourlyRate - a.hourlyRate)[0];

    const bestHours = byHourOfDay
      .map((h, i) => ({ hour: i, hourlyRate: h.hours > 0 ? h.earnings / h.hours : 0, ...h }))
      .filter(h => h.count > 0)
      .sort((a, b) => b.hourlyRate - a.hourlyRate)
      .slice(0, 3);

    return {
      userId,
      period: { startDate, endDate },
      byDayOfWeek: byDayOfWeek.map((d, i) => ({
        day: days[i],
        hours: Math.round(d.hours * 100) / 100,
        earnings: Math.round(d.earnings * 100) / 100,
        count: d.count,
        hourlyRate: d.hours > 0 ? Math.round((d.earnings / d.hours) * 100) / 100 : 0,
      })),
      byHourOfDay: byHourOfDay.map((h, i) => ({
        hour: i,
        hours: Math.round(h.hours * 100) / 100,
        earnings: Math.round(h.earnings * 100) / 100,
        count: h.count,
        hourlyRate: h.hours > 0 ? Math.round((h.earnings / h.hours) * 100) / 100 : 0,
      })),
      recommendations: {
        bestDay: bestDay?.day,
        bestDayHourlyRate: bestDay?.hourlyRate,
        bestHours: bestHours.map(h => `${h.hour}:00`),
      },
    };
  },

  // Goal tracking
  getGoalProgress: ({ userId }) => {
    const goals = Array.from(Models.goals?.values() || [])
      .filter(g => g.userId === userId);

    return {
      goals: goals.map(goal => ({
        ...goal,
        percentComplete: goal.targetAmount > 0
          ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
          : 0,
        remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
        onTrack: AnalyticsService.checkGoalOnTrack(goal),
      })),
    };
  },

  // Check if goal is on track
  checkGoalOnTrack: (goal) => {
    if (!goal.deadline) return null;

    const now = new Date();
    const start = new Date(goal.createdAt);
    const deadline = new Date(goal.deadline);
    
    const totalDays = (deadline - start) / 86400000;
    const elapsedDays = (now - start) / 86400000;
    
    const expectedProgress = elapsedDays / totalDays;
    const actualProgress = goal.currentAmount / goal.targetAmount;
    
    return actualProgress >= expectedProgress * 0.9; // Within 10% of expected
  },

  // Generate report
  generateReport: async ({ userId, reportType, startDate, endDate, options }) => {
    const report = {
      id: uuid(),
      userId,
      reportType,
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      data: {},
    };

    switch (reportType) {
      case 'earnings_summary':
        report.data = AnalyticsService.getEarningsAnalytics({ userId, startDate, endDate });
        break;
      case 'profitability':
        report.data = AnalyticsService.getProfitabilityAnalysis({ userId, startDate, endDate });
        break;
      case 'time_analysis':
        report.data = AnalyticsService.getTimeAnalysis({ userId, startDate, endDate });
        break;
      case 'tax_summary':
        report.data = await AnalyticsService.getTaxSummary({ userId, startDate, endDate });
        break;
      case 'full_report':
        report.data = {
          earnings: AnalyticsService.getEarningsAnalytics({ userId, startDate, endDate }),
          profitability: AnalyticsService.getProfitabilityAnalysis({ userId, startDate, endDate }),
          time: AnalyticsService.getTimeAnalysis({ userId, startDate, endDate }),
          goals: AnalyticsService.getGoalProgress({ userId }),
        };
        break;
      default:
        throw new Error('invalid_report_type');
    }

    Models.reports.set(report.id, report);
    Models.metrics.increment(`reports.generated.${reportType}`);

    return report;
  },

  // Tax summary
  getTaxSummary: async ({ userId, startDate, endDate }) => {
    const earnings = AnalyticsService.getEarningsAnalytics({ userId, startDate, endDate });
    const expenses = AnalyticsService.getExpenseBreakdown({ userId, startDate, endDate });

    const deductibleCategories = ['mileage', 'supplies', 'phone', 'insurance', 'equipment', 'maintenance'];
    const deductibleExpenses = expenses.byCategory
      .filter(c => deductibleCategories.includes(c.category.toLowerCase()))
      .reduce((sum, c) => sum + c.amount, 0);

    const taxableIncome = earnings.summary.total - deductibleExpenses;
    const estimatedSelfEmploymentTax = taxableIncome * 0.153; // 15.3% SE tax
    const estimatedIncomeTax = taxableIncome * 0.22; // Estimated 22% bracket
    const totalEstimatedTax = estimatedSelfEmploymentTax + estimatedIncomeTax;

    return {
      period: { startDate, endDate },
      grossIncome: earnings.summary.total,
      deductibleExpenses,
      taxableIncome,
      estimates: {
        selfEmploymentTax: Math.round(estimatedSelfEmploymentTax * 100) / 100,
        incomeTax: Math.round(estimatedIncomeTax * 100) / 100,
        totalTax: Math.round(totalEstimatedTax * 100) / 100,
        effectiveTaxRate: taxableIncome > 0 
          ? Math.round((totalEstimatedTax / taxableIncome) * 10000) / 100 
          : 0,
      },
      quarterlyPaymentSuggestion: Math.round((totalEstimatedTax / 4) * 100) / 100,
      deductionDetails: expenses.byCategory.filter(c => 
        deductibleCategories.includes(c.category.toLowerCase())
      ),
      disclaimer: 'These are estimates only. Consult a tax professional for accurate calculations.',
    };
  },

  // Compare periods
  comparePeriods: ({ userId, period1Start, period1End, period2Start, period2End }) => {
    const period1 = AnalyticsService.getProfitabilityAnalysis({
      userId,
      startDate: period1Start,
      endDate: period1End,
    });
    const period2 = AnalyticsService.getProfitabilityAnalysis({
      userId,
      startDate: period2Start,
      endDate: period2End,
    });

    const calculateChange = (v1, v2) => {
      if (v1 === 0) return v2 > 0 ? 100 : 0;
      return Math.round(((v2 - v1) / v1) * 10000) / 100;
    };

    return {
      period1: { startDate: period1Start, endDate: period1End, data: period1.summary },
      period2: { startDate: period2Start, endDate: period2End, data: period2.summary },
      changes: {
        earnings: calculateChange(period1.summary.totalEarnings, period2.summary.totalEarnings),
        expenses: calculateChange(period1.summary.totalExpenses, period2.summary.totalExpenses),
        netProfit: calculateChange(period1.summary.netProfit, period2.summary.netProfit),
        hours: calculateChange(period1.summary.totalHours, period2.summary.totalHours),
        hourlyRate: calculateChange(period1.summary.effectiveHourlyRate, period2.summary.effectiveHourlyRate),
      },
    };
  },

  // Get saved reports
  getReports: ({ userId, limit = 20 }) => {
    const reports = Array.from(Models.reports.values())
      .filter(r => r.userId === userId)
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))
      .slice(0, limit);

    return { reports };
  },
};
