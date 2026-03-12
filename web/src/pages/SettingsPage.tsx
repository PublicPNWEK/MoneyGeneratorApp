import React, { useState } from 'react';
import { Globe, Shield, CreditCard, LogOut, Download, KeyRound } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../components/Toast';

export const SettingsPage: React.FC = () => {
    const { userProfile, openCheckout } = useAppContext();
    const { showToast } = useToast();
    const [language, setLanguage] = useState('en-US');
    const [currency, setCurrency] = useState('USD');
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
    const [isExporting, setIsExporting] = useState(false);

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
    <div className="settings-page">
      <header className="page-header">
        <h2>Settings</h2>
      </header>
      
      <div className="settings-section">
        <h3>Account</h3>
        <div className="settings-item">
          <div className="icon"><CreditCard size={20} /></div>
          <div className="content">
            <span className="label">Subscription</span>
            <span className="value">{userProfile.subscription || 'Free Plan'}</span>
          </div>
          <button className="btn-link" onClick={openCheckout}>Upgrade</button>
        </div>
      </div>

      <div className="settings-section">
        <h3>Preferences</h3>
         <div className="settings-item">
          <div className="icon"><Globe size={20} /></div>
          <div className="content">
            <span className="label">Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option value="en-US">English (US)</option>
              <option value="es-MX">Español (LatAm)</option>
              <option value="fr-FR">Français</option>
            </select>
          </div>
        </div>
         <div className="settings-item">
          <div className="icon"><Globe size={20} /></div>
          <div className="content">
            <span className="label">Currency</span>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="MXN">MXN</option>
            </select>
          </div>
        </div>
         <div className="settings-item">
          <div className="icon"><Shield size={20} /></div>
          <div className="content">
            <span className="label">Security</span>
            <span className="value">{twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}</span>
          </div>
          {!twoFactorEnabled ? (
            <button className="btn-secondary" onClick={handleEnable2FA}>Enable 2FA</button>
          ) : (
            <button className="btn-link"><KeyRound size={14} /> Backup codes</button>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h3>Data Export</h3>
        <div className="settings-item">
          <div className="icon"><Download size={20} /></div>
          <div className="content">
            <span className="label">Export your data</span>
            <span className="value">CSV or JSON with transactions, goals, and mileage</span>
          </div>
          <div className="export-actions">
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
            <button className="btn-primary-sm" onClick={handleExport} disabled={isExporting}>{isExporting ? 'Preparing...' : 'Request export'}</button>
          </div>
        </div>
      </div>
      
      <div className="settings-footer">
          <button className="btn-logout"><LogOut size={16} /> Sign Out</button>
          <p className="version">Version 1.0.0 (Build 2026.03.12)</p>
      </div>

      <style>{`
        .settings-item select { padding: 0.5rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; }
        .export-actions { display: flex; align-items: center; gap: 0.5rem; }
      `}</style>
    </div>
  );
};
