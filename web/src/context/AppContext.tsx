import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast';
import { apiFetchJson, getUserId } from '../lib/apiClient';

type BillingCycle = 'monthly' | 'annual';

type UpgradeOptions = {
  billingCycle?: BillingCycle;
  paymentMethod?: string;
  savedMethodId?: string;
  autoRetry?: boolean;
  rememberMethod?: boolean;
};

export type Product = {
  id: string;
  type: string;
  name: string;
  price: string;
  description: string;
};

export type UserRole = 'freelancer' | 'business' | 'individual' | null;

export type UserProfile = {
  role: UserRole;
  bankConnected: boolean;
  subscription: string | null;
  earnings: number;
  weeklyChange: number;
};

interface AppContextType {
  userProfile: UserProfile;
  products: Product[];
  apiConnected: boolean;
  isCheckoutOpen: boolean;
  showOnboarding: boolean;
  updateRole: (role: UserRole) => void;
  completeOnboarding: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  connectBank: () => void;
  upgradeSubscription: (planId: string, addons: string[], options?: UpgradeOptions) => Promise<void>;
  cancelSubscription: (reason?: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_PRODUCTS: Product[] = [
  {
    id: 'plan_pro',
    type: 'plan',
    name: 'Pro Plan',
    price: '$14.99/mo',
    description: 'Advanced analytics, instant payouts, and smart automations to maximize your earnings.',
  },
  {
    id: 'addon_shift_insights',
    type: 'addon',
    name: 'Shift Insights',
    price: '$4.99/mo',
    description: 'Deep per-shift profitability analysis and mileage rollups for gig work.',
  },
  {
    id: 'onetime_boost',
    type: 'one_time',
    name: 'Priority Boost',
    price: '$19.99',
    description: 'Get priority placement for 14 days to attract more high-paying opportunities.',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    role: null,
    bankConnected: false,
    subscription: null,
    earnings: 2847,
    weeklyChange: 12,
  });
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [apiConnected, setApiConnected] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { showToast } = useToast();

  type BackendPlan = 'basic' | 'pro' | 'enterprise';

  const uiPlanToBackend = (planId: string): BackendPlan => {
    if (planId === 'plan_free') return 'basic';
    if (planId === 'plan_pro') return 'pro';
    if (planId === 'plan_enterprise') return 'enterprise';
    if (planId === 'basic' || planId === 'pro' || planId === 'enterprise') return planId;
    return 'basic';
  };

  const backendPlanToUi = (plan: string | null | undefined): string | null => {
    if (!plan || plan === 'basic') return null;
    if (plan === 'pro') return 'plan_pro';
    if (plan === 'enterprise') return 'plan_enterprise';
    // If backend ever returns UI ids, pass through.
    if (plan === 'plan_free') return null;
    if (plan === 'plan_pro' || plan === 'plan_enterprise') return plan;
    return null;
  };

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboarding_complete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
    } else {
        const storedRole = localStorage.getItem('user_role') as UserRole;
        if (storedRole) {
            setUserProfile(prev => ({ ...prev, role: storedRole }));
        }
    }
    refreshSubscription().catch(() => null);
    fetchProducts();
  }, []);

  const updateRole = useCallback((role: UserRole) => {
      setUserProfile(prev => ({ ...prev, role }));
      if (role) localStorage.setItem('user_role', role);
  }, []);

  const completeOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_complete', 'true');
    showToast('Welcome to Money Generator!', 'success');
  }, [showToast]);

  const fetchProducts = async () => {
    try {
      const data = await apiFetchJson<{ success: boolean; plans?: Array<{ id: string; name: string; description?: string; price?: { monthly?: number | null; annual?: number | null } }> }>(
        '/api/v2/subscriptions/plans'
      );

      if (data?.success && Array.isArray(data.plans)) {
        const plansAsProducts: Product[] = data.plans.map((p) => {
          const uiId = p.id === 'basic' ? 'plan_free' : p.id === 'pro' ? 'plan_pro' : p.id === 'enterprise' ? 'plan_enterprise' : `plan_${p.id}`;
          const monthly = p.price?.monthly;
          const priceText = monthly === null || monthly === undefined ? 'Custom' : monthly === 0 ? 'Free' : `$${Number(monthly).toFixed(2)}/mo`;
          return {
            id: uiId,
            type: 'plan',
            name: p.name,
            price: priceText,
            description: p.description || '',
          };
        });

        // Preserve any non-plan demo products for now (add-ons / one-time).
        const nonPlans = DEMO_PRODUCTS.filter((p) => p.type !== 'plan');
        setProducts([...plansAsProducts, ...nonPlans]);
        setApiConnected(true);
        return;
      }
    } catch {
      // fall back below
    }

    setApiConnected(false);
  };

  const refreshSubscription = useCallback(async () => {
    try {
      const data = await apiFetchJson<{ success: boolean; subscription?: { plan?: string | null } }>('/api/v2/subscriptions');
      const uiPlan = backendPlanToUi(data?.subscription?.plan);
      setUserProfile((prev) => ({ ...prev, subscription: uiPlan }));
      setApiConnected(true);
    } catch {
      setApiConnected(false);
    }
  }, []);

  const connectBank = useCallback(() => {
    showToast('Opening bank connection...', 'info');
    setTimeout(() => {
      setUserProfile((prev) => ({ ...prev, bankConnected: true }));
      showToast('Bank account connected successfully!', 'success');
    }, 1500);
  }, [showToast]);

  const upgradeSubscription = useCallback(async (planId: string, addons: string[], options: UpgradeOptions = {}) => {
    const {
      billingCycle = 'monthly',
      paymentMethod = 'card',
      savedMethodId,
      autoRetry = true,
      rememberMethod = true,
    } = options;
    setIsCheckoutOpen(false);
    try {
      const backendPlan = uiPlanToBackend(planId);
      const userId = getUserId();

      // If user is selecting Pro from Free, start a trial (best-effort).
      if (backendPlan === 'pro' && !userProfile.subscription) {
        const trialResult = await apiFetchJson<{ success: boolean; subscription?: { plan?: string | null } }>('/api/v2/subscriptions/trial', {
          method: 'POST',
          body: { days: 14, userId },
        });
        setUserProfile((prev) => ({ ...prev, subscription: backendPlanToUi(trialResult?.subscription?.plan) }));
        showToast('14-day Pro trial activated.', 'success');
        return;
      }

      const result = await apiFetchJson<{ success: boolean; subscription?: { plan?: string | null } }>('/api/v2/subscriptions/upgrade', {
        method: 'POST',
        body: { plan: backendPlan, billingCycle, userId, addons, paymentMethod, savedMethodId, autoRetry, rememberMethod },
      });

      setUserProfile((prev) => ({ ...prev, subscription: backendPlanToUi(result?.subscription?.plan) }));
      const addonText = addons.length > 0 ? ` with ${addons.length} add-on(s)` : '';
      showToast(`Subscribed to ${planId}${addonText} (${billingCycle}).`, 'success');
    } catch (err) {
      console.error(err);
      showToast('Payment failed. Please try again.', 'error');
    }
  }, [showToast, userProfile.subscription]);

  const cancelSubscription = useCallback(async (reason?: string) => {
    try {
      const userId = getUserId();
      const result = await apiFetchJson<{ success: boolean; subscription?: { plan?: string | null } }>('/api/v2/subscriptions/cancel', {
        method: 'POST',
        body: { reason, userId },
      });
      setUserProfile((prev) => ({ ...prev, subscription: backendPlanToUi(result?.subscription?.plan) }));
      showToast('Subscription cancelled.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Cancel failed. Please retry.', 'error');
    }
  }, [showToast]);

  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  return (
    <AppContext.Provider
      value={{
        userProfile,
        products,
        apiConnected,
        isCheckoutOpen,
        showOnboarding,
        updateRole,
        completeOnboarding,
        openCheckout,
        closeCheckout,
        connectBank,
        upgradeSubscription,
        cancelSubscription,
        refreshSubscription,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
