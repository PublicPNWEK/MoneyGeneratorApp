import React from 'react';
import { Briefcase, Search, Filter } from 'lucide-react';

export const JobsPage: React.FC = () => {
  return (
    <div className="jobs-page">
      <header className="page-header">
        <h2>Find Jobs</h2>
        <div className="actions">
          <button className="btn-icon"><Search size={20} /></button>
          <button className="btn-icon"><Filter size={20} /></button>
        </div>
      </header>
      
      <div className="empty-state">
        <Briefcase size={48} className="text-gray-400" />
        <h3>No jobs found nearby</h3>
        <p>Try expanding your search radius or update your filters.</p>
        <button className="btn-primary mt-4">Update Preferences</button>
      </div>
    </div>
  );
};
