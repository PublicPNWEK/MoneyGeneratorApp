# Money Generator App V2 - Deployment Guide

## Overview

This guide provides complete deployment instructions for Money Generator App V2 across multiple platforms:
- **Web**: Netlify (recommended)
- **Backend**: Docker + Railway/AWS/DigitalOcean
- **Mobile**: Xcode/Android Studio CI/CD

## Prerequisites

- Node.js 20+
- npm or yarn
- Git
- Docker & Docker Compose (for local testing)
- Cloud platform accounts (Railway, AWS, etc.)

## Quick Start (Local Development)

### 1. Clone and Install

```bash
git clone <repo-url>
cd MoneyGeneratorApp
npm install
cd web && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Local Stack with Docker Compose

```bash
# Build and start services
docker-compose up -d

# Check health
curl http://localhost:4000/health
curl http://localhost:5173

# View logs
docker-compose logs -f api
docker-compose logs -f web

# Stop services
docker-compose down
```

Services will be available at:
- API: `http://localhost:4000`
- Web: `http://localhost:5173`
- Redis: `localhost:6379`

## Web App Deployment (Netlify)

### 1. Prepare for Deployment

```bash
cd web
npm run build
ls -la dist/  # Verify build output
```

### 2. Deploy to Netlify

#### Option A: Using Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

#### Option B: GitHub Integration

1. Push code to GitHub
2. Connect repository to Netlify dashboard
3. Netlify auto-deploys on `main` branch changes
4. Environment variables set in Netlify dashboard

### 3. Configure Environment Variables

In Netlify dashboard (Settings > Build & deploy > Environment):

**Build Variables:**
```
VITE_API_URL = https://api.moneygenerator.app
VITE_V2_ENABLED = true
NODE_VERSION = 20
CI = true
```

**Preview (Deploy Preview):**
```
VITE_API_URL = https://staging-api.moneygenerator.app
```

### 4. Verify Deployment

```bash
# Check production site
curl https://moneygenerator.app/health

# Check API proxying
curl https://moneygenerator.app/api/v1/health
curl https://moneygenerator.app/api/v2/features/flags?userId=test
```

## Backend Deployment (Railway.app)

### 1. Setup Railway Project

```bash
npm install -g railway
railway login
railway init
```

### 2. Deploy Backend

```bash
cd server

# Create Railway service
railway service add
# Select "Docker" when prompted

# Deploy
railway up

# Get deployed URL
railway domains
```

### 3. Configure Environment Variables

In Railway dashboard, add to service variables:

```
NODE_ENV=production
PORT=4000
LOG_LEVEL=info
CORS_ORIGIN=https://moneygenerator.app,https://*.netlify.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
FEATURE_V2_ENABLED=true

# Third-party
STRIPE_SECRET_KEY=sk_live_...
PAYPAL_CLIENT_ID=...
PLAID_CLIENT_ID=...
PLAID_SECRET=...
PLAID_ENV=production

# Database (optional)
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...
```

### 4. Update Web App API Endpoint

Update Netlify `VITE_API_URL` to point to Railway deployment URL.

### 5. Health Check

```bash
curl https://your-railway-domain.up.railway.app/health
```

## Backend Deployment (Docker)

### 1. Build Docker Image

```bash
cd server
docker build -t moneygenerator-api:v2 .
docker tag moneygenerator-api:v2 your-registry/moneygenerator-api:v2
```

### 2. Push to Registry

```bash
# Docker Hub
docker login
docker push your-registry/moneygenerator-api:v2

# AWS ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag moneygenerator-api:v2 <account>.dkr.ecr.us-east-1.amazonaws.com/moneygenerator-api:v2
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/moneygenerator-api:v2
```

### 3. Deploy to Container Service

#### AWS ECS
```bash
# Create task definition, service, and cluster
aws ecs register-task-definition --cli-input-json file://task-definition.json
aws ecs create-service --cluster moneygenerator --service-name api --task-definition moneygenerator-api:2
```

#### DigitalOcean App Platform
```bash
# Configure app.yaml with Docker image
doctl apps create --spec app.yaml
```

## Mobile App Deployment

### iOS (TestFlight/App Store)

```bash
cd ios

# Build for distribution
xcodebuild archive \
  -scheme MoneyGeneratorApp \
  -configuration Release \
  -archivePath build/MoneyGeneratorApp.xcarchive

# Upload to TestFlight
xcodebuild -exportArchive \
  -archivePath build/MoneyGeneratorApp.xcarchive \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath build/
```

### Android (Google Play)

```bash
cd android

# Build signed APK
./gradlew bundleRelease

# Upload to Google Play Console
# Via gradle-play-publisher or manually in console
```

## Database Setup (PostgreSQL)

```bash
# Create database
createdb moneygenerator

# Run migrations (when implemented)
npm run migrate

# Seed data
npm run seed
```

## SSL/TLS Certificates

### Auto-renewal with Netlify
- Automatic HTTPS with LetsEncrypt

### Self-hosted
```bash
# Using Certbot
certbot certonly --standalone -d moneygenerator.app
certbot renew --dry-run
```

## Monitoring & Logging

### Logging
- Backend logs → CloudWatch / DataDog / Papertrail
- Frontend errors → Sentry / LogRocket

### Health Monitoring
```bash
# API health check
curl -i https://api.moneygenerator.app/health

# Continuous monitoring (optional)
# Use service like UptimeRobot or Datadog
```

## Feature Flags & Rollout

### Enable V2 Features for Users

```javascript
// Backend
const featureFlagsService = require('./services/featureFlags');
featureFlagsService.updateFlag('JOB_MARKETPLACE', true, 100);
featureFlagsService.updateFlag('ADVANCED_ANALYTICS', true, 80); // 80% rollout
```

### Check Feature Status
```bash
curl https://api.moneygenerator.app/api/v2/features/flags?userId=user123
```

## Rollback Procedure

### Web (Netlify)
1. Netlify Dashboard → Deploys → Select previous deploy → Revert

### Backend (Railway)
1. Railway Dashboard → Service → Deployments → Select previous version

### Docker
```bash
# Rollback to previous image tag
docker pull your-registry/moneygenerator-api:v1
docker run -d --name api your-registry/moneygenerator-api:v1
```

## Performance Checklist

- [ ] API responds in < 200ms
- [ ] Web app loads in < 2s (Lighthouse)
- [ ] Asset compression enabled (gzip)
- [ ] Cache headers configured
- [ ] CDN enabled for static assets
- [ ] Database indexes created
- [ ] Rate limiting enforced
- [ ] Error tracking enabled
- [ ] Uptime monitoring configured
- [ ] Backup/disaster recovery plan documented

## Security Checklist

- [ ] HTTPS enforced (redirect http → https)
- [ ] API authentication implemented
- [ ] API rate limiting configured
- [ ] OAuth/SSO integrated
- [ ] Environment variables secured (no hardcoding)
- [ ] CORS properly configured
- [ ] SQL injection protection
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Secrets rotation scheduled
- [ ] Security headers set (CSP, X-Frame, etc.)
- [ ] SSL/TLS certificates valid
- [ ] Regular security audits scheduled

## Troubleshooting

### API connection issues
```bash
# Check API is running
curl http://localhost:4000/health

# Verify CORS is configured
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     http://localhost:4000/health

# Check environment variables
env | grep VITE_API
```

### Performance issues
```bash
# Check build size
npm run build && npm run analyze

# Lighthouse audit
npm run lighthouse

# Monitor build time
time npm run build
```

### Deployment failures
```bash
# Check logs
netlify functions:list
railway logs -f

# Verify environment variables
env | grep VITE

# Test locally with production config
NODE_ENV=production npm run build
```

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f api`
2. Verify environment variables are set
3. Check API health: `/health` endpoint
4. Review error tracking (Sentry/DataDog)
5. Open issue with deployment logs included

---

**Last updated**: March 12, 2026
**Version**: 2.0.0
