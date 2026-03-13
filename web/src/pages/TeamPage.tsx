import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Shield, Wallet, BarChart3, Crown } from 'lucide-react';
import { useToast } from '../components/Toast';
import './TeamPage.css';

export const TeamPage: React.FC = () => {
  const { showToast } = useToast();
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [sharedWalletEnabled, setSharedWalletEnabled] = useState(true);
  const [members, setMembers] = useState<Array<{ id: string; name: string; role: string; email: string; permissions: string[]; contribution: number }>>([]);

  // --- Team Plan Management Enhancements ---
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Viewer');
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const [teamPlan, setTeamPlan] = useState('Enterprise');
  const [teamBudget, setTeamBudget] = useState(4250);
  const [teamBudgetUsed, setTeamBudgetUsed] = useState(0.48); // 48%
  const [auditLog, setAuditLog] = useState([
    { id: 1, action: 'Invited Sam', date: '2026-03-10' },
    { id: 2, action: 'Changed Alex role to Manager', date: '2026-03-09' },
    { id: 3, action: 'Enabled shared wallet', date: '2026-03-08' },
  ]);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const userId = 'demo-user';

  const refreshTeam = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v2/team?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('team_fetch_failed');
      const data = await res.json();

      setTeamPlan(data.plan || 'Enterprise');
      setMembers(Array.isArray(data.members) ? data.members : []);
      setPendingInvites(Array.isArray(data.pendingInvites) ? data.pendingInvites : []);
      const sharedWallet = data.sharedWallet || {};
      setSharedWalletEnabled(Boolean(sharedWallet.enabled));
      if (typeof sharedWallet.balance === 'number') setTeamBudget(sharedWallet.balance);
      if (typeof sharedWallet.budgetUsed === 'number') setTeamBudgetUsed(sharedWallet.budgetUsed);
    } catch {
      showToast('Unable to load team data. Using local defaults.', 'error');
    }
  };

  const refreshAudit = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/v2/team/audit?userId=${encodeURIComponent(userId)}&limit=25`);
      if (!res.ok) throw new Error('audit_fetch_failed');
      const data = await res.json();
      const entries = Array.isArray(data.entries) ? data.entries : [];
      setAuditLog(entries.map((e: any, idx: number) => ({ id: e.id || idx, action: e.action, date: (e.date || '').slice(0, 10) })));
    } catch {
      // Keep existing local audit log if API fails
    }
  };

  useEffect(() => {
    refreshTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showAuditLog) {
      refreshAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAuditLog]);

  const tasks = useMemo(() => ([
    { id: 't1', title: 'Upload receipts', owner: 'Sam', due: 'Today', status: 'In Progress' },
    { id: 't2', title: 'Verify payouts', owner: 'Keith', due: 'Tomorrow', status: 'Pending' },
    { id: 't3', title: 'Tag expenses', owner: 'Alex', due: 'Friday', status: 'Pending' },
  ]), []);

  const handleInvite = () => {
    if (!newMemberEmail) return;

    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/v2/team/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, email: newMemberEmail, role: selectedRole }),
        });
        if (!res.ok) throw new Error('invite_failed');

        setNewMemberEmail('');
        showToast(`Invite sent with ${selectedRole} access`, 'success');
        await refreshTeam();
        if (showAuditLog) await refreshAudit();
      } catch {
        showToast('Invite failed. Please retry.', 'error');
      }
    })();
  };

  const toggleSharedWallet = () => {
    (async () => {
      const nextEnabled = !sharedWalletEnabled;
      try {
        const res = await fetch(`${apiUrl}/api/v2/team/shared-wallet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, enabled: nextEnabled }),
        });
        if (!res.ok) throw new Error('shared_wallet_failed');
        setSharedWalletEnabled(nextEnabled);
        showToast(nextEnabled ? 'Shared wallet enabled' : 'Shared wallet paused', 'info');
        if (showAuditLog) await refreshAudit();
      } catch {
        showToast('Unable to update shared wallet. Please retry.', 'error');
      }
    })();
  };

  return (
    <div className="team-page">
      {/* Team Plan Management */}
      <div className="card elevated team-card team-plan-card">
        <div className="settings-section-header">
          <h3>Team Plan & Management</h3>
        </div>
        <div className="team-plan-row">
          <span>Current Plan: <strong>{teamPlan}</strong></span>
          <button className="btn-secondary team-plan-manage">Manage Plan</button>
        </div>
        <div className="team-budget-row">
          <span>Team Budget: <strong>${teamBudget.toLocaleString()}</strong></span>
          <span className="team-budget-used">Used: <strong>{Math.round(teamBudgetUsed * 100)}%</strong></span>
        </div>
      </div>
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
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="role-select"
            aria-label="Invite role"
          >
            <option value="Viewer">Viewer</option>
            <option value="Contributor">Contributor</option>
            <option value="Manager">Manager</option>
          </select>
          <button className="btn-primary-sm" onClick={handleInvite}>
            <Plus size={16} /> Invite
          </button>
        </div>
        {pendingInvites.length > 0 && (
          <div className="pending-invites">
            <strong>Pending Invites:</strong> {pendingInvites.join(', ')}
          </div>
        )}
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
                <select
                  value={member.role}
                  aria-label={`Role for ${member.name}`}
                  onChange={e => {
                    const nextRole = e.target.value;
                    (async () => {
                      try {
                        const res = await fetch(`${apiUrl}/api/v2/team/members/${encodeURIComponent(member.id)}/role`, {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ userId, role: nextRole }),
                        });
                        if (!res.ok) throw new Error('role_update_failed');
                        setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: nextRole } : m));
                        showToast(`Updated ${member.name} to ${nextRole}`, 'success');
                        if (showAuditLog) await refreshAudit();
                      } catch {
                        showToast('Role update failed. Please retry.', 'error');
                        await refreshTeam();
                      }
                    })();
                  }}
                  className="role-select"
                  disabled={member.role === 'Owner'}
                >
                  <option value="Owner">Owner</option>
                  <option value="Manager">Manager</option>
                  <option value="Contributor">Contributor</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="team-card">
          <div className="card-header"><Wallet size={18} /> Shared Wallet</div>
          <div className="wallet-balance">${teamBudget.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
          <p className="muted">Used for mileage reimbursements and team expenses.</p>
          <div className="toggle-row">
            <label>
              <input type="checkbox" checked={sharedWalletEnabled} onChange={toggleSharedWallet} /> Enable shared payouts
            </label>
            <button className="btn-link">View ledger</button>
          </div>
          <div className="progress-row">
            <span>Budget used</span>
            <progress className="progress-track" value={Math.round(teamBudgetUsed * 100)} max={100} />
            <span className="muted">{Math.round(teamBudgetUsed * 100)}%</span>
          </div>
        </div>

        <div className="team-card">
          <div className="card-header"><Shield size={18} /> Access Control</div>
          <ul className="permission-list">
            <li><strong>Admin</strong> — payouts, invites, exports</li>
            <li><strong>Manager</strong> — approve expenses, schedule tasks</li>
            <li><strong>Viewer</strong> — read-only dashboards</li>
          </ul>
          <button className="btn-secondary" onClick={() => setShowAuditLog(v => !v)}>{showAuditLog ? 'Hide' : 'Show'} Audit Log</button>
          {showAuditLog && (
            <div className="audit-log">
              <h5>Audit Log</h5>
              <ul>
                {auditLog.map((entry) => (
                  <li key={entry.id}>{entry.date}: {entry.action}</li>
                ))}
              </ul>
            </div>
          )}
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
