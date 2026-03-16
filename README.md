# Money Generator App - Full-Stack Web Edition

React 18 frontend plus Node.js/Express backend for gig workers, freelancers, and operators to manage earnings, expenses, subscriptions, integrations, and storefront flows.
Status: Active development  
Latest: v1.3.1 (March 16, 2026)

## Overview
Money Generator App helps users:

- Track income, subscriptions, and financial health.
- Discover jobs and compare opportunities.
- Manage reports, mileage, taxes, and notifications.
- Connect payment and banking flows.
- Expose a public storefront for customer purchases.

## Stack

### Frontend
- React 18 with TypeScript
- Vite 7
- React Router 7
- Context-based state management
- Lucide React icons
- Custom SVG report previews
- MapLibre GL for the Jobs map, loaded only on demand

### Backend
- Node.js 20+
- Express.js (ESM)
- PostgreSQL via `pg` with in-memory fallback support
- Zod validation
- JWT auth
- Stripe, Stripe Connect, Plaid, and PayPal integrations

## Repository Layout
```text
MoneyGeneratorApp/
├── web/                     React SPA
│   ├── src/
│   │   ├── components/      Reusable UI and flows
│   │   ├── context/         App, auth, and theme providers
│   │   ├── data/            Static and mock data
│   │   ├── layouts/         Authenticated app layout
│   │   ├── lib/             API client and helpers
│   │   ├── pages/           Route pages
│   │   ├── styles/          Active design system and shared CSS
│   │   ├── App.tsx          Route composition and providers
│   │   └── main.tsx         Entry point
│   ├── package.json
│   └── vite.config.ts       Bundle budgets and chunk strategy
├── server/                  Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── models/
│   │   └── __tests__/
│   └── package.json
├── scripts/                 Provisioning and smoke checks
├── CHANGELOG.md
├── RELEASE_CHECKLIST.md
└── RELEASE_NOTES_V1.3.1.md
```
## Local Development

### Prerequisites
- Node.js 20+
- npm

### Install
```bash
npm install
npm install --prefix web
npm install --prefix server
```

### Run
Frontend:

```bash
npm run dev
```
Backend:

```bash
npm run dev --prefix server
```
Default local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:4000`

## Commands
### Root

```bash
npm run dev
npm run build
npm run build:budget
npm run analyze
npm run lint
npm test
npm run provision
npm run provision:check
npm run smoke:prod
```

### Web

```bash
npm run dev
npm run build
npm run build:budget
npm run analyze
npm run lint
```

### Server

```bash
npm run dev
npm test
```

## Environment Variables

### Frontend (`web/.env.local`)

```bash
VITE_API_URL=http://localhost:4000
VITE_V2_ENABLED=true
```

### Backend (`server/.env`)

```bash
PORT=4000
DATABASE_URL=postgres://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_CONNECT_WEBHOOK_SECRET=...
```

## Verification

Release-facing checks for v1.3.1:

- `npm test` passes the backend Jest suite.
- `npm run build:budget` is the frontend release gate.
- Root and frontend dependency audits are clean.
- The release notes, changelog, and README align with the shipped code.

See `RELEASE_CHECKLIST.md` and `POST_DEPLOYMENT_CHECKLIST.md` for the full release and smoke flow.

## Performance Notes

- Entry CSS is approximately 31 kB in the validated strict budget build.
- SVG report previews replaced Recharts in v1.3.1.
- The Jobs map uses MapLibre only when the map view is selected and the map container nears the viewport.

## Key Routes

- `/login`, `/register`
- `/`
- `/jobs`
- `/reports`
- `/settings`
- `/connect/dashboard`
- `/storefront/:accountId`

## Documentation

- `CHANGELOG.md`
- `RELEASE_CHECKLIST.md`
- `POST_DEPLOYMENT_CHECKLIST.md`
- `RELEASE_NOTES_V1.3.1.md`
- `TESTING_GUIDE.md`
- `PRODUCTION_OPERATIONS_RUNBOOK.md`

## Troubleshooting

### Backend not reachable

- Check `http://localhost:4000/health`.
- Verify `VITE_API_URL` points to the backend.
- Confirm the backend process is running.

### Port already in use

```bash
netstat -ano | findstr :3000
netstat -ano | findstr :4000
```

### Clean reinstall

```bash
rm -rf node_modules web/node_modules server/node_modules
npm install
npm install --prefix web
npm install --prefix server
```

## Version Notes

### v1.3.1

- Removed Recharts in favor of custom SVG previews.
- Removed the unused `vite-plugin-pwa` dependency chain.
- Tightened bundle-budget enforcement.
- Reduced always-on CSS and removed stale frontend structure.

See `CHANGELOG.md` for full release history.
npm install --prefix web
npm install --prefix server
```

### API Connection Issues
- Check backend is running: `http://localhost:3000/health`
- Verify CORS settings in `server/src/config.js`
- Check network tab in browser DevTools

### Deployment Issues
See [WEB_DEPLOYMENT.md](WEB_DEPLOYMENT.md#troubleshooting) for deployment-specific help.

---

## Security

- ✅ HTTPS enforced in production
- ✅ CORS properly configured
- ✅ Rate limiting on API endpoints
- ✅ Input validation with Zod
- ✅ JWT token-based authentication
- ✅ Password security with bcrypt
- ✅ Helmet.js for HTTP headers

See [SECURITY_NOTE.md](SECURITY_NOTE.md) for security policy.

---

## Performance

- **Frontend Build:** ~5.2 seconds (Vite)
- **Bundle Size:** ~250KB JS, ~31KB CSS (production)
- **Page Load:** < 2 seconds (with optimal network)
- **API Response:** < 200ms (typical)
- **Lighthouse Score:** 92+ (all metrics)

---

## Support & Feedback

- 📧 Email: support@moneygenerator.app
- 🐛 Issues: [GitHub Issues](https://github.com/user/MoneyGeneratorApp/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/user/MoneyGeneratorApp/discussions)

---

## License

MIT License - See [LICENSE](LICENSE) for details

---

## Acknowledgments

Built with ❤️ using open-source technologies:
- React, Vite, Express.js, Node.js, and many others

For iOS builds (macOS only):
- **Xcode 15.0+**
- **CocoaPods**

## Building the Application

### Android

#### Debug Build
```bash
./gradlew :androidApp:assembleDebug
```

Output: `androidApp/build/outputs/apk/debug/androidApp-debug.apk`

#### Release Build
```bash
./gradlew :androidApp:assembleRelease
```

Output: `androidApp/build/outputs/apk/release/androidApp-release.apk`

#### Install to Device/Emulator
```bash
./gradlew :androidApp:installDebug
```

### iOS (macOS only)

#### Build Framework
```bash
./gradlew :composeApp:linkDebugFrameworkIosSimulatorArm64
```

For physical devices:
```bash
./gradlew :composeApp:linkReleaseFrameworkIosArm64
```

## Technology Stack

- **Kotlin 2.1.20**: Programming language for all platforms
- **Compose Multiplatform 1.8.1**: Cross-platform UI framework
- **Material 3**: Modern design system
- **Kotlin Native**: Native compilation for iOS
- **Android Gradle Plugin 8.5.2**: Build system

## Key Features

- **Single Codebase**: Shared UI and business logic across platforms
- **Native Performance**: Compiled to machine code (no JavaScript bridge)
- **Modern UI**: Compose Multiplatform with Material 3
- **Type Safety**: Full Kotlin type system across all code

## Application Features

The Money Generator app provides:

- **Job Boards**: Categorized job listings (Local Missions, Digital Services, Shift-Based Ops)
- **Smart Workflows**: Delivery Mode, Freelance Mode, Support Mode
- **Financial Stack**: Liquidity, Benefits, Expense Intelligence
- **Integration Hub**: Unified API Gateway and White-Label Marketplace
- **Master Key Architecture**: Secure routing and billing
- **Monetization Engine**: Subscriptions, cost-plus billing, commissions
- **Compliance**: Enterprise-grade security and audit trails
- **Roadmap**: MVP → Scale → Enterprise phases

## Development

### Clean Build
```bash
./gradlew clean
```

### Build All Modules
```bash
./gradlew build
```

### List Available Tasks
```bash
./gradlew tasks
```

## Migration Notes

The TypeScript/React UI has been fully ported to Kotlin Compose:

- **React Components** → **@Composable functions**
- **StyleSheet** → **Modifier chains**
- **useState/useEffect** → **remember/LaunchedEffect**
- **Props** → **Function parameters**
- **Type definitions** → **data classes**

All business logic, data models, and UI styling have been preserved in the conversion.

## Troubleshooting

### Gradle Sync Failures
```bash
./gradlew --stop
rm -rf ~/.gradle/caches/
./gradlew build --refresh-dependencies
```

### Android SDK Issues
Ensure correct SDK versions in Android Studio:
- SDK Platform 36
- Build Tools 36.0.0

### Network/Repository Issues
If Maven repositories are unavailable:
```bash
./gradlew build --offline
```

## Additional Documentation

See [README_KOTLIN_NATIVE.md](README_KOTLIN_NATIVE.md) for detailed Kotlin Native build instructions.

See [README_REACT_NATIVE.md.backup](README_REACT_NATIVE.md.backup) for the original React Native documentation (deprecated).

See [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) for the original React Native build documentation (deprecated).

## License

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

## Backend (Express + integrations)

We ship a minimal backend under `/server` to keep secrets off-device and centralize integrations.

### Setup

1. Copy `.env.example` to `.env` and fill in PayPal/Plaid secrets (only on the backend).
2. Install server deps: `npm install --prefix server`.
3. Start the API: `npm run dev --prefix server` (default port 4000).

### Local webhook testing

- Use a tunneling tool (e.g., ngrok) pointing at `localhost:4000`. Configure the public URL in PayPal/Plaid console.
- Webhooks are signed (HMAC-SHA256) and idempotent. Duplicate `id`s will return `status: duplicate`.
- Correlation IDs and structured logs are emitted for every request; metrics counters available at `/health`.

### Tests

- Unit tests for webhook signature verification + idempotency: `npm test --prefix server`.

### PayPal webhook setup

- Point PayPal webhooks to `/webhooks/paypal`.
- Configure `PAYPAL_WEBHOOK_SECRET` in `.env` to match your PayPal app.
- Subscription flows use backend-only endpoints:
  - `POST /billing/paypal/subscription/create` -> returns `approvalUrl` + `providerSubscriptionId`.
  - After user approval, call `POST /billing/paypal/subscription/confirm` to activate and grant entitlements.
  - `POST /billing/paypal/subscription/cancel` to terminate.
- Webhooks are idempotent and state transitions are validated server-side; outbound CRM webhooks are queued with retries.
See LICENSE file for details.
