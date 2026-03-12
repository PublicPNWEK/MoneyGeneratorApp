import { v4 as uuid } from 'uuid';
import { Models } from '../models.js';

// Initialize credit system storage
if (!Models.creditBalances) Models.creditBalances = new Map();
if (!Models.creditTransactions) Models.creditTransactions = new Map();
if (!Models.creditActivities) Models.creditActivities = new Map();
if (!Models.creditOffers) Models.creditOffers = new Map();
if (!Models.creditPartners) Models.creditPartners = new Map();
if (!Models.creditRedemptions) Models.creditRedemptions = new Map();
if (!Models.creditSurveys) Models.creditSurveys = new Map();
if (!Models.creditSurveyResponses) Models.creditSurveyResponses = new Map();
if (!Models.creditReferrals) Models.creditReferrals = new Map();
if (!Models.creditStreaks) Models.creditStreaks = new Map();
if (!Models.creditAchievements) Models.creditAchievements = new Map();

// Credit conversion rates
export const CreditRates = {
  CREDITS_PER_DOLLAR: 100, // 100 credits = $1.00
  MIN_REDEMPTION: 500, // $5.00 minimum
  MAX_DAILY_EARNINGS: 50000, // $500 cap per day
};

// Activity types and their base rewards
export const ActivityTypes = {
  SURVEY: 'survey',
  GAME: 'game',
  VIDEO_AD: 'video_ad',
  BANNER_IMPRESSION: 'banner_impression',
  OFFER_COMPLETION: 'offer_completion',
  APP_INSTALL: 'app_install',
  SOCIAL_SHARE: 'social_share',
  SOCIAL_POST: 'social_post',
  SEARCH: 'search',
  CASHBACK_PURCHASE: 'cashback_purchase',
  REFERRAL: 'referral',
  DAILY_CHECKIN: 'daily_checkin',
  SIGNUP_BONUS: 'signup_bonus',
  PROFILE_COMPLETE: 'profile_complete',
  RECEIPT_SCAN: 'receipt_scan',
  TASK: 'task',
};

// Base credit rewards per activity type
const BASE_REWARDS = {
  [ActivityTypes.SURVEY]: { min: 50, max: 500 }, // $0.50 - $5.00
  [ActivityTypes.GAME]: { min: 5, max: 2000 }, // $0.05 - $20.00 (for reaching levels)
  [ActivityTypes.VIDEO_AD]: { min: 1, max: 5 }, // $0.01 - $0.05
  [ActivityTypes.BANNER_IMPRESSION]: { min: 0, max: 1 }, // $0.00 - $0.01
  [ActivityTypes.OFFER_COMPLETION]: { min: 100, max: 10000 }, // $1.00 - $100.00
  [ActivityTypes.APP_INSTALL]: { min: 50, max: 3000 }, // $0.50 - $30.00
  [ActivityTypes.SOCIAL_SHARE]: { min: 5, max: 25 }, // $0.05 - $0.25
  [ActivityTypes.SOCIAL_POST]: { min: 10, max: 50 }, // $0.10 - $0.50
  [ActivityTypes.SEARCH]: { min: 1, max: 3 }, // $0.01 - $0.03
  [ActivityTypes.CASHBACK_PURCHASE]: { min: 0, max: 0 }, // Variable %
  [ActivityTypes.REFERRAL]: { min: 100, max: 1000 }, // $1.00 - $10.00
  [ActivityTypes.DAILY_CHECKIN]: { min: 5, max: 50 }, // $0.05 - $0.50 (streak bonuses)
  [ActivityTypes.SIGNUP_BONUS]: { min: 100, max: 500 }, // $1.00 - $5.00
  [ActivityTypes.PROFILE_COMPLETE]: { min: 50, max: 100 }, // $0.50 - $1.00
  [ActivityTypes.RECEIPT_SCAN]: { min: 5, max: 100 }, // $0.05 - $1.00
  [ActivityTypes.TASK]: { min: 10, max: 500 }, // $0.10 - $5.00
};

// Redemption types
export const RedemptionTypes = {
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  GIFT_CARD_AMAZON: 'gift_card_amazon',
  GIFT_CARD_WALMART: 'gift_card_walmart',
  GIFT_CARD_TARGET: 'gift_card_target',
  GIFT_CARD_VISA: 'gift_card_visa',
  GIFT_CARD_STARBUCKS: 'gift_card_starbucks',
  CRYPTO_BTC: 'crypto_btc',
  CRYPTO_ETH: 'crypto_eth',
  CHARITY_DONATION: 'charity_donation',
};

// Gift card denominations
const GIFT_CARD_DENOMINATIONS = [500, 1000, 2500, 5000, 10000, 25000]; // $5, $10, $25, $50, $100, $250

// Survey categories
export const SurveyCategories = {
  CONSUMER_PRODUCTS: 'consumer_products',
  TECHNOLOGY: 'technology',
  ENTERTAINMENT: 'entertainment',
  LIFESTYLE: 'lifestyle',
  FINANCE: 'finance',
  HEALTH: 'health',
  TRAVEL: 'travel',
  AUTOMOTIVE: 'automotive',
  FOOD_BEVERAGE: 'food_beverage',
  POLITICS: 'politics',
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_survey', name: 'Survey Starter', description: 'Complete your first survey', credits: 25, condition: { type: 'survey_count', value: 1 } },
  { id: 'survey_master', name: 'Survey Master', description: 'Complete 100 surveys', credits: 500, condition: { type: 'survey_count', value: 100 } },
  { id: 'first_game', name: 'Gamer', description: 'Play your first game', credits: 10, condition: { type: 'game_count', value: 1 } },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Login 7 days in a row', credits: 100, condition: { type: 'streak', value: 7 } },
  { id: 'streak_30', name: 'Monthly Master', description: 'Login 30 days in a row', credits: 500, condition: { type: 'streak', value: 30 } },
  { id: 'referral_1', name: 'Friend Finder', description: 'Refer your first friend', credits: 50, condition: { type: 'referral_count', value: 1 } },
  { id: 'referral_10', name: 'Social Butterfly', description: 'Refer 10 friends', credits: 1000, condition: { type: 'referral_count', value: 10 } },
  { id: 'first_redemption', name: 'Casher', description: 'Make your first redemption', credits: 25, condition: { type: 'redemption_count', value: 1 } },
  { id: 'earn_1000', name: 'First Tenner', description: 'Earn your first $10', credits: 100, condition: { type: 'total_earned', value: 1000 } },
  { id: 'earn_10000', name: 'Benjamin Hunter', description: 'Earn your first $100', credits: 500, condition: { type: 'total_earned', value: 10000 } },
  { id: 'profile_complete', name: 'Identity Confirmed', description: 'Complete your profile', credits: 50, condition: { type: 'profile_complete', value: true } },
  { id: 'social_sharer', name: 'Social Star', description: 'Share on social media 10 times', credits: 100, condition: { type: 'social_share_count', value: 10 } },
];

export const CreditsService = {
  // ==================== BALANCE MANAGEMENT ====================
  
  // Get or create user's credit balance
  getBalance: ({ userId }) => {
    let balance = Models.creditBalances.get(userId);
    if (!balance) {
      balance = {
        userId,
        available: 0,
        pending: 0,
        lifetime: 0,
        redeemed: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      Models.creditBalances.set(userId, balance);
    }
    return {
      ...balance,
      availableUsd: (balance.available / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      pendingUsd: (balance.pending / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      lifetimeUsd: (balance.lifetime / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      redeemedUsd: (balance.redeemed / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      minRedemption: CreditRates.MIN_REDEMPTION,
      minRedemptionUsd: (CreditRates.MIN_REDEMPTION / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      canRedeem: balance.available >= CreditRates.MIN_REDEMPTION,
    };
  },

  // Add credits to user's balance
  addCredits: ({ userId, amount, activityType, activityId, description, isPending = false }) => {
    const balance = Models.creditBalances.get(userId) || {
      userId, available: 0, pending: 0, lifetime: 0, redeemed: 0,
      createdAt: new Date().toISOString(),
    };

    // Check daily cap
    const today = new Date().toISOString().split('T')[0];
    const dailyEarnings = Array.from(Models.creditTransactions.values())
      .filter(t => t.userId === userId && t.type === 'credit' && t.createdAt.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);

    if (dailyEarnings + amount > CreditRates.MAX_DAILY_EARNINGS) {
      const remaining = CreditRates.MAX_DAILY_EARNINGS - dailyEarnings;
      if (remaining <= 0) {
        throw new Error('daily_limit_reached');
      }
      amount = remaining;
    }

    if (isPending) {
      balance.pending += amount;
    } else {
      balance.available += amount;
      balance.lifetime += amount;
    }
    balance.updatedAt = new Date().toISOString();
    Models.creditBalances.set(userId, balance);

    // Record transaction
    const transaction = {
      id: uuid(),
      userId,
      type: 'credit',
      amount,
      activityType,
      activityId,
      description: description || `Earned from ${activityType}`,
      status: isPending ? 'pending' : 'completed',
      createdAt: new Date().toISOString(),
      balanceAfter: balance.available,
    };
    Models.creditTransactions.set(transaction.id, transaction);

    Models.metrics.increment('credits.earned');
    Models.auditLog.push({ type: 'credits_added', userId, amount, activityType });

    return { transaction, balance: CreditsService.getBalance({ userId }) };
  },

  // Convert pending credits to available
  confirmPendingCredits: ({ userId, transactionId }) => {
    const transaction = Models.creditTransactions.get(transactionId);
    if (!transaction || transaction.userId !== userId || transaction.status !== 'pending') {
      throw new Error('transaction_not_found');
    }

    const balance = Models.creditBalances.get(userId);
    balance.pending -= transaction.amount;
    balance.available += transaction.amount;
    balance.lifetime += transaction.amount;
    balance.updatedAt = new Date().toISOString();
    
    transaction.status = 'completed';
    transaction.confirmedAt = new Date().toISOString();

    return { transaction, balance: CreditsService.getBalance({ userId }) };
  },

  // Deduct credits (for redemptions)
  deductCredits: ({ userId, amount, redemptionId, description }) => {
    const balance = Models.creditBalances.get(userId);
    if (!balance || balance.available < amount) {
      throw new Error('insufficient_credits');
    }

    balance.available -= amount;
    balance.redeemed += amount;
    balance.updatedAt = new Date().toISOString();
    Models.creditBalances.set(userId, balance);

    const transaction = {
      id: uuid(),
      userId,
      type: 'debit',
      amount,
      redemptionId,
      description: description || 'Credit redemption',
      status: 'completed',
      createdAt: new Date().toISOString(),
      balanceAfter: balance.available,
    };
    Models.creditTransactions.set(transaction.id, transaction);

    Models.metrics.increment('credits.redeemed');
    return { transaction, balance: CreditsService.getBalance({ userId }) };
  },

  // Get transaction history
  getTransactionHistory: ({ userId, type, limit = 50, offset = 0 }) => {
    let transactions = Array.from(Models.creditTransactions.values())
      .filter(t => t.userId === userId);
    
    if (type) {
      transactions = transactions.filter(t => t.type === type);
    }

    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return {
      transactions: transactions.slice(offset, offset + limit),
      total: transactions.length,
      hasMore: offset + limit < transactions.length,
    };
  },

  // ==================== SURVEYS ====================

  // Create a survey
  createSurvey: ({ partnerId, title, description, category, questions, estimatedMinutes, credits, requirements }) => {
    const survey = {
      id: uuid(),
      partnerId,
      title,
      description,
      category: category || SurveyCategories.CONSUMER_PRODUCTS,
      questions: questions || [],
      estimatedMinutes: estimatedMinutes || 10,
      credits: credits || Math.floor(Math.random() * (BASE_REWARDS.survey.max - BASE_REWARDS.survey.min) + BASE_REWARDS.survey.min),
      requirements: requirements || {}, // Age, location, demographics
      isActive: true,
      totalResponses: 0,
      maxResponses: requirements?.maxResponses || 1000,
      createdAt: new Date().toISOString(),
    };
    Models.creditSurveys.set(survey.id, survey);
    return survey;
  },

  // Get available surveys for user
  getAvailableSurveys: ({ userId, category, limit = 20 }) => {
    const completedSurveyIds = new Set(
      Array.from(Models.creditSurveyResponses.values())
        .filter(r => r.userId === userId)
        .map(r => r.surveyId)
    );

    let surveys = Array.from(Models.creditSurveys.values())
      .filter(s => s.isActive && !completedSurveyIds.has(s.id) && s.totalResponses < s.maxResponses);

    if (category) {
      surveys = surveys.filter(s => s.category === category);
    }

    // Sort by credits (highest first)
    surveys.sort((a, b) => b.credits - a.credits);

    return {
      surveys: surveys.slice(0, limit).map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        category: s.category,
        estimatedMinutes: s.estimatedMinutes,
        credits: s.credits,
        creditsUsd: (s.credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      })),
      total: surveys.length,
    };
  },

  // Start a survey
  startSurvey: ({ userId, surveyId }) => {
    const survey = Models.creditSurveys.get(surveyId);
    if (!survey || !survey.isActive) {
      throw new Error('survey_not_found');
    }

    // Check if already completed
    const existing = Array.from(Models.creditSurveyResponses.values())
      .find(r => r.userId === userId && r.surveyId === surveyId);
    if (existing) {
      throw new Error('survey_already_completed');
    }

    return {
      surveyId,
      title: survey.title,
      questions: survey.questions,
      credits: survey.credits,
      estimatedMinutes: survey.estimatedMinutes,
    };
  },

  // Complete a survey
  completeSurvey: ({ userId, surveyId, answers }) => {
    const survey = Models.creditSurveys.get(surveyId);
    if (!survey || !survey.isActive) {
      throw new Error('survey_not_found');
    }

    // Record response
    const response = {
      id: uuid(),
      userId,
      surveyId,
      answers,
      credits: survey.credits,
      completedAt: new Date().toISOString(),
    };
    Models.creditSurveyResponses.set(response.id, response);

    // Update survey stats
    survey.totalResponses++;
    if (survey.totalResponses >= survey.maxResponses) {
      survey.isActive = false;
    }

    // Credit the user
    const result = CreditsService.addCredits({
      userId,
      amount: survey.credits,
      activityType: ActivityTypes.SURVEY,
      activityId: surveyId,
      description: `Completed survey: ${survey.title}`,
    });

    // Check achievements
    CreditsService.checkAchievements({ userId });

    Models.metrics.increment('surveys.completed');
    return { response, ...result };
  },

  // ==================== GAMES ====================

  // Get available games
  getAvailableGames: () => {
    // Pre-configured games with their reward structures
    return {
      games: [
        {
          id: 'solitaire',
          name: 'Solitaire Cash',
          description: 'Classic solitaire with cash rewards',
          icon: '🃏',
          rewardType: 'per_win',
          rewardCredits: 5,
          dailyLimit: 50,
        },
        {
          id: 'bingo',
          name: 'Bingo Blast',
          description: 'Quick bingo games for instant rewards',
          icon: '🎱',
          rewardType: 'per_game',
          rewardCredits: 3,
          dailyLimit: 30,
        },
        {
          id: 'word_puzzle',
          name: 'Word Fortune',
          description: 'Solve word puzzles for credits',
          icon: '📝',
          rewardType: 'per_level',
          rewardCredits: 10,
          dailyLimit: 100,
        },
        {
          id: 'spin_wheel',
          name: 'Lucky Spin',
          description: 'Spin the wheel daily for random rewards',
          icon: '🎡',
          rewardType: 'random',
          rewardCreditsMin: 1,
          rewardCreditsMax: 100,
          dailyLimit: 3,
        },
        {
          id: 'trivia',
          name: 'Trivia Champion',
          description: 'Answer trivia questions for credits',
          icon: '🧠',
          rewardType: 'per_correct',
          rewardCredits: 2,
          dailyLimit: 100,
        },
        {
          id: 'match_3',
          name: 'Gem Match',
          description: 'Match gems and earn credits',
          icon: '💎',
          rewardType: 'per_level',
          rewardCredits: 5,
          dailyLimit: 50,
        },
        {
          id: 'scratch',
          name: 'Scratch & Win',
          description: 'Digital scratch cards with instant prizes',
          icon: '🎫',
          rewardType: 'random',
          rewardCreditsMin: 0,
          rewardCreditsMax: 500,
          dailyLimit: 10,
        },
        {
          id: 'slots',
          name: 'Credit Slots',
          description: 'Spin slots for credit rewards (no real gambling)',
          icon: '🎰',
          rewardType: 'random',
          rewardCreditsMin: 0,
          rewardCreditsMax: 50,
          dailyLimit: 20,
        },
      ],
    };
  },

  // Record game play and award credits
  recordGamePlay: ({ userId, gameId, result, score }) => {
    const games = CreditsService.getAvailableGames().games;
    const game = games.find(g => g.id === gameId);
    if (!game) {
      throw new Error('game_not_found');
    }

    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const todayPlays = Array.from(Models.creditActivities.values())
      .filter(a => a.userId === userId && a.type === ActivityTypes.GAME && 
                   a.metadata?.gameId === gameId && a.createdAt.startsWith(today))
      .length;

    if (todayPlays >= game.dailyLimit) {
      return { 
        credits: 0, 
        message: 'Daily limit reached for this game',
        dailyPlays: todayPlays,
        dailyLimit: game.dailyLimit,
      };
    }

    // Calculate credits based on game type
    let credits = 0;
    if (game.rewardType === 'random') {
      credits = Math.floor(Math.random() * (game.rewardCreditsMax - game.rewardCreditsMin + 1)) + game.rewardCreditsMin;
    } else if (game.rewardType === 'per_win' && result === 'win') {
      credits = game.rewardCredits;
    } else if (game.rewardType === 'per_game' || game.rewardType === 'per_level') {
      credits = game.rewardCredits;
    } else if (game.rewardType === 'per_correct' && result === 'correct') {
      credits = game.rewardCredits;
    }

    // Record activity
    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.GAME,
      credits,
      metadata: { gameId, result, score },
      createdAt: new Date().toISOString(),
    };
    Models.creditActivities.set(activity.id, activity);

    // Award credits if any
    let balance;
    if (credits > 0) {
      const result = CreditsService.addCredits({
        userId,
        amount: credits,
        activityType: ActivityTypes.GAME,
        activityId: activity.id,
        description: `Played ${game.name}`,
      });
      balance = result.balance;
    } else {
      balance = CreditsService.getBalance({ userId });
    }

    Models.metrics.increment('games.played');
    return { 
      activity, 
      credits, 
      creditsUsd: (credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      balance,
      dailyPlays: todayPlays + 1,
      dailyLimit: game.dailyLimit,
    };
  },

  // ==================== OFFERS ====================

  // Get available offers (app installs, trials, signups, etc.)
  getAvailableOffers: ({ userId, category }) => {
    // Generate mock offers
    const offers = [
      {
        id: 'offer_1',
        partnerId: 'partner_games',
        title: 'Download Hero Quest',
        description: 'Install and reach level 10',
        category: 'game',
        credits: 1500,
        requirements: ['Install app', 'Reach level 10'],
        estimatedMinutes: 30,
        icon: '⚔️',
      },
      {
        id: 'offer_2',
        partnerId: 'partner_finance',
        title: 'Sign up for CashApp',
        description: 'Create account and link bank',
        category: 'finance',
        credits: 2500,
        requirements: ['Create account', 'Link bank account', 'Make first transaction'],
        estimatedMinutes: 15,
        icon: '💵',
      },
      {
        id: 'offer_3',
        partnerId: 'partner_shopping',
        title: 'Try Amazon Prime',
        description: 'Start 30-day free trial',
        category: 'shopping',
        credits: 500,
        requirements: ['Sign up for trial'],
        estimatedMinutes: 5,
        icon: '📦',
      },
      {
        id: 'offer_4',
        partnerId: 'partner_streaming',
        title: 'Get Spotify Premium',
        description: 'Start premium subscription',
        category: 'entertainment',
        credits: 1000,
        requirements: ['Sign up', 'Complete first month'],
        estimatedMinutes: 5,
        icon: '🎵',
      },
      {
        id: 'offer_5',
        partnerId: 'partner_food',
        title: 'Order on DoorDash',
        description: 'Place your first order',
        category: 'food',
        credits: 800,
        requirements: ['Download app', 'Place first order ($15+)'],
        estimatedMinutes: 20,
        icon: '🍔',
      },
      {
        id: 'offer_6',
        partnerId: 'partner_health',
        title: 'Join Noom',
        description: 'Complete health quiz and start trial',
        category: 'health',
        credits: 3000,
        requirements: ['Complete quiz', 'Start trial'],
        estimatedMinutes: 15,
        icon: '🥗',
      },
      {
        id: 'offer_7',
        partnerId: 'partner_insurance',
        title: 'Get Insurance Quote',
        description: 'Complete quote for auto insurance',
        category: 'insurance',
        credits: 200,
        requirements: ['Complete quote form'],
        estimatedMinutes: 10,
        icon: '🚗',
      },
      {
        id: 'offer_8',
        partnerId: 'partner_survey_panel',
        title: 'Join Survey Panel',
        description: 'Sign up for premium survey panel',
        category: 'survey',
        credits: 100,
        requirements: ['Complete registration', 'Verify email'],
        estimatedMinutes: 5,
        icon: '📋',
      },
    ];

    // Filter by category if specified
    let filteredOffers = offers;
    if (category) {
      filteredOffers = offers.filter(o => o.category === category);
    }

    // Check which offers user has already completed
    const completedOfferIds = new Set(
      Array.from(Models.creditActivities.values())
        .filter(a => a.userId === userId && a.type === ActivityTypes.OFFER_COMPLETION)
        .map(a => a.metadata?.offerId)
    );

    return {
      offers: filteredOffers.filter(o => !completedOfferIds.has(o.id)).map(o => ({
        ...o,
        creditsUsd: (o.credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      })),
    };
  },

  // Start an offer (track click)
  startOffer: ({ userId, offerId }) => {
    const activity = {
      id: uuid(),
      userId,
      type: 'offer_click',
      offerId,
      createdAt: new Date().toISOString(),
      status: 'clicked',
    };
    Models.creditActivities.set(activity.id, activity);
    
    Models.metrics.increment('offers.clicked');
    return { trackingId: activity.id, offerId };
  },

  // Complete an offer
  completeOffer: ({ userId, offerId, trackingId }) => {
    const offers = CreditsService.getAvailableOffers({ userId }).offers;
    const offer = offers.find(o => o.id === offerId);
    
    // For demo, allow completion of any offer
    const credits = offer?.credits || 100;
    const title = offer?.title || 'Offer';

    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.OFFER_COMPLETION,
      credits,
      metadata: { offerId, trackingId },
      createdAt: new Date().toISOString(),
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: credits,
      activityType: ActivityTypes.OFFER_COMPLETION,
      activityId: activity.id,
      description: `Completed: ${title}`,
      isPending: true, // Offers are pending until verified
    });

    Models.metrics.increment('offers.completed');
    return { activity, ...result, pendingVerification: true };
  },

  // ==================== SOCIAL & SHARING ====================

  // Record social share
  recordSocialShare: ({ userId, platform, contentType, contentId }) => {
    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.SOCIAL_SHARE,
      credits: 10,
      metadata: { platform, contentType, contentId },
      createdAt: new Date().toISOString(),
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: 10,
      activityType: ActivityTypes.SOCIAL_SHARE,
      activityId: activity.id,
      description: `Shared on ${platform}`,
    });

    CreditsService.checkAchievements({ userId });
    Models.metrics.increment('social.shares');
    return { activity, ...result };
  },

  // Record social post (user posts with our hashtag/link)
  recordSocialPost: ({ userId, platform, postUrl, hashtag }) => {
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const todayPosts = Array.from(Models.creditActivities.values())
      .filter(a => a.userId === userId && a.type === ActivityTypes.SOCIAL_POST && a.createdAt.startsWith(today))
      .length;

    if (todayPosts >= 5) {
      throw new Error('daily_social_post_limit_reached');
    }

    const credits = 25; // Base credits for social posts
    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.SOCIAL_POST,
      credits,
      metadata: { platform, postUrl, hashtag },
      createdAt: new Date().toISOString(),
      status: 'pending_verification',
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: credits,
      activityType: ActivityTypes.SOCIAL_POST,
      activityId: activity.id,
      description: `Posted on ${platform}`,
      isPending: true,
    });

    Models.metrics.increment('social.posts');
    return { activity, ...result };
  },

  // ==================== VIDEO ADS ====================

  // Get available video ads
  getAvailableVideoAds: ({ userId }) => {
    // Check how many ads user has watched today
    const today = new Date().toISOString().split('T')[0];
    const todayAds = Array.from(Models.creditActivities.values())
      .filter(a => a.userId === userId && a.type === ActivityTypes.VIDEO_AD && a.createdAt.startsWith(today))
      .length;

    const dailyLimit = 50;
    const remaining = Math.max(0, dailyLimit - todayAds);

    return {
      available: remaining > 0,
      adsWatched: todayAds,
      dailyLimit,
      remaining,
      creditsPerAd: 3,
      creditsPerAdUsd: '0.03',
    };
  },

  // Record video ad watch
  recordVideoAdWatch: ({ userId, adId, duration }) => {
    const adInfo = CreditsService.getAvailableVideoAds({ userId });
    if (!adInfo.available) {
      return { credits: 0, message: 'Daily video ad limit reached' };
    }

    const credits = 3;
    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.VIDEO_AD,
      credits,
      metadata: { adId, duration },
      createdAt: new Date().toISOString(),
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: credits,
      activityType: ActivityTypes.VIDEO_AD,
      activityId: activity.id,
      description: 'Watched video ad',
    });

    Models.metrics.increment('ads.watched');
    return { activity, ...result };
  },

  // ==================== SEARCH ====================

  // Record search (paid search partnership)
  recordSearch: ({ userId, query }) => {
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const todaySearches = Array.from(Models.creditActivities.values())
      .filter(a => a.userId === userId && a.type === ActivityTypes.SEARCH && a.createdAt.startsWith(today))
      .length;

    if (todaySearches >= 30) {
      return { credits: 0, message: 'Daily search limit reached', searchCount: todaySearches };
    }

    const credits = 2;
    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.SEARCH,
      credits,
      metadata: { query: query.substring(0, 100) },
      createdAt: new Date().toISOString(),
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: credits,
      activityType: ActivityTypes.SEARCH,
      activityId: activity.id,
      description: 'Web search',
    });

    Models.metrics.increment('search.queries');
    return { activity, searchCount: todaySearches + 1, ...result };
  },

  // ==================== CASHBACK ====================

  // Get cashback retailers
  getCashbackRetailers: () => {
    return {
      retailers: [
        { id: 'amazon', name: 'Amazon', cashbackPercent: 1, icon: '📦', category: 'shopping' },
        { id: 'walmart', name: 'Walmart', cashbackPercent: 2, icon: '🏪', category: 'shopping' },
        { id: 'target', name: 'Target', cashbackPercent: 1.5, icon: '🎯', category: 'shopping' },
        { id: 'ebay', name: 'eBay', cashbackPercent: 2.5, icon: '🛒', category: 'shopping' },
        { id: 'bestbuy', name: 'Best Buy', cashbackPercent: 1, icon: '📺', category: 'electronics' },
        { id: 'nike', name: 'Nike', cashbackPercent: 4, icon: '👟', category: 'clothing' },
        { id: 'macys', name: "Macy's", cashbackPercent: 3, icon: '👔', category: 'clothing' },
        { id: 'sephora', name: 'Sephora', cashbackPercent: 4, icon: '💄', category: 'beauty' },
        { id: 'grubhub', name: 'Grubhub', cashbackPercent: 2, icon: '🍕', category: 'food' },
        { id: 'uber_eats', name: 'Uber Eats', cashbackPercent: 2, icon: '🍔', category: 'food' },
        { id: 'expedia', name: 'Expedia', cashbackPercent: 5, icon: '✈️', category: 'travel' },
        { id: 'hotels_com', name: 'Hotels.com', cashbackPercent: 4, icon: '🏨', category: 'travel' },
      ],
    };
  },

  // Record cashback purchase
  recordCashbackPurchase: ({ userId, retailerId, purchaseAmount, orderId }) => {
    const retailers = CreditsService.getCashbackRetailers().retailers;
    const retailer = retailers.find(r => r.id === retailerId);
    if (!retailer) {
      throw new Error('retailer_not_found');
    }

    const cashbackAmount = purchaseAmount * (retailer.cashbackPercent / 100);
    const credits = Math.floor(cashbackAmount * CreditRates.CREDITS_PER_DOLLAR);

    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.CASHBACK_PURCHASE,
      credits,
      metadata: { 
        retailerId, 
        retailerName: retailer.name,
        purchaseAmount, 
        cashbackPercent: retailer.cashbackPercent,
        orderId,
      },
      createdAt: new Date().toISOString(),
      status: 'pending',
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: credits,
      activityType: ActivityTypes.CASHBACK_PURCHASE,
      activityId: activity.id,
      description: `${retailer.cashbackPercent}% cashback at ${retailer.name}`,
      isPending: true, // Cashback is pending until confirmed
    });

    Models.metrics.increment('cashback.purchases');
    return { 
      activity, 
      cashbackAmount: cashbackAmount.toFixed(2),
      ...result,
    };
  },

  // ==================== REFERRALS ====================

  // Generate referral code
  generateReferralCode: ({ userId }) => {
    let referral = Array.from(Models.creditReferrals.values())
      .find(r => r.referrerId === userId);

    if (!referral) {
      referral = {
        id: uuid(),
        referrerId: userId,
        code: `REF${userId.substring(0, 4).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        referredUsers: [],
        totalEarned: 0,
        createdAt: new Date().toISOString(),
      };
      Models.creditReferrals.set(referral.id, referral);
    }

    return {
      code: referral.code,
      link: `https://app.moneygenerator.com/join?ref=${referral.code}`,
      referredCount: referral.referredUsers.length,
      totalEarned: referral.totalEarned,
      totalEarnedUsd: (referral.totalEarned / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      rewardPerReferral: 500,
      rewardPerReferralUsd: '5.00',
    };
  },

  // Apply referral code (when new user signs up)
  applyReferralCode: ({ userId, referralCode }) => {
    const referral = Array.from(Models.creditReferrals.values())
      .find(r => r.code === referralCode);

    if (!referral) {
      throw new Error('invalid_referral_code');
    }

    if (referral.referrerId === userId) {
      throw new Error('cannot_refer_self');
    }

    if (referral.referredUsers.includes(userId)) {
      throw new Error('already_referred');
    }

    // Add to referred users
    referral.referredUsers.push(userId);
    
    // Credit the referrer
    const referrerReward = 500;
    CreditsService.addCredits({
      userId: referral.referrerId,
      amount: referrerReward,
      activityType: ActivityTypes.REFERRAL,
      activityId: referral.id,
      description: `Referral bonus: new user signed up`,
    });
    referral.totalEarned += referrerReward;

    // Credit the new user
    const newUserBonus = 250;
    const result = CreditsService.addCredits({
      userId,
      amount: newUserBonus,
      activityType: ActivityTypes.REFERRAL,
      activityId: referral.id,
      description: `Welcome bonus from referral`,
    });

    CreditsService.checkAchievements({ userId: referral.referrerId });
    Models.metrics.increment('referrals.completed');

    return {
      referrerReward,
      newUserBonus,
      ...result,
    };
  },

  // ==================== DAILY CHECK-IN & STREAKS ====================

  // Daily check-in
  dailyCheckin: ({ userId }) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get user's streak data
    let streak = Models.creditStreaks.get(userId);
    if (!streak) {
      streak = {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCheckin: null,
        totalCheckins: 0,
      };
    }

    // Check if already checked in today
    if (streak.lastCheckin === today) {
      return { 
        alreadyCheckedIn: true, 
        currentStreak: streak.currentStreak,
        credits: 0,
      };
    }

    // Check if streak continues
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (streak.lastCheckin === yesterday) {
      streak.currentStreak++;
    } else {
      streak.currentStreak = 1;
    }

    streak.lastCheckin = today;
    streak.totalCheckins++;
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    Models.creditStreaks.set(userId, streak);

    // Calculate credits based on streak (bonus for longer streaks)
    let credits = 5;
    if (streak.currentStreak >= 7) credits = 15;
    if (streak.currentStreak >= 14) credits = 25;
    if (streak.currentStreak >= 30) credits = 50;
    if (streak.currentStreak >= 100) credits = 100;

    // Special milestone bonuses
    if ([7, 14, 30, 60, 90, 100, 365].includes(streak.currentStreak)) {
      credits += streak.currentStreak; // Bonus equal to streak day
    }

    const result = CreditsService.addCredits({
      userId,
      amount: credits,
      activityType: ActivityTypes.DAILY_CHECKIN,
      activityId: uuid(),
      description: `Day ${streak.currentStreak} check-in`,
    });

    CreditsService.checkAchievements({ userId });
    Models.metrics.increment('checkins.daily');

    return {
      checkedIn: true,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      credits,
      creditsUsd: (credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      nextMilestone: [7, 14, 30, 60, 90, 100, 365].find(m => m > streak.currentStreak),
      ...result,
    };
  },

  // Get streak info
  getStreakInfo: ({ userId }) => {
    const streak = Models.creditStreaks.get(userId) || {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckin: null,
      totalCheckins: 0,
    };

    const today = new Date().toISOString().split('T')[0];
    const canCheckin = streak.lastCheckin !== today;

    return {
      ...streak,
      canCheckin,
      nextMilestone: [7, 14, 30, 60, 90, 100, 365].find(m => m > streak.currentStreak),
    };
  },

  // ==================== ACHIEVEMENTS ====================

  // Check and award achievements
  checkAchievements: ({ userId }) => {
    const userAchievements = Models.creditAchievements.get(userId) || [];
    const earnedAchievementIds = new Set(userAchievements.map(a => a.id));
    const newAchievements = [];

    for (const achievement of ACHIEVEMENTS) {
      if (earnedAchievementIds.has(achievement.id)) continue;

      let earned = false;
      const condition = achievement.condition;

      if (condition.type === 'survey_count') {
        const count = Array.from(Models.creditSurveyResponses.values())
          .filter(r => r.userId === userId).length;
        earned = count >= condition.value;
      } else if (condition.type === 'game_count') {
        const count = Array.from(Models.creditActivities.values())
          .filter(a => a.userId === userId && a.type === ActivityTypes.GAME).length;
        earned = count >= condition.value;
      } else if (condition.type === 'streak') {
        const streak = Models.creditStreaks.get(userId);
        earned = streak && streak.currentStreak >= condition.value;
      } else if (condition.type === 'referral_count') {
        const referral = Array.from(Models.creditReferrals.values())
          .find(r => r.referrerId === userId);
        earned = referral && referral.referredUsers.length >= condition.value;
      } else if (condition.type === 'redemption_count') {
        const count = Array.from(Models.creditRedemptions.values())
          .filter(r => r.userId === userId && r.status === 'completed').length;
        earned = count >= condition.value;
      } else if (condition.type === 'total_earned') {
        const balance = Models.creditBalances.get(userId);
        earned = balance && balance.lifetime >= condition.value;
      } else if (condition.type === 'social_share_count') {
        const count = Array.from(Models.creditActivities.values())
          .filter(a => a.userId === userId && a.type === ActivityTypes.SOCIAL_SHARE).length;
        earned = count >= condition.value;
      }

      if (earned) {
        const earned_achievement = {
          ...achievement,
          earnedAt: new Date().toISOString(),
        };
        userAchievements.push(earned_achievement);
        newAchievements.push(earned_achievement);

        // Award achievement credits
        CreditsService.addCredits({
          userId,
          amount: achievement.credits,
          activityType: 'achievement',
          activityId: achievement.id,
          description: `Achievement unlocked: ${achievement.name}`,
        });
      }
    }

    Models.creditAchievements.set(userId, userAchievements);
    return { newAchievements, totalAchievements: userAchievements.length };
  },

  // Get user's achievements
  getAchievements: ({ userId }) => {
    const userAchievements = Models.creditAchievements.get(userId) || [];
    const earnedIds = new Set(userAchievements.map(a => a.id));

    return {
      earned: userAchievements,
      available: ACHIEVEMENTS.filter(a => !earnedIds.has(a.id)),
      progress: userAchievements.length,
      total: ACHIEVEMENTS.length,
    };
  },

  // ==================== REDEMPTIONS ====================

  // Get redemption options
  getRedemptionOptions: () => {
    return {
      options: [
        { type: RedemptionTypes.PAYPAL, name: 'PayPal', minCredits: 500, processingDays: 3, icon: '💸' },
        { type: RedemptionTypes.BANK_TRANSFER, name: 'Bank Transfer', minCredits: 1000, processingDays: 5, icon: '🏦' },
        { type: RedemptionTypes.GIFT_CARD_AMAZON, name: 'Amazon Gift Card', minCredits: 500, processingDays: 1, icon: '📦' },
        { type: RedemptionTypes.GIFT_CARD_WALMART, name: 'Walmart Gift Card', minCredits: 500, processingDays: 1, icon: '🏪' },
        { type: RedemptionTypes.GIFT_CARD_TARGET, name: 'Target Gift Card', minCredits: 500, processingDays: 1, icon: '🎯' },
        { type: RedemptionTypes.GIFT_CARD_VISA, name: 'Visa Gift Card', minCredits: 1000, processingDays: 2, icon: '💳' },
        { type: RedemptionTypes.GIFT_CARD_STARBUCKS, name: 'Starbucks Gift Card', minCredits: 500, processingDays: 1, icon: '☕' },
        { type: RedemptionTypes.CRYPTO_BTC, name: 'Bitcoin', minCredits: 2500, processingDays: 1, icon: '₿' },
        { type: RedemptionTypes.CRYPTO_ETH, name: 'Ethereum', minCredits: 2500, processingDays: 1, icon: 'Ξ' },
        { type: RedemptionTypes.CHARITY_DONATION, name: 'Donate to Charity', minCredits: 100, processingDays: 0, icon: '❤️' },
      ].map(o => ({
        ...o,
        minUsd: (o.minCredits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
        denominations: o.type.startsWith('gift_card') ? GIFT_CARD_DENOMINATIONS : null,
      })),
    };
  },

  // Request redemption
  requestRedemption: ({ userId, type, credits, destination }) => {
    const options = CreditsService.getRedemptionOptions().options;
    const option = options.find(o => o.type === type);
    if (!option) {
      throw new Error('invalid_redemption_type');
    }

    if (credits < option.minCredits) {
      throw new Error('below_minimum_redemption');
    }

    // Check balance
    const balance = Models.creditBalances.get(userId);
    if (!balance || balance.available < credits) {
      throw new Error('insufficient_credits');
    }

    // Validate gift card denominations
    if (type.startsWith('gift_card') && !GIFT_CARD_DENOMINATIONS.includes(credits)) {
      throw new Error('invalid_gift_card_amount');
    }

    // Create redemption
    const redemption = {
      id: uuid(),
      userId,
      type,
      credits,
      usdValue: (credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      destination: destination || null,
      status: 'pending',
      processingDays: option.processingDays,
      estimatedCompletion: new Date(Date.now() + option.processingDays * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    Models.creditRedemptions.set(redemption.id, redemption);

    // Deduct credits
    CreditsService.deductCredits({
      userId,
      amount: credits,
      redemptionId: redemption.id,
      description: `Redemption: ${option.name}`,
    });

    // Check achievements
    CreditsService.checkAchievements({ userId });

    Models.auditLog.push({ type: 'redemption_requested', userId, redemptionId: redemption.id, credits });
    Models.metrics.increment('redemptions.requested');

    return {
      redemption,
      balance: CreditsService.getBalance({ userId }),
    };
  },

  // Get redemption history
  getRedemptionHistory: ({ userId, status, limit = 20 }) => {
    let redemptions = Array.from(Models.creditRedemptions.values())
      .filter(r => r.userId === userId);

    if (status) {
      redemptions = redemptions.filter(r => r.status === status);
    }

    redemptions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return {
      redemptions: redemptions.slice(0, limit),
      total: redemptions.length,
    };
  },

  // Process redemption (admin/background job)
  processRedemption: ({ redemptionId }) => {
    const redemption = Models.creditRedemptions.get(redemptionId);
    if (!redemption) {
      throw new Error('redemption_not_found');
    }

    redemption.status = 'completed';
    redemption.completedAt = new Date().toISOString();

    Models.auditLog.push({ type: 'redemption_completed', redemptionId });
    Models.metrics.increment('redemptions.completed');

    return redemption;
  },

  // ==================== RECEIPTS ====================

  // Submit receipt for credits
  submitReceipt: ({ userId, retailer, purchaseAmount, receiptImageUrl, items }) => {
    // Calculate credits (small amount for receipt scanning)
    const baseCredits = 5;
    const bonusCredits = Math.min(50, Math.floor(purchaseAmount / 10)); // Up to 50 bonus for larger receipts
    const totalCredits = baseCredits + bonusCredits;

    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.RECEIPT_SCAN,
      credits: totalCredits,
      metadata: { retailer, purchaseAmount, receiptImageUrl, items: items || [] },
      createdAt: new Date().toISOString(),
      status: 'pending_verification',
    };
    Models.creditActivities.set(activity.id, activity);

    const result = CreditsService.addCredits({
      userId,
      amount: totalCredits,
      activityType: ActivityTypes.RECEIPT_SCAN,
      activityId: activity.id,
      description: `Receipt from ${retailer}`,
      isPending: true,
    });

    Models.metrics.increment('receipts.submitted');
    return { activity, ...result };
  },

  // ==================== MICRO TASKS ====================

  // Get available tasks
  getAvailableTasks: ({ userId }) => {
    const completedToday = new Set(
      Array.from(Models.creditActivities.values())
        .filter(a => a.userId === userId && 
                     a.type === ActivityTypes.TASK && 
                     a.createdAt.startsWith(new Date().toISOString().split('T')[0]))
        .map(a => a.metadata?.taskId)
    );

    const tasks = [
      { id: 'task_1', title: 'Categorize 10 images', description: 'Help train AI by categorizing images', credits: 30, estimatedMinutes: 5, icon: '🖼️' },
      { id: 'task_2', title: 'Transcribe audio clip', description: 'Listen and transcribe a 30-second clip', credits: 25, estimatedMinutes: 3, icon: '🎧' },
      { id: 'task_3', title: 'Verify business info', description: 'Confirm business address and hours', credits: 15, estimatedMinutes: 2, icon: '📍' },
      { id: 'task_4', title: 'Rate search results', description: 'Rate relevance of search results', credits: 20, estimatedMinutes: 4, icon: '🔍' },
      { id: 'task_5', title: 'Identify objects', description: 'Draw boxes around objects in images', credits: 35, estimatedMinutes: 6, icon: '📐' },
      { id: 'task_6', title: 'Sentiment analysis', description: 'Rate the sentiment of social media posts', credits: 20, estimatedMinutes: 4, icon: '😊' },
      { id: 'task_7', title: 'Data entry', description: 'Enter information from a document', credits: 40, estimatedMinutes: 8, icon: '⌨️' },
      { id: 'task_8', title: 'Website testing', description: 'Test a website and report issues', credits: 100, estimatedMinutes: 15, icon: '🌐' },
    ];

    return {
      tasks: tasks.filter(t => !completedToday.has(t.id)).map(t => ({
        ...t,
        creditsUsd: (t.credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      })),
    };
  },

  // Complete a task
  completeTask: ({ userId, taskId, result }) => {
    const tasks = CreditsService.getAvailableTasks({ userId }).tasks;
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error('task_not_found_or_completed');
    }

    const activity = {
      id: uuid(),
      userId,
      type: ActivityTypes.TASK,
      credits: task.credits,
      metadata: { taskId, taskTitle: task.title, result },
      createdAt: new Date().toISOString(),
    };
    Models.creditActivities.set(activity.id, activity);

    const creditResult = CreditsService.addCredits({
      userId,
      amount: task.credits,
      activityType: ActivityTypes.TASK,
      activityId: activity.id,
      description: `Completed: ${task.title}`,
    });

    Models.metrics.increment('tasks.completed');
    return { activity, ...creditResult };
  },

  // ==================== DASHBOARD & STATS ====================

  // Get user's credit dashboard
  getDashboard: ({ userId }) => {
    const balance = CreditsService.getBalance({ userId });
    const streak = CreditsService.getStreakInfo({ userId });
    const achievements = CreditsService.getAchievements({ userId });

    // Today's earnings
    const today = new Date().toISOString().split('T')[0];
    const todayEarnings = Array.from(Models.creditTransactions.values())
      .filter(t => t.userId === userId && t.type === 'credit' && t.createdAt.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);

    // This week's earnings
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const weekEarnings = Array.from(Models.creditTransactions.values())
      .filter(t => t.userId === userId && t.type === 'credit' && t.createdAt >= weekAgo)
      .reduce((sum, t) => sum + t.amount, 0);

    // Activity breakdown
    const activityCounts = {};
    Array.from(Models.creditActivities.values())
      .filter(a => a.userId === userId)
      .forEach(a => {
        activityCounts[a.type] = (activityCounts[a.type] || 0) + 1;
      });

    // Pending credits count
    const pendingTransactions = Array.from(Models.creditTransactions.values())
      .filter(t => t.userId === userId && t.status === 'pending').length;

    return {
      balance,
      streak,
      achievements: {
        earned: achievements.earned.length,
        total: achievements.total,
        recent: achievements.earned.slice(-3),
      },
      stats: {
        todayEarnings,
        todayEarningsUsd: (todayEarnings / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
        weekEarnings,
        weekEarningsUsd: (weekEarnings / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
        activityCounts,
        pendingTransactions,
      },
      quickActions: {
        canCheckin: streak.canCheckin,
        surveysAvailable: true,
        adsAvailable: true,
        offersAvailable: true,
      },
    };
  },

  // Get leaderboard
  getLeaderboard: ({ period = 'week', limit = 100 }) => {
    let sinceDate;
    if (period === 'day') {
      sinceDate = new Date().toISOString().split('T')[0];
    } else if (period === 'week') {
      sinceDate = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (period === 'month') {
      sinceDate = new Date(Date.now() - 30 * 86400000).toISOString();
    } else {
      sinceDate = '1970-01-01';
    }

    // Aggregate earnings by user
    const userEarnings = {};
    Array.from(Models.creditTransactions.values())
      .filter(t => t.type === 'credit' && t.createdAt >= sinceDate)
      .forEach(t => {
        userEarnings[t.userId] = (userEarnings[t.userId] || 0) + t.amount;
      });

    // Sort and rank
    const leaderboard = Object.entries(userEarnings)
      .map(([userId, credits]) => ({
        userId,
        credits,
        creditsUsd: (credits / CreditRates.CREDITS_PER_DOLLAR).toFixed(2),
      }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, limit)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return { period, leaderboard };
  },

  // ==================== PARTNERS (For B2B) ====================

  // Register a partner (advertiser, survey company, etc.)
  registerPartner: ({ name, type, contactEmail, revenueShare }) => {
    const partner = {
      id: uuid(),
      name,
      type, // 'survey', 'advertiser', 'game', 'retailer', 'app'
      contactEmail,
      revenueShare: revenueShare || 0.3, // Default 30% to platform
      apiKey: uuid(),
      isActive: true,
      totalSpend: 0,
      totalImpressions: 0,
      totalConversions: 0,
      createdAt: new Date().toISOString(),
    };
    Models.creditPartners.set(partner.id, partner);
    return partner;
  },

  // Get partner stats
  getPartnerStats: ({ partnerId }) => {
    const partner = Models.creditPartners.get(partnerId);
    if (!partner) {
      throw new Error('partner_not_found');
    }

    return {
      partner: { id: partner.id, name: partner.name, type: partner.type },
      stats: {
        totalSpend: partner.totalSpend,
        totalImpressions: partner.totalImpressions,
        totalConversions: partner.totalConversions,
        conversionRate: partner.totalImpressions > 0 
          ? ((partner.totalConversions / partner.totalImpressions) * 100).toFixed(2) + '%'
          : '0%',
      },
    };
  },

  // ==================== BONUS EVENTS ====================

  // Create limited-time bonus event
  createBonusEvent: ({ name, multiplier, activityTypes, startTime, endTime }) => {
    const event = {
      id: uuid(),
      name,
      multiplier: multiplier || 2, // 2x credits
      activityTypes: activityTypes || Object.values(ActivityTypes),
      startTime: startTime || new Date().toISOString(),
      endTime: endTime || new Date(Date.now() + 24 * 3600000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    
    if (!Models.bonusEvents) Models.bonusEvents = new Map();
    Models.bonusEvents.set(event.id, event);
    return event;
  },

  // Get active bonus events
  getActiveBonusEvents: () => {
    if (!Models.bonusEvents) return { events: [] };
    
    const now = new Date().toISOString();
    const activeEvents = Array.from(Models.bonusEvents.values())
      .filter(e => e.isActive && e.startTime <= now && e.endTime >= now);

    return { events: activeEvents };
  },

  // Seed demo data
  seedDemoData: ({ userId }) => {
    // Add some initial balance
    CreditsService.addCredits({
      userId,
      amount: 250,
      activityType: ActivityTypes.SIGNUP_BONUS,
      activityId: 'signup',
      description: 'Welcome bonus',
    });

    // Create some sample surveys
    for (let i = 1; i <= 5; i++) {
      CreditsService.createSurvey({
        partnerId: 'demo_partner',
        title: `Consumer Survey #${i}`,
        description: `Help us understand your shopping preferences`,
        category: Object.values(SurveyCategories)[i % Object.values(SurveyCategories).length],
        questions: [
          { id: 1, type: 'multiple_choice', text: 'How often do you shop online?', options: ['Daily', 'Weekly', 'Monthly', 'Rarely'] },
          { id: 2, type: 'scale', text: 'Rate your satisfaction', min: 1, max: 10 },
          { id: 3, type: 'text', text: 'Any additional feedback?' },
        ],
        estimatedMinutes: 5 + i * 2,
        credits: 50 + i * 50,
      });
    }

    return { seeded: true, initialBalance: 250 };
  },
};

export default CreditsService;
