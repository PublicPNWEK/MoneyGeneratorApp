import request from 'supertest';
import express from 'express';
import v2Routes from '../routes/v2';

// Create a test Express app
const app = express();
app.use(express.json());
app.use('/api/v2', v2Routes);

describe('V2 API Routes - Feature Flags', () => {
  it('GET /features/flags - returns user feature flags', async () => {
    const res = await request(app)
      .get('/api/v2/features/flags')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('flags');
    expect(res.body.flags).toHaveProperty('ONBOARDING_V2');
    expect(res.body.flags).toHaveProperty('JOB_MARKETPLACE');
  });

  it('GET /features/flags - returns 400 without userId', async () => {
    const res = await request(app).get('/api/v2/features/flags');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /features/flags/:featureKey - returns specific feature status', async () => {
    const res = await request(app)
      .get('/api/v2/features/flags/JOB_MARKETPLACE')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('feature');
    expect(res.body).toHaveProperty('enabled');
    expect(res.body.enabled).toEqual(expect.any(Boolean));
  });
});

describe('V2 API Routes - Export & Data', () => {
  it('GET /export/summary - returns export summary', async () => {
    const res = await request(app)
      .get('/api/v2/export/summary')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('availableExports');
    expect(res.body.availableExports).toEqual(expect.any(Array));
    expect(res.body).toHaveProperty('totalRecords');
  });

  it('GET /export/summary - returns 400 without userId', async () => {
    const res = await request(app).get('/api/v2/export/summary');
    expect(res.status).toBe(400);
  });

  it('POST /export/request - creates export request', async () => {
    const res = await request(app)
      .post('/api/v2/export/request')
      .send({
        userId: 'user123',
        exportType: 'earnings',
        format: 'csv',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exportId');
    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('processing');
  });

  it('POST /export/request - returns 400 without required fields', async () => {
    const res = await request(app)
      .post('/api/v2/export/request')
      .send({ userId: 'user123' });

    expect(res.status).toBe(400);
  });

  it('GET /export/:exportId - returns export status', async () => {
    const res = await request(app)
      .get('/api/v2/export/exp_12345')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exportId');
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('downloadUrl');
  });
});

describe('V2 API Routes - Job Marketplace', () => {
  it('GET /jobs/metadata - returns job marketplace metadata', async () => {
    const res = await request(app).get('/api/v2/jobs/metadata');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
    expect(res.body).toHaveProperty('sortOptions');
    expect(res.body).toHaveProperty('filters');
  });

  it('GET /jobs/recommended - returns recommended jobs', async () => {
    const res = await request(app)
      .get('/api/v2/jobs/recommended')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('recommendations');
    expect(res.body.recommendations).toEqual(expect.any(Array));
  });

  it('GET /jobs/recommended - returns 400 without userId', async () => {
    const res = await request(app).get('/api/v2/jobs/recommended');
    expect(res.status).toBe(400);
  });

  it('POST /jobs/:jobId/save - saves a job', async () => {
    const res = await request(app)
      .post('/api/v2/jobs/job_001/save')
      .send({ userId: 'user123', saved: true });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('jobId');
    expect(res.body).toHaveProperty('saved');
  });

  it('GET /jobs/saved - returns saved jobs', async () => {
    const res = await request(app)
      .get('/api/v2/jobs/saved')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('savedJobs');
    expect(res.body).toHaveProperty('totalSaved');
  });

  it('POST /jobs/alerts - creates job alert', async () => {
    const res = await request(app)
      .post('/api/v2/jobs/alerts')
      .send({
        userId: 'user123',
        name: 'High-Pay Delivery',
        filters: { minPay: 80, category: 'delivery' },
        channels: ['email'],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('alertId');
    expect(res.body).toHaveProperty('isActive');
  });

  it('GET /jobs/alerts - returns user job alerts', async () => {
    const res = await request(app)
      .get('/api/v2/jobs/alerts')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('alerts');
    expect(res.body.alerts).toEqual(expect.any(Array));
  });
});

describe('V2 API Routes - Advanced Analytics', () => {
  it('GET /analytics/summary - returns analytics summary', async () => {
    const res = await request(app)
      .get('/api/v2/analytics/summary')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary).toHaveProperty('totalEarnings');
    expect(res.body.summary).toHaveProperty('hourlyRate');
  });

  it('GET /analytics/breakdown - returns earnings breakdown', async () => {
    const res = await request(app)
      .get('/api/v2/analytics/breakdown')
      .query({ userId: 'user123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('breakdown');
  });

  it('GET /analytics/forecast - returns earnings forecast', async () => {
    const res = await request(app)
      .get('/api/v2/analytics/forecast')
      .query({ userId: 'user123', daysAhead: 30 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('forecast');
    expect(res.body.forecast).toEqual(expect.any(Array));
  });
});

describe('V2 API Routes - Team Features', () => {
  it('GET /team - returns team info when TEAM_FEATURES enabled', async () => {
    const res = await request(app)
      .get('/api/v2/team')
      .query({ userId: 'teamUserA' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('teamId');
    expect(res.body).toHaveProperty('plan');
    expect(res.body).toHaveProperty('members');
    expect(res.body.members).toEqual(expect.any(Array));
    expect(res.body).toHaveProperty('sharedWallet');
  });

  it('POST /team/invite + PATCH role + GET audit - works end-to-end', async () => {
    const userId = 'teamUserB';

    // Ensure team exists
    const teamRes = await request(app)
      .get('/api/v2/team')
      .query({ userId });
    expect(teamRes.status).toBe(200);

    // Invite
    const inviteRes = await request(app)
      .post('/api/v2/team/invite')
      .send({ userId, email: 'alex@example.com', role: 'Viewer' });
    expect(inviteRes.status).toBe(200);
    expect(inviteRes.body).toHaveProperty('invite');
    expect(inviteRes.body.invite).toHaveProperty('status');

    // Accept invite -> creates member
    const acceptRes = await request(app)
      .post('/api/v2/team/invites/accept')
      .send({ userId, email: 'alex@example.com', name: 'Alex' });
    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body).toHaveProperty('member');
    expect(acceptRes.body.member).toHaveProperty('id');

    // Update role
    const roleRes = await request(app)
      .patch(`/api/v2/team/members/${acceptRes.body.member.id}/role`)
      .send({ userId, role: 'Manager' });
    expect(roleRes.status).toBe(200);
    expect(roleRes.body).toHaveProperty('member');
    expect(roleRes.body.member.role).toBe('Manager');

    // Audit
    const auditRes = await request(app)
      .get('/api/v2/team/audit')
      .query({ userId, limit: 10 });
    expect(auditRes.status).toBe(200);
    expect(auditRes.body).toHaveProperty('entries');
    expect(auditRes.body.entries).toEqual(expect.any(Array));
    expect(auditRes.body.entries.length).toBeGreaterThan(0);
  });
});
