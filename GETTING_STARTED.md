# Money Generator App - Getting Started Guide

> **Version**: 1.0.0 | **Updated**: March 2026

Welcome to Money Generator App! This guide will help you get up and running in minutes, whether you're a gig worker tracking earnings, a developer integrating our API, or a partner white-labeling the platform.

---

## 🎯 Quick Start by User Type

| I am a... | Start Here |
|-----------|-----------|
| **Gig Worker** | [User Quick Start](#-user-quick-start-5-minutes) |
| **Developer** | [Developer Setup](#-developer-setup) |
| **API Integrator** | [API Integration](#-api-integration) |
| **Partner/White-Label** | [Partner Setup](#-partner--white-label-setup) |

---

## 👤 User Quick Start (5 Minutes)

### Step 1: Create Your Account

**Web**: Visit [app.moneygeneratorapp.com](https://app.moneygeneratorapp.com)  
**Mobile**: Download from App Store or Google Play

### Step 2: Complete Onboarding

The onboarding wizard guides you through:

```
1. Welcome          → Learn what Money Generator does
2. Connect Bank     → Link your bank account (optional but recommended)
3. Choose Plan      → Select Free, Pro ($14.99/mo), or Enterprise
4. All Set!         → Start tracking earnings
```

### Step 3: Connect Your Gig Platforms

Link your gig economy accounts for automatic tracking:

| Platform | How to Connect |
|----------|---------------|
| **Uber/Lyft** | OAuth login |
| **DoorDash** | Email + password |
| **Instacart** | Email + password |
| **TaskRabbit** | OAuth login |
| **Fiverr/Upwork** | API key |

Go to **Settings → Connected Platforms → Add Platform**

### Step 4: Set Up Auto-Reserve (Tax Savings)

Automatically save for taxes, emergencies, and retirement:

1. Go to **Benefits → Auto-Reserve**
2. Set percentages:
   - Tax Reserve: 25% (recommended)
   - Emergency Fund: 10%
   - Retirement: 5%
3. Enable auto-allocation

### Step 5: Create Your First Goal

1. Go to **Goals → Create Goal**
2. Choose type: Daily, Weekly, or Monthly earnings
3. Set your target amount
4. Track progress on your dashboard

---

## 💻 Developer Setup

### Prerequisites

```
Node.js 20.x or higher
npm 10.x or higher
Git
```

### Clone & Install

```bash
# Clone the repository
git clone https://github.com/PublicPNWEK/MoneyGeneratorApp.git
cd MoneyGeneratorApp

# Install root dependencies
npm install
```

### Backend Setup

```bash
cd server
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration:
# - PORT=4000
# - NODE_ENV=development
# - PLAID_CLIENT_ID=your_plaid_id
# - PLAID_SECRET=your_plaid_secret
# - PAYPAL_CLIENT_ID=your_paypal_id
# - PAYPAL_SECRET=your_paypal_secret

# Start development server
npm run dev
```

Server runs at `http://localhost:4000`

### Web Frontend Setup

```bash
cd web
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:4000" > .env

# Start development server
npm run dev
```

Web app runs at `http://localhost:3000`

### Mobile Setup (React Native)

```bash
# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

### Mobile Setup (Kotlin Multiplatform)

```bash
# Android
./gradlew :androidApp:installDebug

# iOS (macOS only)
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
```

---

## 🔌 API Integration

### Base URL

```
Production: https://api.moneygeneratorapp.com/api/v1
Development: http://localhost:4000/api/v1
```

### Authentication

Generate an API key:

```bash
POST /api/v1/api-keys
{
  "userId": "your-user-id",
  "tier": "pro",  // free, starter, pro, enterprise
  "name": "My Integration"
}
```

Response:
```json
{
  "keyId": "abc123",
  "apiKey": "mgn_pro_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "tier": "pro",
  "message": "Store this key securely. It won't be shown again."
}
```

Include in all requests:
```
Authorization: Bearer mgn_pro_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Rate Limits

| Tier | Requests/Hour | Requests/Day |
|------|--------------|--------------|
| Free | 100 | 500 |
| Starter | 500 | 5,000 |
| Pro | 2,000 | 20,000 |
| Enterprise | 10,000 | 100,000 |

### Core API Endpoints

#### Health Check
```bash
GET /health
```

#### Earnings
```bash
# Record earnings
POST /api/v1/earnings
{
  "userId": "user123",
  "platform": "uber",
  "amount": 45.50
}

# Get earnings summary
GET /api/v1/earnings/summary?userId=user123&startDate=2026-01-01&endDate=2026-03-11
```

#### Expenses
```bash
# Record expense
POST /api/v1/expenses
{
  "userId": "user123",
  "amount": 15.00,
  "categoryId": "fuel",
  "description": "Gas station fill-up"
}

# Record mileage
POST /api/v1/expenses/mileage
{
  "userId": "user123",
  "miles": 42.5,
  "purpose": "Delivery route"
}
```

#### Analytics
```bash
# Profitability analysis
GET /api/v1/analytics/profitability?userId=user123

# Tax summary
GET /api/v1/analytics/tax?userId=user123&startDate=2026-01-01&endDate=2026-12-31
```

### Full API Reference

See [API_REFERENCE.md](API_REFERENCE.md) for complete endpoint documentation.

---

## 🏢 Partner / White-Label Setup

### Register as Partner

1. Contact partnerships@moneygeneratorapp.com
2. Complete business verification
3. Receive partner credentials

### Configure White-Label

```bash
POST /api/v1/marketplace/whitelabel
{
  "partnerId": "your-partner-id",
  "brandName": "Your Brand Name",
  "logoUrl": "https://yourbrand.com/logo.png",
  "primaryColor": "#4F46E5",
  "secondaryColor": "#10B981",
  "customDomain": "app.yourbrand.com",
  "features": ["earnings_tracking", "expense_management", "analytics"],
  "apiAccess": "enterprise"
}
```

### Custom Domain Setup

1. Add your custom domain in the dashboard
2. Configure DNS:
   ```
   CNAME app.yourbrand.com → partners.moneygeneratorapp.com
   ```
3. SSL certificate is automatically provisioned

### Partner API Access

Partners get:
- Enterprise-tier rate limits
- Custom branding on all screens
- Revenue sharing dashboard
- Dedicated support

---

## 📱 User Funnel Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWARENESS                                │
│   Social Media • SEO • Referrals • App Store • Partnerships     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ACQUISITION                              │
│           Landing Page → Sign Up → Email Verification           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ACTIVATION                               │
│   Onboarding Wizard (4 steps):                                  │
│   1. Welcome & Value Props                                       │
│   2. Connect Bank (Plaid) - optional                            │
│   3. Choose Plan (Free/Pro/Enterprise)                          │
│   4. Success & Next Steps                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ENGAGEMENT                               │
│   First Week Checklist:                                         │
│   □ Connect first gig platform                                  │
│   □ Record first earning                                        │
│   □ Set up auto-reserve for taxes                               │
│   □ Create first savings goal                                   │
│   □ Enable push notifications                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         RETENTION                                │
│   Daily: Earnings dashboard, surge alerts                       │
│   Weekly: Summary reports, goal progress                        │
│   Monthly: Tax estimates, profitability insights                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REVENUE                                  │
│   Free → Pro upgrade (trial expiry, feature gates)              │
│   Pro → Enterprise (team features, API access)                  │
│   Add-ons: Cash advances, premium analytics                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         REFERRAL                                 │
│   Referral program: Invite friends, earn rewards                │
│   Social sharing: Weekly earnings summaries                     │
│   Reviews: App store ratings prompts                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Activation Checklist

Track your progress through the activation funnel:

### Day 1
- [ ] Create account
- [ ] Complete onboarding wizard
- [ ] Connect at least one bank account OR gig platform
- [ ] View your dashboard

### Week 1
- [ ] Connect all your gig platforms
- [ ] Record your first week of earnings
- [ ] Set up tax auto-reserve (25% recommended)
- [ ] Create a monthly earnings goal
- [ ] Enable surge alerts for your area

### Month 1
- [ ] Review your monthly profitability report
- [ ] Track mileage for tax deductions
- [ ] Explore automation features
- [ ] Consider upgrading to Pro for advanced features
- [ ] Invite a fellow gig worker (earn $10 each!)

---

## 🔧 Troubleshooting

### Common Issues

| Problem | Solution |
|---------|----------|
| Can't connect bank | Use Plaid's test credentials in development |
| API returns 429 | You've hit rate limits - upgrade tier or wait |
| Push notifications not working | Check device settings and app permissions |
| Platform sync failing | Reconnect the platform in Settings |

### Getting Help

- **Documentation**: [docs.moneygeneratorapp.com](https://docs.moneygeneratorapp.com)
- **Community**: [Discord](https://discord.gg/moneygenerator)
- **Email**: support@moneygeneratorapp.com
- **Enterprise**: enterprise@moneygeneratorapp.com

---

## 📚 Additional Resources

| Resource | Description |
|----------|-------------|
| [README.md](README.md) | Project overview |
| [README_PRODUCTION.md](README_PRODUCTION.md) | Production architecture |
| [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md) | Deployment guide |
| [NETLIFY_DEPLOY_GUIDE.md](NETLIFY_DEPLOY_GUIDE.md) | Frontend deployment |
| [server/DEPLOYMENT.md](server/DEPLOYMENT.md) | Backend deployment |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing documentation |

---

## 🎉 You're Ready!

You've completed the getting started guide. Here's what to do next:

1. **Users**: Start tracking your earnings and watch your financial insights grow
2. **Developers**: Build your first integration with our API
3. **Partners**: Configure your white-label instance

Welcome to Money Generator! 🚀
