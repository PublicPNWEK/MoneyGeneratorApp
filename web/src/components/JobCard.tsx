import React from 'react';
import { Job } from '../data/mockJobs';
import { MapPin, DollarSign, Clock, Building, Star, Sparkles, ShieldCheck } from 'lucide-react';
import './JobCard.css';

interface JobCardProps {
  job: Job;
  status?: 'saved' | 'applied' | null;
  onApply: (job: Job) => void;
  onSave: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, status, onApply, onSave }) => {
  return (
    <div className="job-card">
      <div className="job-header">
        <div>
          <h3 className="job-title">{job.title}
          {job.urgency === 'high' && <span className="urgency-badge urgency-high">URGENT</span>}
          </h3>
          <p className="job-company"> <Building size={14} className="inline-block" /> {job.company}</p>
          <div className="job-meta">
            {job.rating && (
              <span className="meta-item"><Star size={14} /> {job.rating.toFixed(1)}</span>
            )}
            {job.responseTime && (
              <span className="meta-item"><Clock size={14} /> {job.responseTime}</span>
            )}
            {job.verified && (
              <span className="meta-item verified"><ShieldCheck size={14} /> Verified</span>
            )}
          </div>
        </div>
        <div className="job-pay">
          <DollarSign size={16} className="inline-block" />
          {job.pay.amount}/{job.pay.unit}
        </div>
      </div>
      
      <div className="job-details">
        {job.location.distance && (
          <div className="detail-item">
            <MapPin size={16} />
            <span>{job.location.distance} ({job.location.city})</span>
          </div>
        )}
        <div className="detail-item">
          <Clock size={16} />
          <span>Posted {new Date(job.postedAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="job-tags">
        {job.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>

      {job.perks && (
        <div className="job-perks">
          {job.perks.map((perk) => (
            <span key={perk} className="perk-chip"><Sparkles size={14} /> {perk}</span>
          ))}
        </div>
      )}

      {job.shifts && <div className="job-shift">{job.shifts}</div>}

      <div className="job-actions">
        <button
          type="button"
          className={`btn-outline ${status === 'saved' ? 'is-active' : ''}`}
          onClick={() => onSave(job)}
        >
          {status === 'saved' ? 'Saved' : 'Save'}
        </button>
        <button
          type="button"
          className={`btn-apply ${status === 'applied' ? 'is-active' : ''}`}
          onClick={() => onApply(job)}
        >
          {status === 'applied' ? 'Applied' : 'Apply'}
        </button>
      </div>
    </div>
  );
};
