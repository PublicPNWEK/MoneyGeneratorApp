# Deploy to Netlify - Setup Required

## ⚠️ Netlify Authentication Needed

To deploy your app to Netlify, you need to authenticate first. Here's how:

---

## Option 1: Authenticate via Netlify CLI (Recommended)

### Step 1: Run Login Command
```bash
netlify login
```

This will:
- Open a browser window
- Ask you to authorize Netlify
- Save your authentication token locally

### Step 2: Grant Authorization
- Click "Authorize" when the browser opens
- Wait for confirmation
- Return to terminal (should say "You are now logged in!")

### Step 3: Deploy
```bash
npm run deploy
# or
npm run deploy:staging
```

---

## Option 2: Authenticate via GitHub (Automatic)

If you've already set up GitHub Actions (recommended):

### Step 1: Get Netlify Auth Token
Visit: https://app.netlify.com/user/applications/personal-access-tokens

### Step 2: Get Your Site ID
Visit: https://app.netlify.com

Select your site → Site settings → Copy the **Site ID**

### Step 3: Set GitHub Secrets
In your GitHub repo:
Settings → Secrets and variables → Actions

Add:
```
NETLIFY_AUTH_TOKEN = <your-token-from-step-1>
NETLIFY_SITE_ID = <your-site-id-from-step-2>
```

### Step 4: Push to Deploy
```bash
git push origin main
```
GitHub Actions will automatically deploy!

---

## Option 3: Manual Deploy (One-Time)

If you just want to test deployment once:

```bash
# This will prompt for authentication
netlify deploy --prod --dir=web/dist
```

---

## Quick Setup Script

Run this to automate the setup (interactive):

```bash
# Authenticate with Netlify
netlify login

# Verify authentication
netlify sites:list

# Deploy
netlify deploy --prod --dir=web/dist
```

---

## Troubleshooting

### "netlify: command not found"
Install Netlify CLI:
```bash
npm install -g netlify-cli
```

### "Not authenticated"
Run:
```bash
netlify login
```

### Need to Switch Accounts
```bash
netlify logout
netlify login
```

### Check Current Auth Status
```bash
netlify status
```

---

## What Happens After Authentication

Once authenticated, you can:

1. **Deploy with script:**
   ```bash
   npm run deploy
   ```

2. **Deploy with CLI:**
   ```bash
   netlify deploy --prod --dir=web/dist
   ```

3. **Automatic GitHub Actions:**
   - Set GitHub secrets (one-time)
   - Push to main branch
   - Deploys automatically

---

## Next Steps

1. Choose an authentication method above
2. Complete authentication
3. Run one of these:
   - `npm run deploy` (script)
   - `netlify deploy --prod --dir=web/dist` (CLI)
   - `git push origin main` (GitHub Actions - after setting secrets)

---

**Need Help?**
- Netlify Docs: https://docs.netlify.com
- Netlify CLI: https://cli.netlify.com
- This guide: DEPLOY_SETUP.md
