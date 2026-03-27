#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = new Set(process.argv.slice(2));
const shouldFix = args.has('--fix');
const verbose = args.has('--verbose') || args.has('-v');

/**
 * Idempotent provisioning/validation script.
 *
 * Goals:
 * - Safe to run repeatedly.
 * - Prefer checks + warnings; only apply safe, minimal fixes when --fix is passed.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// scripts/provision.mjs lives under <repoRoot>/scripts
const repoRoot = path.resolve(__dirname, '..');

function join(...segments) {
  return path.join(repoRoot, ...segments);
}

function exists(filePath) {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

function stat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function isFile(filePath) {
  return stat(filePath)?.isFile() === true;
}

function isDir(filePath) {
  return stat(filePath)?.isDirectory() === true;
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function ensureFile(filePath, content) {
  if (exists(filePath)) return;
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function warn(message) {
  warnings.push(message);
}

function error(message) {
  errors.push(message);
}

function ok(message) {
  oks.push(message);
}

function containsAll(haystack, needles) {
  return needles.every((n) => haystack.includes(n));
}

const oks = [];
const warnings = [];
const errors = [];

if (verbose) {
  console.log('=== Provision Check (idempotent) ===');
  console.log(`Root: ${repoRoot}`);
  console.log(`Mode: ${shouldFix ? 'fix' : 'check'}`);
}

// --- Netlify sanity checks ---
const netlifyTomlPath = join('netlify.toml');
if (!exists(netlifyTomlPath)) {
  error('Missing netlify.toml at repo root.');
} else {
  const toml = readText(netlifyTomlPath);

  if (!toml.includes('base = "web"')) {
    warn('netlify.toml: build.base is not set to "web" (expected base = "web").');
  }
  if (!toml.includes('publish = "dist"')) {
    warn('netlify.toml: build.publish is not set to "dist" (expected publish = "dist").');
  }
  if (!toml.includes('command = "npm ci --include=dev && npm run build"')) {
    warn('netlify.toml: build.command is not the expected idempotent command (npm ci --include=dev && npm run build).');
  }

  const hasV1 = containsAll(toml, ['from = "/api/v1/*"', 'status = 200']);
  const hasV2 = containsAll(toml, ['from = "/api/v2/*"', 'status = 200']);
  if (!hasV2) warn('netlify.toml: missing /api/v2/* proxy redirect.');
  if (!hasV1) warn('netlify.toml: missing /api/v1/* proxy redirect.');

  if (!toml.includes('NODE_VERSION = "20"')) {
    warn('netlify.toml: build.environment.NODE_VERSION is not set to "20" (expected for this repo).');
  }

  if (!containsAll(toml, ['VITE_API_URL', 'VITE_V2_ENABLED'])) {
    warn('netlify.toml: expected VITE_API_URL and VITE_V2_ENABLED to be present in context environments.');
  }

  ok('Netlify config present.');
}

// --- Web deploy prerequisites ---
const webPkgPath = join('web', 'package.json');
const webTsconfigPath = join('web', 'tsconfig.json');
const webLockPath = join('web', 'package-lock.json');
const webViteConfigCandidates = [
  join('web', 'vite.config.ts'),
  join('web', 'vite.config.js'),
  join('web', 'vite.config.mjs'),
  join('web', 'vite.config.cjs'),
];
const webIndexHtml = join('web', 'index.html');
const webMainTsx = join('web', 'src', 'main.tsx');

if (!exists(webPkgPath)) {
  error('Missing web/package.json.');
} else {
  const webPkg = JSON.parse(readText(webPkgPath));
  const devDeps = webPkg.devDependencies || {};
  if (!devDeps['@types/node']) {
    warn('web/package.json: missing devDependency @types/node (Netlify tsc may fail on NodeJS namespace).');
  } else {
    ok('web/package.json has @types/node.');
  }

  const deps = webPkg.dependencies || {};
  const hasReact = typeof deps.react === 'string';
  const hasReactDom = typeof deps['react-dom'] === 'string';
  if (!hasReact || !hasReactDom) {
    warn('web/package.json: expected react and react-dom dependencies.');
  }

  const webDevDeps = webPkg.devDependencies || {};
  if (!webDevDeps.typescript) {
    warn('web/package.json: expected devDependency typescript (Netlify build runs tsc).');
  }
  if (!webDevDeps.vite) {
    warn('web/package.json: expected devDependency vite.');
  }
}

if (!exists(webTsconfigPath)) {
  error('Missing web/tsconfig.json.');
} else {
  const tsconfig = JSON.parse(readText(webTsconfigPath));
  const types = tsconfig?.compilerOptions?.types;
  const hasNodeTypes = Array.isArray(types) && types.includes('node');
  const hasViteTypes = Array.isArray(types) && types.includes('vite/client');

  if (!hasNodeTypes || !hasViteTypes) {
    warn('web/tsconfig.json: compilerOptions.types should include ["vite/client", "node"] for consistent CI builds.');
  } else {
    ok('web/tsconfig.json has vite/client + node types.');
  }
}

if (!isFile(webLockPath)) {
  warn('web/package-lock.json missing. Netlify will still build, but lockfiles improve determinism.');
} else {
  ok('web/package-lock.json present.');
}

if (!webViteConfigCandidates.some((p) => isFile(p))) {
  warn('web/vite.config.* missing (expected vite.config.ts/js).');
} else {
  ok('web/vite.config.* present.');
}

if (!isFile(webIndexHtml)) {
  warn('web/index.html missing (Vite entry HTML).');
} else {
  ok('web/index.html present.');
}

if (!isFile(webMainTsx)) {
  warn('web/src/main.tsx missing (web app entrypoint).');
} else {
  ok('web/src/main.tsx present.');
}

// Netlify Functions directory: Netlify UI can default to web/netlify/functions.
const functionsDir = join('web', 'netlify', 'functions');
if (!exists(functionsDir)) {
  if (shouldFix) {
    ensureDir(functionsDir);
    ensureFile(path.join(functionsDir, '.gitkeep'), '# Intentionally empty – placeholder for Netlify Functions directory.\n');
    ok('Created web/netlify/functions (placeholder).');
  } else {
    warn('Missing web/netlify/functions directory. If Netlify is configured with a functions directory, builds may reference it. Run with --fix to create a placeholder.');
  }
} else if (!isDir(functionsDir)) {
  error('web/netlify/functions exists but is not a directory.');
} else {
  ok('web/netlify/functions exists.');
}

// --- Server deploy artifacts (best-effort checks) ---
const serverDir = join('server');
if (exists(serverDir)) {
  if (!isDir(serverDir)) {
    error('server exists but is not a directory.');
  } else {
    const serverPkgPath = join('server', 'package.json');
    const serverLockPath = join('server', 'package-lock.json');
    const serverEntry = join('server', 'src', 'index.js');
    const serverApp = join('server', 'src', 'app.js');
    const serverEnvExample = join('server', '.env.production.example');

    if (!isFile(serverPkgPath)) {
      error('Missing server/package.json.');
    } else {
      const serverPkg = JSON.parse(readText(serverPkgPath));
      const serverScripts = serverPkg.scripts || {};
      if (!serverScripts.start) warn('server/package.json: missing scripts.start.');
      if (!serverScripts.test) warn('server/package.json: missing scripts.test.');
    }

    if (!isFile(serverLockPath)) {
      warn('server/package-lock.json missing. Lockfiles improve determinism for deploys.');
    } else {
      ok('server/package-lock.json present.');
    }

    if (!isFile(serverEntry)) {
      warn('server/src/index.js missing (expected server entrypoint).');
    } else {
      ok('server/src/index.js present.');
    }

    if (!isFile(serverApp)) {
      warn('server/src/app.js missing (expected Express app module for tests).');
    } else {
      ok('server/src/app.js present.');
    }

    if (!isFile(serverEnvExample)) {
      warn('server/.env.production.example missing (recommended for deployment setup).');
    } else {
      ok('server/.env.production.example present.');
    }

    const dockerfile = join('server', 'Dockerfile');
    if (!isFile(dockerfile)) {
      warn('server/Dockerfile missing (if deploying server via containers, add one).');
    }

    const railway = join('server', 'railway.toml');
    if (!isFile(railway)) {
      warn('server/railway.toml missing (if deploying via Railway, add/verify).');
    }

    const vercel = join('server', 'vercel.json');
    if (!isFile(vercel)) {
      warn('server/vercel.json missing (if deploying via Vercel, add/verify).');
    }

    ok('Server folder present.');
  }
}

// --- Summary + exit ---
if (!verbose) console.log('=== Provision Check (idempotent) ===');
oks.forEach((m) => console.log(`OK: ${m}`));
warnings.forEach((m) => console.log(`WARN: ${m}`));
errors.forEach((m) => console.log(`ERROR: ${m}`));

if (errors.length > 0) {
  process.exitCode = 2;
} else if (warnings.length > 0) {
  process.exitCode = 1;
} else {
  process.exitCode = 0;
}
