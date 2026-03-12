import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize storage
if (!Models.benefitsBuckets) Models.benefitsBuckets = new Map();
if (!Models.benefitsTransactions) Models.benefitsTransactions = new Map();
if (!Models.taxWithholdings) Models.taxWithholdings = new Map();

// Bucket types
export const BucketTypes = {
  TAX_RESERVE: 'tax_reserve',
  HEALTH_SAVINGS: 'health_savings',
  RETIREMENT: 'retirement',
  EMERGENCY_FUND: 'emergency_fund',
  CUSTOM: 'custom',
};

// Default allocation percentages
const DEFAULT_ALLOCATIONS = {
  [BucketTypes.TAX_RESERVE]: 25, // 25% for taxes
  [BucketTypes.HEALTH_SAVINGS]: 5, // 5% for health
  [BucketTypes.RETIREMENT]: 10, // 10% for retirement
  [BucketTypes.EMERGENCY_FUND]: 5, // 5% for emergencies
};

export const BenefitsService = {
  // Initialize buckets for a user
  initializeBuckets: ({ userId, allocations }) => {
    const userAllocations = { ...DEFAULT_ALLOCATIONS, ...(allocations || {}) };
    const buckets = [];

    for (const [type, percentage] of Object.entries(userAllocations)) {
      if (percentage > 0) {
        const bucket = {
          id: uuid(),
          userId,
          type,
          name: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          allocationPercent: percentage,
          balance: 0,
          totalContributed: 0,
          totalWithdrawn: 0,
          createdAt: new Date().toISOString(),
          isActive: true,
        };
        Models.benefitsBuckets.set(bucket.id, bucket);
        buckets.push(bucket);
      }
    }

    Models.auditLog.push({ type: 'benefits_buckets_initialized', userId, buckets: buckets.map(b => b.id) });
    return { buckets };
  },

  // Get user's buckets
  getBuckets: ({ userId }) => {
    const buckets = Array.from(Models.benefitsBuckets.values())
      .filter(b => b.userId === userId && b.isActive);
    
    const totalBalance = buckets.reduce((sum, b) => sum + b.balance, 0);
    const totalAllocated = buckets.reduce((sum, b) => sum + b.allocationPercent, 0);

    return {
      buckets,
      totalBalance,
      totalAllocatedPercent: totalAllocated,
      remainingPercent: Math.max(0, 100 - totalAllocated),
    };
  },

  // Update bucket allocation
  updateAllocation: ({ bucketId, userId, allocationPercent }) => {
    const bucket = Models.benefitsBuckets.get(bucketId);
    if (!bucket || bucket.userId !== userId) {
      throw new Error('bucket_not_found');
    }
    if (allocationPercent < 0 || allocationPercent > 100) {
      throw new Error('invalid_allocation_percent');
    }

    const oldPercent = bucket.allocationPercent;
    bucket.allocationPercent = allocationPercent;
    bucket.updatedAt = new Date().toISOString();

    Models.auditLog.push({ 
      type: 'bucket_allocation_updated', 
      bucketId, 
      oldPercent, 
      newPercent: allocationPercent 
    });

    return bucket;
  },

  // Auto-allocate earnings to buckets
  allocateEarnings: ({ userId, earningsAmount, source }) => {
    const buckets = Array.from(Models.benefitsBuckets.values())
      .filter(b => b.userId === userId && b.isActive && b.allocationPercent > 0);

    const allocations = [];
    let totalAllocated = 0;

    for (const bucket of buckets) {
      const amount = Math.round(earningsAmount * (bucket.allocationPercent / 100) * 100) / 100;
      if (amount > 0) {
        bucket.balance += amount;
        bucket.totalContributed += amount;
        totalAllocated += amount;

        const transaction = {
          id: uuid(),
          bucketId: bucket.id,
          userId,
          type: 'contribution',
          amount,
          source: source || 'earnings_auto_allocate',
          createdAt: new Date().toISOString(),
          balanceAfter: bucket.balance,
        };
        Models.benefitsTransactions.set(transaction.id, transaction);

        allocations.push({
          bucketId: bucket.id,
          bucketType: bucket.type,
          amount,
          newBalance: bucket.balance,
        });
      }
    }

    Models.metrics.increment('benefits.allocations');
    return {
      earningsAmount,
      totalAllocated,
      remainingAfterAllocation: earningsAmount - totalAllocated,
      allocations,
    };
  },

  // Withdraw from a bucket
  withdraw: ({ bucketId, userId, amount, reason }) => {
    const bucket = Models.benefitsBuckets.get(bucketId);
    if (!bucket || bucket.userId !== userId) {
      throw new Error('bucket_not_found');
    }
    if (amount > bucket.balance) {
      throw new Error('insufficient_balance');
    }
    if (amount <= 0) {
      throw new Error('invalid_amount');
    }

    bucket.balance -= amount;
    bucket.totalWithdrawn += amount;

    const transaction = {
      id: uuid(),
      bucketId,
      userId,
      type: 'withdrawal',
      amount: -amount,
      reason,
      createdAt: new Date().toISOString(),
      balanceAfter: bucket.balance,
    };
    Models.benefitsTransactions.set(transaction.id, transaction);

    Models.auditLog.push({ type: 'bucket_withdrawal', bucketId, amount, reason });
    Models.metrics.increment('benefits.withdrawals');

    return {
      bucket,
      transaction,
    };
  },

  // Get transaction history
  getTransactionHistory: ({ userId, bucketId, limit = 50 }) => {
    let transactions = Array.from(Models.benefitsTransactions.values())
      .filter(t => t.userId === userId);
    
    if (bucketId) {
      transactions = transactions.filter(t => t.bucketId === bucketId);
    }

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      transactions: transactions.slice(0, limit),
      total: transactions.length,
    };
  },

  // Calculate estimated tax (simplified)
  calculateEstimatedTax: ({ userId, annualIncome }) => {
    // Simplified US federal tax brackets for self-employment (2024)
    const selfEmploymentTaxRate = 0.153; // 15.3% SE tax
    const standardDeduction = 14600;
    
    const taxableIncome = Math.max(0, annualIncome - standardDeduction);
    
    // Simplified progressive brackets
    let federalTax = 0;
    if (taxableIncome > 0) {
      if (taxableIncome <= 11600) {
        federalTax = taxableIncome * 0.10;
      } else if (taxableIncome <= 47150) {
        federalTax = 1160 + (taxableIncome - 11600) * 0.12;
      } else if (taxableIncome <= 100525) {
        federalTax = 5426 + (taxableIncome - 47150) * 0.22;
      } else {
        federalTax = 17168.50 + (taxableIncome - 100525) * 0.24;
      }
    }

    const selfEmploymentTax = annualIncome * selfEmploymentTaxRate;
    const totalEstimatedTax = Math.round((federalTax + selfEmploymentTax) * 100) / 100;
    const quarterlyPayment = Math.round(totalEstimatedTax / 4 * 100) / 100;
    const recommendedWithholding = Math.round((totalEstimatedTax / annualIncome) * 100);

    return {
      annualIncome,
      taxableIncome,
      federalTax: Math.round(federalTax * 100) / 100,
      selfEmploymentTax: Math.round(selfEmploymentTax * 100) / 100,
      totalEstimatedTax,
      quarterlyPayment,
      recommendedWithholdingPercent: recommendedWithholding,
      disclaimer: 'This is an estimate only. Consult a tax professional for accurate calculations.',
    };
  },

  // Get benefits summary
  getSummary: ({ userId }) => {
    const buckets = BenefitsService.getBuckets({ userId });
    
    // Recent transactions
    const recentTransactions = Array.from(Models.benefitsTransactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Calculate 30-day totals
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const contributions30d = Array.from(Models.benefitsTransactions.values())
      .filter(t => t.userId === userId && t.type === 'contribution' && new Date(t.createdAt) >= thirtyDaysAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      ...buckets,
      contributions30d,
      recentTransactions,
    };
  },
};
