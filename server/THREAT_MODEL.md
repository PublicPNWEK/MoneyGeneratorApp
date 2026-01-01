# Threat Model

## Scope and Goals
The backend processes billing (PayPal), financial aggregation (Plaid), and outbound CRM webhooks. Goals are to prevent token/secret leakage, ensure webhook authenticity and replay safety, and enforce authorization boundaries for billing and admin operations.

## Assets
- PayPal, Plaid, and CRM secrets
- User subscription state and entitlements
- Outbound webhook payloads and delivery guarantees
- Logs containing operational metadata

## Adversaries & Assumptions
- Network attacker capable of replaying or spoofing webhook traffic.
- Insider or log consumer attempting to exfiltrate secrets/PII.
- Misconfigured clients bypassing business logic through unauthenticated requests.

## Key Threats & Mitigations
### Token leakage
- **Threat:** Secrets or bearer tokens appear in application logs or are echoed back to clients.
- **Mitigations:**
  - Centralized configuration validation ensures secrets are loaded from environment with sane defaults and not accidentally undefined.
  - Request logger redacts any `token`, `secret`, `authorization`, `accessToken`, or `accountNumber` keys (and nested values) before emitting logs.
  - No raw request bodies or secrets are logged.

### Replay attacks on webhooks
- **Threat:** An attacker replays a previously valid webhook to mutate state multiple times.
- **Mitigations:**
  - PayPal and Plaid webhooks require HMAC signatures plus a timestamp header and are rejected when outside the replay window defined in configuration.
  - Webhooks are normalized prior to verification to avoid signature ambiguities.
  - Event IDs are stored in-memory; duplicates short-circuit processing.

### Idempotency failures
- **Threat:** Reprocessing the same webhook causes duplicate side effects (e.g., double entitlements or outbound events).
- **Mitigations:**
  - Events are recorded by ID; duplicates return immediately without additional side effects.
  - Outbound webhook queue tracks attempts/status to prevent duplicated deliveries.

### PII leakage in logs
- **Threat:** Sensitive user/payment data is written to logs.
- **Mitigations:**
  - Structured logger redacts tokens/secrets/account numbers across nested metadata.
  - Webhook bodies are not logged; only minimal IDs and statuses are emitted.
  - Rate limits and auth checks reduce exposure to noisy/abusive requests.

## Residual Risks & Next Steps
- In-memory replay cache will reset on process restart; persistent storage would harden deduplication.
- Webhook HMAC key rotation and per-tenant secrets are not yet implemented.
- Outbound delivery currently simulates posting; add real HTTP client with retry/backoff and response validation.
- Expand authorization to all user-specific resources once an authentication system is integrated.
