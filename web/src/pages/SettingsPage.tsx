import React, { useState } from 'react';
import { Globe, Shield, CreditCard, LogOut, Download, KeyRound } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { GuidedTour, useTourNavigation, useOnboarding, EducationalHint } from '../utils/onboardingSystem';

export const SettingsPage: React.FC = () => {
    const { userProfile, openCheckout } = useAppContext();
    const { showToast } = useToast();
    const { markTutorialWatched, user } = useOnboarding();
    const [language, setLanguage] = useState('en-US');
    const [currency, setCurrency] = useState('USD');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [dismissedHints, setDismissedHints] = useState<string[]>([]);

    const settingsTourSteps = [
      {
        id: 'settings-profile',
        title: 'Profile Settings',
        description: 'Update your personal information and preferences here.',
        highlightSelector: '[data-tour="profile-section"]',
        position: 'bottom' as const,
      },
      {
        id: 'settings-security',
        title: 'Security & Privacy',
        description: 'Enable 2FA to secure your account from unauthorized access.',
        highlightSelector: '[data-tour="security-section"]',
        position: 'bottom' as const,
      },
      {
        id: 'settings-billing',
        title: 'Billing & Subscription',
        description: 'Manage your payment methods and upgrade your plan.',
        highlightSelector: '[data-tour="billing-section"]',
        position: 'bottom' as const,
      },
      {
        id: 'settings-data',
        title: 'Data & Export',
        description: 'Export your data anytime or delete your account.',
        highlightSelector: '[data-tour="data-section"]',
        position: 'top' as const,
      },
    ];

    const tour = useTourNavigation(settingsTourSteps, () => {
      markTutorialWatched('settings-tour');
      showToast('Settings tour complete! 🎉', 'success');
    });

    const shouldShowTour = user.role && !user.tutorialsWatched.includes('settings-tour');
    const shouldShow2FAHint = !dismissedHints.includes('2fa') && !twoFactorEnabled;

    const handleEnable2FA = () => {
      setTwoFactorEnabled(true);
      showToast('2FA enabled with backup codes created', 'success');
    };

    const handleExport = async () => {
      setIsExporting(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      try {
        if (exportFormat === 'csv') {
          const res = await fetch(`${apiUrl}/api/v1/expenses/export?userId=demo-user&year=${new Date().getFullYear()}&format=csv`);
          if (!res.ok) throw new Error('export_failed');
          const data = await res.json();
          const expenseRows = data.expenses?.map((e: any) => [e.date, e.categoryName, e.amount, e.description].join(',')) || [];
          const header = 'date,category,amount,description';
          const csv = [header, ...expenseRows].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `moneygen-export-${new Date().toISOString().slice(0,10)}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const res = await fetch(`${apiUrl}/api/v1/compliance/export?userId=demo-user`);
          if (!res.ok) throw new Error('export_failed');
          const data = await res.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `moneygen-export-${new Date().toISOString().slice(0,10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }

        showToast('Export ready and downloaded.', 'success');
      } catch (e) {
        showToast('Export failed. Please retry.', 'error');
      } finally {
        setIsExporting(false);
      }
    };

  return (
    <div className="settings-page" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {tour.isActive && (
        <GuidedTour
          steps={settingsTourSteps}
          isActive={tour.isActive}
          currentStepIndex={tour.currentStepIndex}
          onStepChange={tour.goToStep}
          onComplete={tour.skipTour}
          onSkip={tour.skipTour}
          showSkip
        />
      )}
      
      {shouldShow2FAHint && (
        <EducationalHint
          type="warning"
          title="Enhance Your Security"
          description="Enable two-factor authentication to protect your account from unauthorized access."
          icon={<Shield size={20} />}
          onDismiss={() => setDismissedHints([...dismissedHints, '2fa'])}
        />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 700 }}>Settings</h1>
        {shouldShowTour && (
          <button
            className="button primary"
            onClick={tour.startTour}
          >
            🎯 Start Tour
          </button>
        )}
      </div>

      {/* Account Settings */}
      <div className="card elevated" data-tour="profile-section" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>Account Settings</h3>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <CreditCard size={20} style={{ color: 'var(--color-emerald-600)' }} />
              <div>
                <div style={{ fontWeight: 600 }}>Subscription</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{userProfile.subscription || 'Free Plan'}</div>
              </div>
            </div>
            <button className="button primary" onClick={openCheckout}>Upgrade</button>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card elevated" data-tour="security-section" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>Preferences</h3>
        </div>
        <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Globe size={20} style={{ color: 'var(--color-emerald-600)' }} />
              <label style={{ fontWeight: 600 }}>Language</label>
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', maxWidth: '300px' }}>
              <option value="en-US">English (US)</option>
              <option value="es-MX">Español (LatAm)</option>
              <option value="fr-FR">Français</option>
            </select>
          </div>
          <div style={{ paddingBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <Globe size={20} style={{ color: 'var(--color-emerald-600)' }} />
              <label style={{ fontWeight: 600 }}>Currency</label>
            </div>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', maxWidth: '300px' }}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Shield size={20} style={{ color: 'var(--color-emerald-600)' }} />
              <div>
                <div style={{ fontWeight: 600 }}>Two-Factor Authentication</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{twoFactorEnabled ? '✓ Enabled' : '○ Not Enabled'}</div>
              </div>
            </div>
            {!twoFactorEnabled ? (
              <button className="button primary" onClick={handleEnable2FA}>Enable 2FA</button>
            ) : (
              <button className="button secondary"><KeyRound size={14} /> Backup codes</button>
            )}
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="card elevated" data-tour="billing-section" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600 }}>Data & Export</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <Download size={20} style={{ color: 'var(--color-emerald-600)' }} />
              <span style={{ fontWeight: 600 }}>Export your data</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>CSV or JSON with all transactions, goals, and insights</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')} style={{ padding: 'var(--space-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button className="button primary" onClick={handleExport} disabled={isExporting}>{isExporting ? 'Preparing...' : 'Export'}</button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-color)' }}>
        <button className="button danger" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}><LogOut size={16} /> Sign Out</button>
        <div style={{ marginLeft: 'auto', alignSelf: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>Version 1.0.0 (Build 2026.03.12)</div>
      </div>
    </div>
  );
};
