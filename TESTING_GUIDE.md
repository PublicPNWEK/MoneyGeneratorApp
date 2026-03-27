## How to test locally

This repository currently has one automated test suite: the Node/Express backend. The web app is validated through linting and production builds rather than a frontend Jest or Vitest suite. No real PayPal or Plaid credentials are required for backend tests because webhook secrets default to demo values and provider calls are mocked.

### Commands

- Run backend tests: `npm test`
- Run backend tests directly: `npm run test:server`
- Verify the frontend release build: `npm run build:budget`
- Lint the web app: `npm run lint`
- Smoke-check a running backend: `SMOKE_BASE_URL=http://localhost:4000 npm run smoke:prod`

## Sample webhook payloads

Secrets default to `demo-paypal-secret` and `demo-plaid-secret`. Use the HMAC helper below to generate a matching signature for manual testing.

```bash
node - <<'NODE'
const crypto = require('crypto');
const sign = (secret, body) => crypto.createHmac('sha256', secret).update(body).digest('hex');

const paypalBody = JSON.stringify({ id: 'evt_demo_paypal', event_type: 'PAYMENT.SALE.COMPLETED' });
const plaidBody = JSON.stringify({ webhook_code: 'SYNC_UPDATES_AVAILABLE', item_id: 'item_demo_1' });

console.log('PayPal signature:', sign('demo-paypal-secret', paypalBody));
console.log('Plaid signature:', sign('demo-plaid-secret', plaidBody));
console.log('PayPal body:', paypalBody);
console.log('Plaid body:', plaidBody);
NODE
```

Send the payloads to the local server running on port `4000`:

```bash
curl -X POST http://localhost:4000/webhooks/paypal \
  -H "Content-Type: application/json" \
  -H "x-paypal-signature: <paypal-signature-from-script>" \
  -d '<paypal-body-from-script>'

curl -X POST http://localhost:4000/webhooks/plaid \
  -H "Content-Type: application/json" \
  -H "x-plaid-signature: <plaid-signature-from-script>" \
  -d '<plaid-body-from-script>'
```

Both endpoints are idempotent: re-sending the same payload returns `{ "status": "duplicate" }`.

## Production smoke script

The repository includes a lightweight smoke script at `scripts/smoke-check.mjs`.

It verifies:

- `GET /health`
- `GET /catalog`
- `POST /api/v2/assets/upload-url`
- `GET /api/v2/ops/overview` when `SMOKE_OPERATOR_TOKEN` is provided

Example:

```bash
SMOKE_BASE_URL=https://your-backend.example \
SMOKE_OPERATOR_TOKEN=your-operator-token \
npm run smoke:prod
```
