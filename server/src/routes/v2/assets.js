import express from 'express';
import AssetStorageService from '../../services/assetStorage.js';

const router = express.Router();

router.post('/upload-url', (req, res) => {
  const { userId, purpose, filename, contentType, visibility, retentionClass } = req.body || {};
  if (!purpose || !filename) {
    return res.status(400).json({ error: 'purpose and filename are required' });
  }

  AssetStorageService.reserveUpload({
    userId,
    purpose,
    filename,
    contentType,
    visibility,
    retentionClass,
  })
    .then((asset) => res.status(201).json({ asset }))
    .catch((error) => res.status(500).json({ error: error.message || 'Failed to reserve upload' }));
});

router.get('/', (req, res) => {
  const userId = String(req.query.userId || '');
  const purpose = String(req.query.purpose || '');
  AssetStorageService.listAssets({ userId: userId || undefined, purpose: purpose || undefined })
    .then((assets) => res.json({ assets }))
    .catch((error) => res.status(500).json({ error: error.message || 'Failed to list assets' }));
});

router.get('/:assetId', (req, res) => {
  AssetStorageService.getAsset(req.params.assetId)
    .then((asset) => {
      if (!asset) {
        return res.status(404).json({ error: 'asset_not_found' });
      }
      res.json({ asset });
    })
    .catch((error) => res.status(500).json({ error: error.message || 'Failed to load asset' }));
});

router.post('/retention/sweep', (_req, res) => {
  AssetStorageService.sweepExpiredTemporaryAssets()
    .then((result) => res.json(result))
    .catch((error) => res.status(500).json({ error: error.message || 'Failed to sweep assets' }));
});

export default router;