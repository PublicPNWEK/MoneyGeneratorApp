import React from 'react';
import { Globe, Shield, CreditCard, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const SettingsPage: React.FC = () => {
    const { userProfile, openCheckout } = useAppContext();

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
            <span className="value">English (US)</span>
          </div>
        </div>
         <div className="settings-item">
          <div className="icon"><Shield size={20} /></div>
          <div className="content">
            <span className="label">Security</span>
            <span className="value">2FA Disabled</span>
          </div>
        </div>
      </div>
      
      <div className="settings-footer">
          <button className="btn-logout"><LogOut size={16} /> Sign Out</button>
          <p className="version">Version 1.0.0 (Build 2026.03.12)</p>
      </div>
    </div>
  );
};
