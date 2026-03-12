import React from 'react';
import { Trophy, Medal } from 'lucide-react';
import './ReferralLeaderboard.css';

interface LeaderboardItem {
  rank: number;
  userId: string;
  totalSignups: number;
  creditsEarned: number;
  avatar: string;
}

interface ReferralLeaderboardProps {
  data: LeaderboardItem[];
}

const ReferralLeaderboard: React.FC<ReferralLeaderboardProps> = ({ data }) => {
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={20} className="medal-gold" />;
    if (rank === 2) return <Medal size={20} className="medal-silver" />;
    if (rank === 3) return <Medal size={20} className="medal-bronze" />;
    return <span className="rank-number">#{rank}</span>;
  };

  return (
    <div className="referral-card leaderboard-card">
      <div className="leaderboard-header">
        <h3 className="card-title">
          <Trophy size={24} />
          Top Referrers
        </h3>
        <span className="leaderboard-period">This Month</span>
      </div>

      <div className="leaderboard-list">
        {data && data.length > 0 ? (
          data.map((item, index) => (
            <div key={index} className="leaderboard-item">
              <div className="leaderboard-rank">{getMedalIcon(item.rank)}</div>

              <div className="leaderboard-avatar">
                <img src={item.avatar} alt={item.userId} />
              </div>

              <div className="leaderboard-info">
                <div className="leaderboard-name">User {item.userId}</div>
                <div className="leaderboard-meta">
                  {item.totalSignups} referrals
                </div>
              </div>

              <div className="leaderboard-reward">
                <div className="reward-amount">${item.creditsEarned}</div>
                <div className="reward-label">earned</div>
              </div>
            </div>
          ))
        ) : (
          <div className="leaderboard-empty">
            <p>No referrals yet. Be the first!</p>
          </div>
        )}
      </div>

      <div className="leaderboard-footer">
        <p>🎁 Top 3 referrers get bonus rewards each month</p>
      </div>
    </div>
  );
};

export default ReferralLeaderboard;
