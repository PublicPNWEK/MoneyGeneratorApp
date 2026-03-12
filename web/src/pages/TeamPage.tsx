import React, { useMemo, useState } from 'react';
import { Users, Plus, Shield, Wallet, BarChart3, Crown } from 'lucide-react';
import { useToast } from '../components/Toast';
import './TeamPage.css';

export const TeamPage: React.FC = () => {
  const { showToast } = useToast();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [sharedWalletEnabled, setSharedWalletEnabled] = useState(true);
  const [members, setMembers] = useState([
    { id: '1', name: 'Keith', role: 'Owner', email: 'keith@moneygen.app', permissions: ['Admin', 'Payouts'], contribution: 62 },
    { id: '2', name: 'Sam', role: 'Manager', email: 'sam@crew.app', permissions: ['Approvals'], contribution: 24 },
    { id: '3', name: 'Alex', role: 'Contributor', email: 'alex@tasks.io', permissions: ['View'], contribution: 14 },
  ]);

  const tasks = useMemo(() => ([
    { id: 't1', title: 'Upload receipts', owner: 'Sam', due: 'Today', status: 'In Progress' },
    { id: 't2', title: 'Verify payouts', owner: 'Keith', due: 'Tomorrow', status: 'Pending' },
    { id: 't3', title: 'Tag expenses', owner: 'Alex', due: 'Friday', status: 'Pending' },
  ]), []);

  const handleInvite = () => {
    if (!newMemberEmail) return;
    const id = `member_${Date.now()}`;
    setMembers((prev) => [...prev, { id, name: newMemberEmail.split('@')[0], role: 'Viewer', email: newMemberEmail, permissions: ['View'], contribution: 0 }]);
    setNewMemberEmail('');
    showToast('Invite sent with viewer access', 'success');
  };

  const toggleSharedWallet = () => {
    setSharedWalletEnabled((prev) => !prev);
    showToast(!sharedWalletEnabled ? 'Shared wallet enabled' : 'Shared wallet paused', 'info');
  };

  return (
    <div className="team-page">
      <header className="page-header">
        <h2>My Team</h2>
        <div className="header-actions">
          <input
            type="email"
            placeholder="Invite by email"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            className="invite-input"
          />
          <button className="btn-primary-sm" onClick={handleInvite}>
            <Plus size={16} /> Invite
          </button>
        </div>
      </header>

      <div className="team-grid">
        <div className="team-card">
          <div className="card-header"><Users size={18} /> Members</div>
          <div className="member-list">
            {members.map((member) => (
              <div key={member.id} className="member-row">
                <div>
                  <div className="member-name">{member.name} {member.role === 'Owner' && <Crown size={14} />}</div>
                  <div className="member-email">{member.email}</div>
                  <div className="member-perms">{member.permissions.join(', ')}</div>
                </div>
                <span className="badge">{member.role}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="team-card">
          <div className="card-header"><Wallet size={18} /> Shared Wallet</div>
          <div className="wallet-balance">$4,250.00</div>
          <p className="muted">Used for mileage reimbursements and team expenses.</p>
          <div className="toggle-row">
            <label>
              <input type="checkbox" checked={sharedWalletEnabled} onChange={toggleSharedWallet} /> Enable shared payouts
            </label>
            <button className="btn-link">View ledger</button>
          </div>
          <div className="progress-row">
            <span>Budget used</span>
            <div className="progress-track"><div className="progress-fill" style={{ width: '48%' }} /></div>
            <span className="muted">48%</span>
          </div>
        </div>

        <div className="team-card">
          <div className="card-header"><Shield size={18} /> Access Control</div>
          <ul className="permission-list">
            <li><strong>Admin</strong> — payouts, invites, exports</li>
            <li><strong>Manager</strong> — approve expenses, schedule tasks</li>
            <li><strong>Viewer</strong> — read-only dashboards</li>
          </ul>
          <button className="btn-secondary">Review roles</button>
        </div>

        <div className="team-card">
          <div className="card-header"><BarChart3 size={18} /> Team Insights</div>
          <div className="insight-row">
            <span>Shared earnings</span>
            <strong>$9,420</strong>
          </div>
          <div className="insight-row">
            <span>Tasks on track</span>
            <strong>5/6</strong>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.id} className="task-row">
                <div>
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">{task.owner} • {task.due}</div>
                </div>
                <span className="badge muted">{task.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
