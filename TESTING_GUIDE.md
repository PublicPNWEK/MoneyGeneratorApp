## How to test locally

This project has two Jest suites: the React Native app and the Node backend. No real PayPal or Plaid credentials are required—webhooks are signed using demo secrets and provider calls are mocked.

### Commands

- Run app tests: `npm test`
- Run backend tests: `npm run test:server`
- Run everything (CI-equivalent): `npm run test:ci`

### Sample webhook payloads

Secrets default to `demo-paypal-secret` and `demo-plaid-secret`. Use the HMAC helper below to generate a matching signature for manual testing.

```bash
# Generate signatures for sample payloads
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

Send the payloads to the local server (default port `4000` if running `node server/src/index.js`):

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

Both endpoints are idempotent: re-sending the same payload will return `{ "status": "duplicate" }`.
