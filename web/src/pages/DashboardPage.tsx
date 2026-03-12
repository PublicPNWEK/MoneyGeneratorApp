import React from 'react';
import { Dashboard } from '../components/Dashboard';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
  const { userProfile, connectBank, openCheckout } = useAppContext();
  const { showToast } = useToast();

  return (
    <Dashboard
      earnings={userProfile.earnings}
      weeklyChange={userProfile.weeklyChange}
      bankConnected={userProfile.bankConnected}
      hasSubscription={!!userProfile.subscription}
      onConnectBank={connectBank}
      onUpgrade={openCheckout}
      onViewAnalytics={() => showToast('Analytics coming soon!', 'info')}
    />
  );
};
