import React from 'react';
import { Users, Plus } from 'lucide-react';

export const TeamPage: React.FC = () => {
  return (
    <div className="team-page">
      <header className="page-header">
        <h2>My Team</h2>
        <button className="btn-primary-sm">
          <Plus size={16} /> Invite
        </button>
      </header>

      <div className="empty-state">
        <Users size={48} className="text-gray-400" />
        <h3>Collaborate with your crew</h3>
        <p>Invite friends or other gig workers to share shifts and earnings.</p>
        <button className="btn-secondary mt-4">Create a Team</button>
      </div>
    </div>
  );
};
