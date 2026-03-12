# Railway Deployment Troubleshooting Guide

## Quick Diagnostic Steps

### 1. Check Railway Build Logs
1. Go to [Railway Dashboard](https://railway.com/dashboard)
2. Select your project
3. Click on the "money-generator-api" service
4. Go to "Build" tab
5. Look for error messages in the logs

### 2. Common Failure Causes & Fixes

#### **A. Memory Issues During npm install**
```
Error: JavaScript heap out of memory
```
**Solution:**
```bash
# In railway.toml, add:
[build]
builder = "NIXPACKS"
buildCommand = "npm ci --legacy-peer-deps"  # Instead of npm install
```

#### **B. Missing Port Configuration**
```
Error: listen EADDRINUSE: address already in use :::4000
```
**Solution:**
1. Check Railway Variables: Set `PORT=4000`
2. Verify docker exposes port: `EXPOSE 4000` in Dockerfile
3. Update start command if needed

#### **C. Configuration Validation Fails**
```
Error: Configuration validation failed
```
**Solution:**
Ensure Railway has all required env vars:
- `NODE_ENV=production` ✓ (defaults to development if missing)
- All webhook secrets (have demo defaults, so not critical)
- `BACKEND_PORT=4000` (optional, defaults to 4000)

To check defaults in code, see: [server/src/config.js](server/src/config.js)

#### **D. Module Not Found Error**
```
Error: Cannot find module 'express'
```
**Solution:**
```bash
# Force clean install
cd server
rm -rf node_modules
rm package-lock.json
npm install
```

#### **E. Health Check Timeout**
```
Error: Request timeout at /health
```
**Solution:**
1. Verify endpoint exists in [server/src/app.js](server/src/app.js):
   ```javascript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok' });
   });
   ```
2. Increase timeout in railway.toml:
   ```toml
   healthcheckTimeout = 300
   ```

### 3. Local Testing (Simulate Railway Build)

```bash
# Clean build like Railway does
cd server
rm -rf node_modules
npm ci  # Railway uses npm ci, not npm install

# Test startup like Railway does
NODE_ENV=production npm start

# Should see:
# Server running on port 4000 (production mode)
# Health check: http://localhost:4000/health
# Process ID: [number]
```

### 4. Verify Health Endpoint

```bash
# In another terminal:
curl http://localhost:4000/health
# Should return: {"status":"ok"}
```

## Railway Configuration Checklist

### Environment Variables
- [ ] `NODE_ENV` = `production`
- [ ] `BACKEND_PORT` = `4000` (optional, default: 4000)
- [ ] `PAYPAL_WEBHOOK_SECRET` = `[your-secret]` (optional, has demo default)
- [ ] `PLAID_WEBHOOK_SECRET` = `[your-secret]` (optional, has demo default)
- [ ] `CRM_WEBHOOK_SECRET` = `[your-secret]` (optional, has demo default)
- [ ] `AUTH_USER_TOKEN` = `[your-token]` (optional, has demo default)
- [ ] `AUTH_ADMIN_TOKEN` = `[your-token]` (optional, has demo default)

### Build Command
```
npm ci
```

### Start Command
```
npm start
```

### Dockerfile
```
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4000
ENV NODE_ENV=production
CMD ["npm", "start"]
```

### railway.toml
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

## Debug Logs to Check

1. **Build Logs**: Check for npm/build errors
2. **Deploy Logs**: Check for port/startup errors
3. **Runtime Logs**: Check for health check failures

Command in Railway CLI:
```bash
railway logs -f --service money-generator-api
```

## If All Else Fails

### Option 1: Rebuild from Scratch
1. In Railway Dashboard, delete the current deployment
2. Push a new commit to trigger rebuild:
   ```bash
   git commit --allow-empty -m "Trigger Railway rebuild"
   git push origin main
   ```

### Option 2: Deploy with CLI
```bash
cd server
npm install -g @railway/cli
railway login
railway link [PROJECT_ID]
railway up
```

### Option 3: Check Node Version
Railway might be using a different Node version. Verify:
```bash
node --version
npm --version
```

## Recent Changes That Might Affect Deployment

- ✅ **onboarding tours added** (web app only, doesn't affect server)
- ✅ **Onboarding system** (client-side only)
- ✅ **Web build** (separate from server build)

**Server build should NOT be affected** - All changes were in the `web/` directory.

## Current Server Status

| Component | Status | Details |
|-----------|--------|---------|
| TypeScript | ✅ | No compilation errors |
| Package.json | ✅ | All dependencies declared |
| Start Script | ✅ | `npm start` works locally |
| Health Check | ✅ | `/health` endpoint configured |
| Config | ✅ | Validates with safe defaults |
| Port | ✅ | Listens on 4000 |

## Next Steps

1. **Get specific error message** from Railway logs
2. **Test locally** with the simulation steps above
3. **Check environment variables** in Railway dashboard
4. **Review recent git commits** to see what changed
5. **Rebuild deployment** if needed

---

**Need more help?**
- Check Railway documentation: https://docs.railway.app/
- Review server logs for specific errors
- Ensure all dependencies are in package.json

**Last Updated:** 2026-03-12
