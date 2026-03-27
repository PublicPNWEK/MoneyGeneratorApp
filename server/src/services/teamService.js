/**
 * Team Service (V2)
 * In-memory team management for demo/staging.
 *
 * NOTE: For production, swap this to a database-backed implementation.
 */

const ALLOWED_ROLES = ['Owner', 'Manager', 'Contributor', 'Viewer'];

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

class TeamService {
  constructor() {
    this.teamsById = new Map();
    this.userIdToTeamId = new Map();
  }

  ensureTeamForUser(userId) {
    const existingTeamId = this.userIdToTeamId.get(userId);
    if (existingTeamId && this.teamsById.has(existingTeamId)) {
      return this.teamsById.get(existingTeamId);
    }

    const teamId = `team_${userId}`;
    const ownerMemberId = `member_${userId}`;

    const team = {
      teamId,
      plan: 'Enterprise',
      createdAt: nowIso(),
      members: [
        {
          id: ownerMemberId,
          name: userId,
          role: 'Owner',
          email: `${userId}@example.com`,
          permissions: ['Admin', 'Payouts'],
          contribution: 0,
        },
      ],
      pendingInvites: [],
      sharedWallet: {
        enabled: true,
        balance: 4250,
        budgetUsed: 0.48,
      },
      auditLog: [
        { id: makeId('audit'), action: 'Team created', date: nowIso() },
      ],
    };

    this.teamsById.set(teamId, team);
    this.userIdToTeamId.set(userId, teamId);
    return team;
  }

  getTeam(userId) {
    return this.ensureTeamForUser(userId);
  }

  listRoles() {
    return ALLOWED_ROLES;
  }

  getRequesterRole(team, userId) {
    const requester = team.members.find((m) => m.id === `member_${userId}` || m.email === `${userId}@example.com` || m.name === userId);
    return requester?.role || 'Viewer';
  }

  canManageMembers(role) {
    return role === 'Owner' || role === 'Manager';
  }

  inviteMember(userId, email, role = 'Viewer') {
    const team = this.ensureTeamForUser(userId);
    const requesterRole = this.getRequesterRole(team, userId);

    if (!this.canManageMembers(requesterRole)) {
      const err = new Error('forbidden');
      err.code = 'forbidden';
      throw err;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      const err = new Error('invalid_email');
      err.code = 'invalid_email';
      throw err;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      const err = new Error('invalid_role');
      err.code = 'invalid_role';
      throw err;
    }

    if (team.pendingInvites.includes(email)) {
      return { teamId: team.teamId, email, role, status: 'already_pending' };
    }

    team.pendingInvites.unshift(email);
    team.auditLog.unshift({ id: makeId('audit'), action: `Invited ${email} (${role})`, date: nowIso() });

    return {
      teamId: team.teamId,
      email,
      role,
      status: 'pending',
      invitedAt: nowIso(),
    };
  }

  addMemberFromInvite(userId, email, name) {
    const team = this.ensureTeamForUser(userId);
    const idx = team.pendingInvites.indexOf(email);
    if (idx === -1) {
      const err = new Error('invite_not_found');
      err.code = 'invite_not_found';
      throw err;
    }

    const id = makeId('member');
    const member = {
      id,
      name: name || email.split('@')[0],
      role: 'Viewer',
      email,
      permissions: ['View'],
      contribution: 0,
    };

    team.members.push(member);
    team.pendingInvites.splice(idx, 1);
    team.auditLog.unshift({ id: makeId('audit'), action: `Accepted invite: ${email}`, date: nowIso() });

    return member;
  }

  updateMemberRole(userId, memberId, role) {
    const team = this.ensureTeamForUser(userId);
    const requesterRole = this.getRequesterRole(team, userId);

    if (!this.canManageMembers(requesterRole)) {
      const err = new Error('forbidden');
      err.code = 'forbidden';
      throw err;
    }

    if (!ALLOWED_ROLES.includes(role)) {
      const err = new Error('invalid_role');
      err.code = 'invalid_role';
      throw err;
    }

    const member = team.members.find((m) => m.id === memberId);
    if (!member) {
      const err = new Error('member_not_found');
      err.code = 'member_not_found';
      throw err;
    }

    if (member.role === 'Owner') {
      const err = new Error('cannot_modify_owner');
      err.code = 'cannot_modify_owner';
      throw err;
    }

    if (role === 'Owner' && requesterRole !== 'Owner') {
      const err = new Error('only_owner_can_assign_owner');
      err.code = 'forbidden';
      throw err;
    }

    member.role = role;
    member.permissions = this.permissionsForRole(role);
    team.auditLog.unshift({ id: makeId('audit'), action: `Changed ${member.email} role to ${role}`, date: nowIso() });

    return member;
  }

  removeMember(userId, memberId) {
    const team = this.ensureTeamForUser(userId);
    const requesterRole = this.getRequesterRole(team, userId);

    if (!this.canManageMembers(requesterRole)) {
      const err = new Error('forbidden');
      err.code = 'forbidden';
      throw err;
    }

    const member = team.members.find((m) => m.id === memberId);
    if (!member) {
      const err = new Error('member_not_found');
      err.code = 'member_not_found';
      throw err;
    }

    if (member.role === 'Owner') {
      const err = new Error('cannot_remove_owner');
      err.code = 'cannot_remove_owner';
      throw err;
    }

    team.members = team.members.filter((m) => m.id !== memberId);
    team.auditLog.unshift({ id: makeId('audit'), action: `Removed member ${member.email}`, date: nowIso() });

    return { removed: true };
  }

  setSharedWalletEnabled(userId, enabled) {
    const team = this.ensureTeamForUser(userId);
    const requesterRole = this.getRequesterRole(team, userId);

    if (!this.canManageMembers(requesterRole)) {
      const err = new Error('forbidden');
      err.code = 'forbidden';
      throw err;
    }

    team.sharedWallet.enabled = Boolean(enabled);
    team.auditLog.unshift({ id: makeId('audit'), action: `${team.sharedWallet.enabled ? 'Enabled' : 'Disabled'} shared wallet`, date: nowIso() });

    return team.sharedWallet;
  }

  getAuditLog(userId, limit = 50) {
    const team = this.ensureTeamForUser(userId);
    return team.auditLog.slice(0, Math.max(1, Math.min(Number(limit) || 50, 200)));
  }

  permissionsForRole(role) {
    switch (role) {
      case 'Owner':
        return ['Admin', 'Payouts'];
      case 'Manager':
        return ['Approvals'];
      case 'Contributor':
        return ['Contribute'];
      case 'Viewer':
      default:
        return ['View'];
    }
  }
}

export const teamService = new TeamService();
