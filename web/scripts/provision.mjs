#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// web/scripts/provision.mjs lives under <repoRoot>/web/scripts
const repoRoot = path.resolve(__dirname, '..', '..');
const provisionScript = path.join(repoRoot, 'scripts', 'provision.mjs');

const result = spawnSync(process.execPath, [provisionScript, ...process.argv.slice(2)], {
  stdio: 'inherit',
});

if (typeof result.status === 'number') {
  process.exit(result.status);
}

process.exit(1);
