# Release Checklist

## Local Verification

1. Run `npm run build:budget` from the repository root.
2. Run `npm test` from the repository root.
3. Run dependency audits in the root package, `web/`, and `server/`.
4. Confirm `CHANGELOG.md`, `RELEASE_NOTES_V1.3.1.md`, and `README.md` match the shipped code.

## Verified For v1.3.1

1. Backend Jest suite passed: 4 suites, 28 tests.
2. Root dependency audit returned 0 vulnerabilities.
3. Frontend dependency audit returned 0 vulnerabilities.
4. Strict bundle-budget build remains the frontend release gate.

## Deploy Prerequisites

1. Confirm required environment variables for database, JWT, Stripe, and webhook secrets.
2. If schema changed, deploy migrations before shifting app traffic.
3. Verify the backend starts on `PORT` and serves `GET /health`.

## Production Smoke Checklist

1. `GET /health` returns 200 from the deployed backend.
2. `GET /catalog` returns 200.
3. Auth login succeeds and expired-token redirect still routes users to `/login`.
4. Dashboard loads for an authenticated user.
5. Reports page renders SVG previews without console errors.
6. Jobs page loads in list view.
7. Jobs map opens only after switching to map view and shows clustered markers.
8. Stripe Connect dashboard routes load without blank states.
9. Storefront and storefront success routes render for public customer paths.
10. `POST /api/v2/assets/upload-url` succeeds.
11. If operator credentials are available, `GET /api/v2/ops/overview` succeeds.

## Post-Deploy Review

1. Check request and error logs for new 5xx spikes.
2. Review webhook processing and duplicate-event visibility.
3. Review background-job heartbeats and stale-job alerts.
4. Confirm no rollback is required before declaring the release stable.
# Release Checklist

## Pre-Deploy

1. Run frontend production build.
2. Run backend test suite.
3. Review dependency updates and security advisories.
4. Confirm required env vars for database, Stripe, webhooks, and object storage.

## Schema First

1. Deploy migration-only release if schema changed.
2. Verify `_migrations` contains the latest version.
3. Run backfills for ops or asset tables if required.

## App Deploy

1. Deploy backend.
2. Deploy frontend.
3. Confirm `PORT`-based startup and health endpoint responsiveness.

## Smoke Tests

1. `GET /health`
2. Auth login, logout, and expired-session redirect flow.
3. Payment checkout or billing smoke test.
4. Webhook ingest smoke event plus replay visibility.
5. Admin/operator overview route.
6. Analytics and monitoring dashboard check.
7. Asset upload reservation endpoint.

## Post-Deploy

1. Check request/error logs with correlation ids.
2. Review queue health and recent incidents.
3. Verify no stuck background jobs.
4. Confirm payment failures and webhook duplicates are visible in ops surfaces.

## Ongoing Governance

1. Review dependencies and security posture at least monthly.
2. Review runbooks after every incident.
3. Remove deprecated code paths only after one stable release cycle.