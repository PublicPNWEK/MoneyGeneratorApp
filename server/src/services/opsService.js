import { Models } from '../models.js';
import { isDatabaseConnected, queryAll, queryOne } from '../database.js';

function nowIso() {
  return new Date().toISOString();
}

function mapIncident(row) {
  return {
    id: row.id,
    source: row.source,
    severity: row.severity,
    title: row.title,
    details: row.details || {},
    status: row.status,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    resolvedAt: row.resolved_at?.toISOString?.() || row.resolved_at || null,
  };
}

function mapAnnotation(row) {
  return {
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    author: row.author,
    note: row.note,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

function mapReplay(row) {
  const payload = row.payload || {};
  return {
    id: row.id,
    targetId: row.job_id,
    outcome: row.status,
    operator: payload.operator || 'system',
    details: payload.details || {},
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

function mapBackgroundJob(row) {
  return {
    id: row.id,
    jobKey: row.job_key,
    queueName: row.queue_name,
    status: row.status,
    attempts: row.attempts || 0,
    lastHeartbeatAt: row.last_heartbeat_at?.toISOString?.() || row.last_heartbeat_at || null,
    startedAt: row.started_at?.toISOString?.() || row.started_at || null,
    completedAt: row.completed_at?.toISOString?.() || row.completed_at || null,
    failureReason: row.failure_reason || null,
    metadata: row.metadata || {},
    createdAt: row.created_at?.toISOString?.() || row.created_at,
  };
}

async function listAnnotations(limit = 10) {
  if (isDatabaseConnected()) {
    const rows = await queryAll(
      `SELECT * FROM operator_annotations ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows.map(mapAnnotation);
  }

  return Models.operatorAnnotations.slice(0, limit);
}

async function listReplayOutcomes(limit = 10) {
  if (isDatabaseConnected()) {
    const rows = await queryAll(
      `SELECT * FROM outbound_webhook_deliveries ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return rows.map(mapReplay);
  }

  return Models.replayOutcomes.slice(0, limit);
}

async function listBackgroundJobs() {
  if (isDatabaseConnected()) {
    const rows = await queryAll(`SELECT * FROM background_jobs_ops ORDER BY created_at DESC`);
    return rows.map(mapBackgroundJob);
  }

  return Array.from(Models.backgroundJobs.values());
}

export const OpsService = {
  async listIncidents() {
    if (isDatabaseConnected()) {
      const rows = await queryAll(`SELECT * FROM incident_log ORDER BY created_at DESC`);
      return rows.map(mapIncident);
    }

    return [...Models.incidents].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async createIncident({ source, severity = 'warning', title, details = {} }) {
    const incident = {
      id: `inc_${Date.now()}`,
      source,
      severity,
      title,
      details,
      status: 'open',
      createdAt: nowIso(),
    };

    if (isDatabaseConnected()) {
      const row = await queryOne(
        `INSERT INTO incident_log (source, severity, title, details, status)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         RETURNING *`,
        [source, severity, title, JSON.stringify(details || {}), 'open']
      );
      return mapIncident(row);
    }

    Models.incidents.unshift(incident);
    return incident;
  },

  async annotate({ targetType, targetId, note, author }) {
    const annotation = {
      id: `note_${Date.now()}`,
      targetType,
      targetId,
      note,
      author,
      createdAt: nowIso(),
    };

    if (isDatabaseConnected()) {
      const row = await queryOne(
        `INSERT INTO operator_annotations (target_type, target_id, author, note)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [targetType, targetId, author, note]
      );
      return mapAnnotation(row);
    }

    Models.operatorAnnotations.unshift(annotation);
    return annotation;
  },

  async recordReplayOutcome({ targetId, outcome, operator, details = {} }) {
    const replay = {
      id: `replay_${Date.now()}`,
      targetId,
      outcome,
      operator,
      details,
      createdAt: nowIso(),
    };

    if (isDatabaseConnected()) {
      const row = await queryOne(
        `INSERT INTO outbound_webhook_deliveries (
           job_id,
           target_url,
           status,
           attempts,
           correlation_id,
           payload,
           error_class,
           error_message,
           last_attempt_at,
           delivered_at
         )
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, CURRENT_TIMESTAMP, $9)
         RETURNING *`,
        [
          targetId,
          details.targetUrl || 'unknown',
          outcome,
          Number(details.attempts || 0),
          details.correlationId || null,
          JSON.stringify({ operator, details }),
          details.errorClass || (outcome.includes('failed') ? outcome : null),
          details.error || details.message || null,
          outcome === 'delivered' || outcome === 'processed' ? new Date() : null,
        ]
      );
      return mapReplay(row);
    }

    Models.replayOutcomes.unshift(replay);
    return replay;
  },

  async updateBackgroundJob({ jobKey, queueName, status, metadata = {} }) {
    const existing = Models.backgroundJobs.get(jobKey) || {
      jobKey,
      queueName,
      createdAt: nowIso(),
      attempts: 0,
    };
    const next = {
      ...existing,
      queueName,
      status,
      metadata: { ...existing.metadata, ...metadata },
      lastHeartbeatAt: nowIso(),
      startedAt: status === 'running' ? existing.startedAt || nowIso() : existing.startedAt,
      completedAt: status === 'completed' ? nowIso() : existing.completedAt,
      attempts: status === 'retrying' ? (existing.attempts || 0) + 1 : existing.attempts || 0,
    };

    if (isDatabaseConnected()) {
      const current = await queryOne(`SELECT * FROM background_jobs_ops WHERE job_key = $1`, [jobKey]);
      const attempts = status === 'retrying'
        ? Number(current?.attempts || 0) + 1
        : Number(current?.attempts || 0);
      const row = await queryOne(
        `INSERT INTO background_jobs_ops (
           job_key,
           queue_name,
           status,
           attempts,
           last_heartbeat_at,
           started_at,
           completed_at,
           failure_reason,
           metadata
         )
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8::jsonb)
         ON CONFLICT (job_key)
         DO UPDATE SET
           queue_name = EXCLUDED.queue_name,
           status = EXCLUDED.status,
           attempts = EXCLUDED.attempts,
           last_heartbeat_at = CURRENT_TIMESTAMP,
           started_at = COALESCE(background_jobs_ops.started_at, EXCLUDED.started_at),
           completed_at = EXCLUDED.completed_at,
           failure_reason = EXCLUDED.failure_reason,
           metadata = COALESCE(background_jobs_ops.metadata, '{}'::jsonb) || EXCLUDED.metadata
         RETURNING *`,
        [
          jobKey,
          queueName,
          status,
          attempts,
          status === 'running' ? current?.started_at || new Date() : current?.started_at || null,
          status === 'completed' ? new Date() : current?.completed_at || null,
          metadata.failureReason || current?.failure_reason || null,
          JSON.stringify(metadata || {}),
        ]
      );
      return mapBackgroundJob(row);
    }

    Models.backgroundJobs.set(jobKey, next);
    return next;
  },

  async getOverview() {
    const queue = Models.outboundWebhookQueue;
    const failedQueue = queue.filter((job) => job.status === 'failed');
    const deliveredQueue = queue.filter((job) => job.status === 'delivered');
    const recentIncidents = (await this.listIncidents()).slice(0, 10);
    const recentAnnotations = await listAnnotations(10);
    const replayOutcomes = await listReplayOutcomes(10);
    const backgroundJobs = await listBackgroundJobs();
    const stuckJobs = backgroundJobs.filter((job) => job.status === 'running' && job.lastHeartbeatAt && Date.now() - new Date(job.lastHeartbeatAt).getTime() > 15 * 60_000);

    const errorClasses = failedQueue.reduce((acc, job) => {
      const key = job.error || 'unknown_error';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      webhookEvents: Models.webhookEvents.size,
      outboundQueue: {
        total: queue.length,
        failed: failedQueue.length,
        delivered: deliveredQueue.length,
      },
      incidents: recentIncidents,
      recentAnnotations,
      replayOutcomes,
      backgroundJobs: {
        total: backgroundJobs.length,
        stuck: stuckJobs.length,
      },
      errorClasses,
    };
  },

  async search(query) {
    const lowered = query.toLowerCase();

    if (isDatabaseConnected()) {
      const pattern = `%${query}%`;
      const [incidents, annotations, replays] = await Promise.all([
        queryAll(
          `SELECT * FROM incident_log
           WHERE source ILIKE $1 OR severity ILIKE $1 OR title ILIKE $1 OR CAST(details AS TEXT) ILIKE $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [pattern]
        ),
        queryAll(
          `SELECT * FROM operator_annotations
           WHERE target_type ILIKE $1 OR target_id ILIKE $1 OR author ILIKE $1 OR note ILIKE $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [pattern]
        ),
        queryAll(
          `SELECT * FROM outbound_webhook_deliveries
           WHERE job_id ILIKE $1 OR target_url ILIKE $1 OR status ILIKE $1 OR CAST(payload AS TEXT) ILIKE $1
           ORDER BY created_at DESC
           LIMIT 20`,
          [pattern]
        ),
      ]);

      return {
        incidents: incidents.map(mapIncident),
        annotations: annotations.map(mapAnnotation),
        replays: replays.map(mapReplay),
      };
    }

    return {
      incidents: (await this.listIncidents()).filter((item) => JSON.stringify(item).toLowerCase().includes(lowered)).slice(0, 20),
      annotations: Models.operatorAnnotations.filter((item) => JSON.stringify(item).toLowerCase().includes(lowered)).slice(0, 20),
      replays: Models.replayOutcomes.filter((item) => JSON.stringify(item).toLowerCase().includes(lowered)).slice(0, 20),
    };
  },

  listAnnotations,

  listReplayOutcomes,
};

export default OpsService;