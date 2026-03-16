# Copilot Instructions — MoneyGeneratorApp

## What This App Does

A SaaS platform for gig economy workers (freelancers, drivers, etc.) to manage income streams, track mileage, handle taxes, connect to gig platforms (Plaid, Stripe), manage teams, and monetize via subscriptions. It has a public-facing storefront for end-customers.

---

## Repository Layout

```
web/        React 18 SPA (TypeScript, Vite) — deployed to Netlify
server/     Express.js API (Node.js ESM) — deployed to Railway/Render
scripts/    Provisioning and smoke-check scripts
__tests__/  Root-level tests (if any)
```

---

## Commands

### Root (runs web or server sub-commands)
```bash
npm run dev            # Start web dev server (port 3000)
npm run build          # tsc + vite build (web)
npm run build:budget   # Build with strict bundle size enforcement (fails on violation)
npm run analyze        # Build + generate dist/bundle-analysis.html treemap
npm run lint           # ESLint on web/
npm test               # Run server tests via Jest
npm run provision      # Run environment provisioning checks + fixes
npm run smoke:prod     # Run smoke checks against production
```

### Web (from `web/`)
```bash
npm run dev            # Vite dev server on port 3000
npm run build          # tsc && vite build
npm run lint:fix       # ESLint with --fix
```

### Server (from `server/`)
```bash
npm run dev            # node src/index.js (development)
npm test               # Jest (node --experimental-vm-modules)

# Run a single test file:
npm test -- --testPathPattern=v2.test.js
# or a single test by name:
npm test -- --testNamePattern="should return 200"
```

---

## Architecture

### Frontend (`web/src/`)

**Context-based state management** — no Redux or Zustand. All global state lives in three providers nested in `App.tsx`:

| Context | Purpose |
|---|---|
| `AuthContext` | JWT auth state, login/logout/register |
| `AppContext` | Subscription, earnings, products, onboarding gate |
| `ThemeContext` | Dark/light theme |
| `OnboardingProvider` | Onboarding wizard flow state |

**Every page is lazy-loaded** via `React.lazy()`. Named exports use the async wrapper pattern:
```tsx
const DashboardPageV2 = lazy(async () => ({
  default: (await import('./pages/DashboardPageV2')).DashboardPageV2,
}));
```
Default exports use the shorter form: `lazy(() => import('./pages/LoginPage'))`.

**API calls** all go through `web/src/lib/apiClient.ts` → `apiFetchJson<T>(path, options)`. This handles auth headers (reads `auth_token` from `localStorage`), base URL from `VITE_API_URL`, and fires a `moneygen:auth-expired` custom event on 401.

**Routing** (`react-router-dom` v7):
- `/login`, `/register` — public, redirects out if already authed (`PublicOnlyRoute`)
- `/storefront/:accountId` — public (customer-facing)
- `/` and all sub-paths — protected via `ProtectedRoute`, rendered inside `AppLayout`
- Authenticated users who haven't completed onboarding see `OnboardingWizard` instead of routes

**Styling**: Each component has a co-located `.css` file (e.g., `Button.tsx` + `Button.css`). Global design system tokens are in `web/src/design-system.css` and `web/src/styles/designSystem.css`. Lucide React is used for all icons.

**Bundle budgets** are enforced by a custom Vite plugin in `vite.config.ts`. Key limits: entry JS 80 kB, route chunks 50 kB, vendor-react 200 kB. `npm run build:budget` fails the build on violations; `npm run build` warns only.

---

### Backend (`server/src/`)

**ESM only** (`"type": "module"` in `server/package.json`). All imports must use `.js` extensions, including local files.

**Route structure** (mounted in `app.js`):
| Path | File | Notes |
|---|---|---|
| `/auth/*` | `routes/auth.js` | Stricter rate limit (20 req/15min) |
| `/api/v1/*` | `routes/api.js` | Gig platforms, advances, benefits, expenses, notifications, profiles |
| `/api/v2/*` | `routes/v2.js` | Newer feature endpoints |
| `/api/payments/*` | `routes/payments.js` | Stripe payments |
| `/api/connect/*` | `routes/connect.js` | Stripe Connect (connected accounts, products, checkout) |
| `/api/connect/webhooks` | `routes/connectWebhooks.js` | Stripe Connect webhook handler |
| `/webhooks/paypal`, `/webhooks/plaid` | `app.js` | Legacy webhook handlers |
| `/integrations/*`, `/billing/*` | `app.js` | Legacy endpoints |

**Auth middleware** (defined in `app.js`):
- `requireUser` — JWT or static token required, attaches `req.user`
- `requireAdmin` — user must have `role === 'admin'`
- In non-production environments, `userId` in the request body is accepted as a test user shortcut

**Database**: PostgreSQL via `pg` Pool. The server starts without a DB connection (falls back to in-memory `Map`-based models in `src/models.js`). Migrations live in `src/migrations/`.

**Services** in `server/src/services/` are domain modules (e.g., `authService.js`, `stripeService.js`, `stripeConnectService.js`, `taxService.js`, `mileageService.js`). Import and call them directly from route handlers.

**Validation** uses Zod schemas defined in `src/validation.js`. Use `validate(schema)` middleware for request body validation and `validateQuery(schema)` for query params.

**Caching**: `cacheMiddleware(ttlSeconds, keyFn?)` adds in-memory response caching. `cacheUtils.invalidatePattern(pattern)` clears matching keys after mutations.

**API response conventions**:
- Success: `{ success: true, data: { ... } }` or `{ success: true, message: "..." }`
- Error: `{ error: "message_string" }` with appropriate HTTP status

---

## Environment Variables

### Web (`web/.env`)
```
VITE_API_URL=http://localhost:4000   # Backend URL; empty = same origin
VITE_V2_ENABLED=true
```
In dev, Vite proxies `/api/*` and `/auth/*` to `VITE_API_URL` (default port 4000), so the web app can call these paths without specifying the full URL.

### Server (`server/.env`)
Key vars: `PORT` (default 4000), `DATABASE_URL`, `JWT_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET`. See `server/.env.example` for the full list.

---

## Key Conventions

- **Auth tokens** are stored in `localStorage` under keys `auth_token`, `auth_user`, and `userId`.
- **Context hooks** (`useAuth`, `useAppContext`, `useTheme`) throw if called outside their provider — always ensure components are inside the correct provider tree.
- **Named component exports**: pages and components use named exports. The default export in `App.tsx` is the exception.
- **Server imports**: always use `.js` extension on relative imports (ESM requirement), even for `.js` source files.
- **In-memory fallback**: if `initDatabase()` fails, the server continues using `Models` (Maps) from `src/models.js`. New features should handle both DB and in-memory paths, or rely on services that abstract this.
- **Stripe Connect** is a first-class feature: connected accounts, products, and checkout flow are separate from the main Stripe payment flow.
