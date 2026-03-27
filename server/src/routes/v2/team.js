import express from 'express';
import { featureFlagsService } from '../../services/featureFlags.js';
import { teamService } from '../../services/teamService.js';

const router = express.Router();

function requireUserId(req, res) {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return null;
  }
  return String(userId);
}

function requireTeamEnabled(req, res, userId) {
  const enabled = featureFlagsService.isFeatureEnabled('TEAM_FEATURES', userId);
  if (!enabled) {
    res.status(403).json({ error: 'TEAM_FEATURES disabled' });
    return false;
  }
  return true;
}

// GET /api/v2/team?userId=...
router.get('/', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const team = teamService.getTeam(userId);
  res.json({
    teamId: team.teamId,
    plan: team.plan,
    members: team.members,
    pendingInvites: team.pendingInvites,
    sharedWallet: team.sharedWallet,
    createdAt: team.createdAt,
  });
});

// GET /api/v2/team/roles
router.get('/roles', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  res.json({ roles: teamService.listRoles() });
});

// GET /api/v2/team/audit?userId=...&limit=...
router.get('/audit', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const { limit } = req.query;
  const entries = teamService.getAuditLog(userId, limit);
  res.json({ entries });
});

// POST /api/v2/team/invite
router.post('/invite', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const { email, role } = req.body;

  try {
    const invite = teamService.inviteMember(userId, email, role);
    res.json({ invite });
  } catch (err) {
    const code = err?.code || 'error';
    if (code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (code === 'invalid_email') return res.status(400).json({ error: 'invalid_email' });
    if (code === 'invalid_role') return res.status(400).json({ error: 'invalid_role' });
    res.status(500).json({ error: 'invite_failed' });
  }
});

// POST /api/v2/team/invites/accept
router.post('/invites/accept', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email required' });
  }

  try {
    const member = teamService.addMemberFromInvite(userId, email, name);
    res.json({ member });
  } catch (err) {
    const code = err?.code || 'error';
    if (code === 'invite_not_found') return res.status(404).json({ error: 'invite_not_found' });
    res.status(500).json({ error: 'accept_invite_failed' });
  }
});

// PATCH /api/v2/team/members/:memberId/role
router.patch('/members/:memberId/role', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const { memberId } = req.params;
  const { role } = req.body;

  try {
    const member = teamService.updateMemberRole(userId, memberId, role);
    res.json({ member });
  } catch (err) {
    const code = err?.code || 'error';
    if (code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (code === 'invalid_role') return res.status(400).json({ error: 'invalid_role' });
    if (code === 'member_not_found') return res.status(404).json({ error: 'member_not_found' });
    if (code === 'cannot_modify_owner') return res.status(400).json({ error: 'cannot_modify_owner' });
    res.status(500).json({ error: 'role_update_failed' });
  }
});

// DELETE /api/v2/team/members/:memberId
router.delete('/members/:memberId', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const { memberId } = req.params;

  try {
    const result = teamService.removeMember(userId, memberId);
    res.json(result);
  } catch (err) {
    const code = err?.code || 'error';
    if (code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    if (code === 'member_not_found') return res.status(404).json({ error: 'member_not_found' });
    if (code === 'cannot_remove_owner') return res.status(400).json({ error: 'cannot_remove_owner' });
    res.status(500).json({ error: 'remove_failed' });
  }
});

// POST /api/v2/team/shared-wallet
router.post('/shared-wallet', (req, res) => {
  const userId = requireUserId(req, res);
  if (!userId) return;
  if (!requireTeamEnabled(req, res, userId)) return;

  const { enabled } = req.body;

  try {
    const sharedWallet = teamService.setSharedWalletEnabled(userId, enabled);
    res.json({ sharedWallet });
  } catch (err) {
    const code = err?.code || 'error';
    if (code === 'forbidden') return res.status(403).json({ error: 'forbidden' });
    res.status(500).json({ error: 'shared_wallet_update_failed' });
  }
});

export default router;
