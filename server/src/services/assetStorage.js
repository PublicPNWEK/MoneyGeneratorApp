import crypto from 'crypto';
import path from 'path';
import { config } from '../config.js';
import { Models } from '../models.js';
import { isDatabaseConnected, query, queryAll, queryOne } from '../database.js';

function slugifyFilename(filename = 'upload.bin') {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function createSignature(assetId, expiresAt) {
  return crypto
    .createHmac('sha256', config.objectStorage.signingSecret)
    .update(`${assetId}:${expiresAt}`)
    .digest('hex');
}

function mapAsset(row) {
  return {
    id: row.id,
    userId: row.user_id,
    purpose: row.purpose,
    objectKey: row.object_key,
    bucket: row.bucket,
    provider: row.provider,
    visibility: row.visibility,
    contentType: row.content_type,
    originalFilename: row.original_filename,
    publicUrl: row.public_url,
    signedUrl: row.signed_url,
    expiresAt: row.expires_at?.toISOString?.() || row.expires_at || null,
    retentionClass: row.retention_class,
    createdAt: row.created_at?.toISOString?.() || row.created_at,
    deletedAt: row.deleted_at?.toISOString?.() || row.deleted_at || null,
  };
}

export const AssetStorageService = {
  async reserveUpload({ userId, purpose, filename, contentType, visibility = 'private', retentionClass = 'temporary' }) {
    const assetId = crypto.randomUUID();
    const safeFilename = slugifyFilename(filename);
    const objectKey = `${purpose}/${userId || 'anonymous'}/${assetId}-${safeFilename}`;
    const expiresAt = new Date(Date.now() + config.objectStorage.tempRetentionHours * 60 * 60 * 1000).toISOString();
    const signature = createSignature(assetId, expiresAt);
    const publicUrl = visibility === 'public' && config.objectStorage.publicBaseUrl
      ? `${config.objectStorage.publicBaseUrl.replace(/\/$/, '')}/${objectKey}`
      : null;
    const signedUrl = publicUrl || `/api/v2/assets/${assetId}/access?expires=${encodeURIComponent(expiresAt)}&sig=${signature}`;

    const asset = {
      id: assetId,
      userId,
      purpose,
      objectKey,
      bucket: config.objectStorage.bucket,
      provider: config.objectStorage.provider,
      visibility,
      contentType,
      originalFilename: path.basename(filename),
      publicUrl,
      signedUrl,
      expiresAt,
      retentionClass,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };

    if (isDatabaseConnected()) {
      const row = await queryOne(
        `INSERT INTO asset_objects (
           id,
           user_id,
           purpose,
           object_key,
           bucket,
           provider,
           visibility,
           content_type,
           original_filename,
           public_url,
           signed_url,
           expires_at,
           retention_class
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          asset.id,
          userId || null,
          purpose,
          objectKey,
          asset.bucket,
          asset.provider,
          visibility,
          contentType || null,
          asset.originalFilename,
          publicUrl,
          signedUrl,
          expiresAt,
          retentionClass,
        ]
      );
      return mapAsset(row);
    }

    Models.assetObjects.set(assetId, asset);
    return asset;
  },

  async getAsset(assetId) {
    if (isDatabaseConnected()) {
      const row = await queryOne(`SELECT * FROM asset_objects WHERE id = $1`, [assetId]);
      return row ? mapAsset(row) : null;
    }

    return Models.assetObjects.get(assetId) || null;
  },

  async listAssets({ userId, purpose }) {
    if (isDatabaseConnected()) {
      const clauses = ['deleted_at IS NULL'];
      const params = [];

      if (userId) {
        params.push(userId);
        clauses.push(`user_id = $${params.length}`);
      }

      if (purpose) {
        params.push(purpose);
        clauses.push(`purpose = $${params.length}`);
      }

      const rows = await queryAll(
        `SELECT * FROM asset_objects WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`,
        params
      );
      return rows.map(mapAsset);
    }

    return Array.from(Models.assetObjects.values()).filter((asset) => {
      if (userId && asset.userId !== userId) return false;
      if (purpose && asset.purpose !== purpose) return false;
      return !asset.deletedAt;
    });
  },

  async sweepExpiredTemporaryAssets() {
    if (isDatabaseConnected()) {
      const result = await query(
        `UPDATE asset_objects
         SET deleted_at = CURRENT_TIMESTAMP
         WHERE deleted_at IS NULL
           AND retention_class = 'temporary'
           AND expires_at IS NOT NULL
           AND expires_at <= CURRENT_TIMESTAMP
         RETURNING id`
      );
      return {
        removedCount: result.rowCount || 0,
        removed: result.rows.map((row) => row.id),
      };
    }

    const now = Date.now();
    const removed = [];
    for (const asset of Models.assetObjects.values()) {
      if (asset.deletedAt || asset.retentionClass !== 'temporary' || !asset.expiresAt) continue;
      if (new Date(asset.expiresAt).getTime() <= now) {
        asset.deletedAt = new Date().toISOString();
        removed.push(asset.id);
      }
    }
    return { removedCount: removed.length, removed };
  },
};

export default AssetStorageService;