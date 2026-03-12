import React from 'react';
import { Users, CheckCircle, TrendingUp, Gift } from 'lucide-react';
import './ReferralStats.css';

interface Stats {
  totalInvites: number;
  totalSignups: number;
  conversionRate: number;
  creditsEarned: number;
  shareStats: {
    whatsapp: number;
    twitter: number;
    email: number;
    sms: number;
    directLink: number;
  };
}

interface ReferralStatsProps {
  stats: Stats;
}

const ReferralStats: React.FC<ReferralStatsProps> = ({ stats }) => {
  const statCards = [
    {
      label: 'Invites Sent',
      value: stats.totalInvites,
      icon: Users,
      color: 'emerald',
      unit: 'people',
    },
    {
      label: 'Conversions',
      value: stats.totalSignups,
      icon: CheckCircle,
      color: 'green',
      unit: 'signups',
    },
    {
      label: 'Conversion Rate',
      value: stats.conversionRate,
      icon: TrendingUp,
      color: 'purple',
      unit: '%',
    },
    {
      label: 'Credits Earned',
      value: `$${stats.creditsEarned.toFixed(2)}`,
      icon: Gift,
      color: 'gold',
      unit: 'USD',
    },
  ];

  return (
    <div className="referral-stats">
      <h3 className="stats-title">Your Performance</h3>
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`stat-card stat-${stat.color}`}>
              <div className="stat-icon">
                <Icon size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-value">
                  {typeof stat.value === 'number'
                    ? stat.value.toLocaleString()
                    : stat.value}
                </div>
                <div className="stat-unit">{stat.unit}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Share Channel Breakdown */}
      <div className="referral-card">
        <h3 className="card-title">Share Distribution</h3>
        <div className="channel-stats">
          <div className="channel-item">
            <span className="channel-name">WhatsApp</span>
            <div className="channel-bar">
              <div
                className="channel-fill"
                style={{
                  width: `${Math.min((stats.shareStats.whatsapp / Math.max(...Object.values(stats.shareStats), 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <span className="channel-count">{stats.shareStats.whatsapp}</span>
          </div>

          <div className="channel-item">
            <span className="channel-name">Twitter</span>
            <div className="channel-bar">
              <div
                className="channel-fill"
                style={{
                  width: `${Math.min((stats.shareStats.twitter / Math.max(...Object.values(stats.shareStats), 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <span className="channel-count">{stats.shareStats.twitter}</span>
          </div>

          <div className="channel-item">
            <span className="channel-name">Email</span>
            <div className="channel-bar">
              <div
                className="channel-fill"
                style={{
                  width: `${Math.min((stats.shareStats.email / Math.max(...Object.values(stats.shareStats), 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <span className="channel-count">{stats.shareStats.email}</span>
          </div>

          <div className="channel-item">
            <span className="channel-name">SMS</span>
            <div className="channel-bar">
              <div
                className="channel-fill"
                style={{
                  width: `${Math.min((stats.shareStats.sms / Math.max(...Object.values(stats.shareStats), 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <span className="channel-count">{stats.shareStats.sms}</span>
          </div>

          <div className="channel-item">
            <span className="channel-name">Direct Link</span>
            <div className="channel-bar">
              <div
                className="channel-fill"
                style={{
                  width: `${Math.min((stats.shareStats.directLink / Math.max(...Object.values(stats.shareStats), 1)) * 100, 100)}%`,
                }}
              ></div>
            </div>
            <span className="channel-count">{stats.shareStats.directLink}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralStats;
