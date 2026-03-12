import React, { useState, useEffect } from 'react';
import { Share2, Users, TrendingUp, Gift, MessageCircle } from 'lucide-react';
import './ReferralPage.css';
import ReferralCard from '../components/ReferralCard';
import ReferralStats from '../components/ReferralStats';
import ReferralLeaderboard from '../components/ReferralLeaderboard';
import ShareButtons from '../components/ShareButtons';

interface ReferralData {
  code: string;
  stats: {
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
  };
}

const ReferralPage: React.FC = () => {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
    fetchLeaderboard();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/v2/referrals/me', {
        headers: {
          'x-user-id': localStorage.getItem('userId') || 'demo-user',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setReferralData(data);
      } else {
        throw new Error('API unavailable');
      }
    } catch (error) {
      console.warn('Failed to fetch referral data, using mock:', error);
      // Fallback mock data
      setReferralData({
        code: 'MONEYGEN2026',
        stats: {
          totalInvites: 12,
          totalSignups: 4,
          conversionRate: 0.33,
          creditsEarned: 100,
          shareStats: {
            whatsapp: 5,
            twitter: 3,
            email: 2,
            sms: 2,
            directLink: 0,
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/v2/referrals/leaderboard?limit=10');
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.data || []);
      } else {
        throw new Error('API unavailable');
      }
    } catch (error) {
      console.warn('Failed to fetch leaderboard:', error);
      // Fallback mock data
      setLeaderboard([
        { rank: 1, user: 'Sarah K.', score: 450, avatar: null },
        { rank: 2, user: 'Mike R.', score: 380, avatar: null },
        { rank: 3, user: 'Priya D.', score: 320, avatar: null },
        { rank: 4, user: 'You', score: 100, avatar: null, isCurrentUser: true },
        { rank: 5, user: 'James L.', score: 80, avatar: null },
      ]);
    }
  };

  const handleCopyCode = () => {
    if (referralData?.code) {
      navigator.clipboard.writeText(referralData.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTrackShare = async (channel: string) => {
    if (!referralData?.code) return;
    try {
      await fetch('/api/v2/referrals/track-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: referralData.code, channel }),
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };

  if (loading) {
    return <div className="referral-loading">Loading referral program...</div>;
  }

  return (
    <div className="referral-page">
      {/* Hero Section */}
      <div className="referral-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Gift size={16} />
            <span>Earn Rewards</span>
          </div>
          <h1>Invite Friends, Earn Money</h1>
          <p>Share your referral code and earn $5 for every friend who signs up</p>
        </div>
        <div className="hero-decoration">
          <div className="decoration-circle cyan"></div>
          <div className="decoration-circle purple"></div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="referral-grid">
        {/* Left Column: Referral Code & Stats */}
        <div className="referral-col left">
          {referralData && (
            <>
              {/* Referral Code Card */}
              <ReferralCard
                code={referralData.code}
                onCopy={handleCopyCode}
                copied={copied}
              />

              {/* Stats Cards */}
              <ReferralStats stats={referralData.stats} />

              {/* Share Section */}
              <div className="referral-card">
                <h3 className="card-title">Share Your Code</h3>
                <p className="card-subtitle">
                  Choose how you want to share your referral code
                </p>
                <ShareButtons
                  code={referralData.code}
                  onShare={handleTrackShare}
                />
              </div>
            </>
          )}
        </div>

        {/* Right Column: Leaderboard & Info */}
        <div className="referral-col right">
          {/* Leaderboard */}
          <ReferralLeaderboard data={leaderboard} />

          {/* Information Card */}
          <div className="referral-card info-card">
            <h3 className="card-title">How It Works</h3>
            <div className="info-list">
              <div className="info-item">
                <div className="info-number">1</div>
                <div className="info-text">
                  <strong>Share Your Code</strong>
                  <p>Send your unique referral code to friends</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-number">2</div>
                <div className="info-text">
                  <strong>They Sign Up</strong>
                  <p>Your friend creates an account using your code</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-number">3</div>
                <div className="info-text">
                  <strong>You Earn $5</strong>
                  <p>Get $5 credit instantly when they complete signup</p>
                </div>
              </div>
              <div className="info-item">
                <div className="info-number">4</div>
                <div className="info-text">
                  <strong>They Get $2.50</strong>
                  <p>Your friend receives a $2.50 welcome bonus</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits Card */}
          <div className="referral-card benefits-card">
            <h3 className="card-title">Referral Benefits</h3>
            <ul className="benefits-list">
              <li>
                <Users size={20} />
                <span>No limit on referrals</span>
              </li>
              <li>
                <TrendingUp size={20} />
                <span>Instant credit awards</span>
              </li>
              <li>
                <MessageCircle size={20} />
                <span>Track share analytics</span>
              </li>
              <li>
                <Share2 size={20} />
                <span>Share on 5+ platforms</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralPage;
