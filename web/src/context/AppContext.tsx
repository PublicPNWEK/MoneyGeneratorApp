import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/Toast';

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
  upgradeSubscription: (planId: string, addons: string[]) => void;
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
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${apiUrl}/api/catalog`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setApiConnected(true);
        }
      }
    } catch {
      setApiConnected(false);
    }
  };

  const connectBank = useCallback(() => {
    showToast('Opening bank connection...', 'info');
    setTimeout(() => {
      setUserProfile((prev) => ({ ...prev, bankConnected: true }));
      showToast('Bank account connected successfully!', 'success');
    }, 1500);
  }, [showToast]);

  const upgradeSubscription = useCallback((planId: string, addons: string[]) => {
    setIsCheckoutOpen(false);
    setUserProfile((prev) => ({ ...prev, subscription: planId }));
    const addonText = addons.length > 0 ? ` with ${addons.length} add-on(s)` : '';
    showToast(`Subscribed to ${planId}${addonText}!`, 'success');
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
