import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.expenses) Models.expenses = new Map();
if (!Models.mileageRecords) Models.mileageRecords = new Map();
if (!Models.expenseCategories) Models.expenseCategories = new Map();

// Default expense categories
const DEFAULT_CATEGORIES = [
  { id: 'fuel', name: 'Fuel & Gas', icon: '⛽', deductible: true },
  { id: 'vehicle_maintenance', name: 'Vehicle Maintenance', icon: '🔧', deductible: true },
  { id: 'phone', name: 'Phone & Data', icon: '📱', deductible: true },
  { id: 'supplies', name: 'Supplies & Equipment', icon: '📦', deductible: true },
  { id: 'software', name: 'Software & Subscriptions', icon: '💻', deductible: true },
  { id: 'meals', name: 'Meals (Business)', icon: '🍔', deductible: true, deductionPercent: 50 },
  { id: 'parking', name: 'Parking & Tolls', icon: '🅿️', deductible: true },
  { id: 'insurance', name: 'Insurance', icon: '🛡️', deductible: true },
  { id: 'other', name: 'Other', icon: '📝', deductible: false },
];

// IRS standard mileage rate (2024)
const MILEAGE_RATE = 0.67; // $0.67 per mile

export const ExpenseService = {
  // Record an expense
  recordExpense: ({ userId, amount, categoryId, description, date, receiptUrl, metadata }) => {
    const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId) || DEFAULT_CATEGORIES.find(c => c.id === 'other');
    
    const expense = {
      id: uuid(),
      userId,
      amount,
      categoryId: category.id,
      categoryName: category.name,
      description: description || '',
      date: date || new Date().toISOString().split('T')[0],
      receiptUrl: receiptUrl || null,
      isDeductible: category.deductible,
      deductionPercent: category.deductionPercent || 100,
      deductibleAmount: category.deductible 
        ? Math.round(amount * (category.deductionPercent || 100) / 100 * 100) / 100
        : 0,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
      status: 'recorded',
    };

    Models.expenses.set(expense.id, expense);
    Models.auditLog.push({ type: 'expense_recorded', expense: { id: expense.id, amount, categoryId } });
    Models.metrics.increment('expenses.recorded');

    return expense;
  },

  // Record mileage
  recordMileage: ({ userId, miles, date, purpose, startLocation, endLocation, roundTrip }) => {
    const actualMiles = roundTrip ? miles * 2 : miles;
    const deductibleAmount = Math.round(actualMiles * MILEAGE_RATE * 100) / 100;

    const record = {
      id: uuid(),
      userId,
      miles: actualMiles,
      date: date || new Date().toISOString().split('T')[0],
      purpose: purpose || 'Business travel',
      startLocation,
      endLocation,
      roundTrip: roundTrip || false,
      mileageRate: MILEAGE_RATE,
      deductibleAmount,
      createdAt: new Date().toISOString(),
    };

    Models.mileageRecords.set(record.id, record);
    Models.metrics.increment('expenses.mileage_recorded');

    return record;
  },

  // Get expenses
  getExpenses: ({ userId, startDate, endDate, categoryId, limit = 50, offset = 0 }) => {
    let expenses = Array.from(Models.expenses.values())
      .filter(e => e.userId === userId);

    if (startDate) {
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter(e => e.date <= endDate);
    }
    if (categoryId) {
      expenses = expenses.filter(e => e.categoryId === categoryId);
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      expenses: expenses.slice(offset, offset + limit),
      total: expenses.length,
      hasMore: expenses.length > offset + limit,
    };
  },

  // Get mileage records
  getMileageRecords: ({ userId, startDate, endDate, limit = 50 }) => {
    let records = Array.from(Models.mileageRecords.values())
      .filter(r => r.userId === userId);

    if (startDate) {
      records = records.filter(r => r.date >= startDate);
    }
    if (endDate) {
      records = records.filter(r => r.date <= endDate);
    }

    records.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      records: records.slice(0, limit),
      total: records.length,
    };
  },

  // Get expense summary
  getExpenseSummary: ({ userId, startDate, endDate, groupBy = 'category' }) => {
    let expenses = Array.from(Models.expenses.values())
      .filter(e => e.userId === userId);

    if (startDate) {
      expenses = expenses.filter(e => e.date >= startDate);
    }
    if (endDate) {
      expenses = expenses.filter(e => e.date <= endDate);
    }

    // Group expenses
    const breakdown = {};
    let totalExpenses = 0;
    let totalDeductible = 0;

    for (const expense of expenses) {
      const key = groupBy === 'category' ? expense.categoryId : expense.date.slice(0, 7); // month
      if (!breakdown[key]) {
        breakdown[key] = {
          total: 0,
          deductible: 0,
          count: 0,
          name: groupBy === 'category' ? expense.categoryName : key,
        };
      }
      breakdown[key].total += expense.amount;
      breakdown[key].deductible += expense.deductibleAmount;
      breakdown[key].count += 1;
      totalExpenses += expense.amount;
      totalDeductible += expense.deductibleAmount;
    }

    // Get mileage totals
    let mileageRecords = Array.from(Models.mileageRecords.values())
      .filter(r => r.userId === userId);
    if (startDate) {
      mileageRecords = mileageRecords.filter(r => r.date >= startDate);
    }
    if (endDate) {
      mileageRecords = mileageRecords.filter(r => r.date <= endDate);
    }

    const totalMiles = mileageRecords.reduce((sum, r) => sum + r.miles, 0);
    const totalMileageDeduction = mileageRecords.reduce((sum, r) => sum + r.deductibleAmount, 0);

    return {
      period: { startDate, endDate },
      expenses: {
        total: Math.round(totalExpenses * 100) / 100,
        deductible: Math.round(totalDeductible * 100) / 100,
        count: expenses.length,
        breakdown: Object.entries(breakdown).map(([key, data]) => ({
          id: key,
          ...data,
          total: Math.round(data.total * 100) / 100,
          deductible: Math.round(data.deductible * 100) / 100,
        })),
      },
      mileage: {
        totalMiles,
        totalDeduction: Math.round(totalMileageDeduction * 100) / 100,
        recordCount: mileageRecords.length,
        rate: MILEAGE_RATE,
      },
      totalDeductible: Math.round((totalDeductible + totalMileageDeduction) * 100) / 100,
    };
  },

  // Export expenses for tax purposes
  exportExpenses: ({ userId, year, format = 'json' }) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const expenses = Array.from(Models.expenses.values())
      .filter(e => e.userId === userId && e.date >= startDate && e.date <= endDate);

    const mileageRecords = Array.from(Models.mileageRecords.values())
      .filter(r => r.userId === userId && r.date >= startDate && r.date <= endDate);

    const summary = ExpenseService.getExpenseSummary({ userId, startDate, endDate });

    return {
      year,
      generatedAt: new Date().toISOString(),
      summary,
      expenses,
      mileageRecords,
      format,
    };
  },

  // Get categories
  getCategories: () => DEFAULT_CATEGORIES,

  // Get current mileage rate
  getMileageRate: () => ({
    rate: MILEAGE_RATE,
    year: 2024,
    unit: 'USD per mile',
  }),

  // Delete expense
  deleteExpense: ({ expenseId, userId }) => {
    const expense = Models.expenses.get(expenseId);
    if (!expense || expense.userId !== userId) {
      throw new Error('expense_not_found');
    }
    Models.expenses.delete(expenseId);
    Models.auditLog.push({ type: 'expense_deleted', expenseId });
    return { deleted: true };
  },
};
