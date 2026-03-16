# Money Generator App - Post-Deployment Checklist

Release: v1.3.1  
Deployment Target: Railway + Netlify  
Status: Post-release verification

## Immediate Checks

- [ ] Railway backend deployment completed without restart loops.
- [ ] Netlify frontend deployment completed without asset 404s.
- [ ] `GET /health` returns 200 from production.
- [ ] `GET /catalog` returns 200 from production.

## User Flows

- [ ] Login works for an existing user.
- [ ] Expired auth redirects to `/login`.
- [ ] Onboarding still appears for incomplete accounts.
- [ ] Dashboard renders after authentication.
- [ ] Reports page renders SVG previews without console errors.
- [ ] Jobs list view loads recommendations.
- [ ] Jobs map view lazy-loads only when requested and shows markers.
- [ ] Connect dashboard routes load without blank state.
- [ ] Public storefront page loads and checkout success page resolves.

## API And Ops

- [ ] `POST /api/v2/assets/upload-url` succeeds.
- [ ] If operator credentials are available, `GET /api/v2/ops/overview` succeeds.
- [ ] Webhook logs show no duplicate-processing regressions.
- [ ] Background jobs show no stale heartbeats after deployment.

## Performance

- [ ] Latest strict bundle-budget report shows zero violations.
- [ ] Entry CSS remains near the validated v1.3.1 baseline of ~31 kB.
- [ ] MapLibre remains isolated to the Jobs map path.
- [ ] No unexpected new vendor chunk appears in the largest bundle items.

## Sign-Off

- [ ] Release notes published for `v1.3.1`.
- [ ] Changelog, README, and testing docs match the shipped app.
- [ ] No rollback required after smoke verification.

Verified By: _______________  
Date: _______________
