import { setTimeout as delay } from 'timers/promises';

const DEFAULT_TOTAL_TIMEOUT_MS = 15000;
const DEFAULT_CONNECT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RETRIES = 3;

const TRANSIENT_STATUSES = new Set([408, 429]);

class CircuitBreaker {
  constructor({ failureThreshold = 3, cooldownMs = 30000, halfOpenMax = 1 } = {}) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this.halfOpenMax = halfOpenMax;
    this.state = 'closed';
    this.failures = 0;
    this.nextAttemptAt = 0;
    this.halfOpenAttempts = 0;
  }

  canRequest(now = Date.now()) {
    if (this.state === 'open' && now < this.nextAttemptAt) {
      return false;
    }
    if (this.state === 'open') {
      this.state = 'half_open';
      this.halfOpenAttempts = 0;
    }
    if (this.state === 'half_open' && this.halfOpenAttempts >= this.halfOpenMax) {
      return false;
    }
    return true;
  }

  recordSuccess() {
    this.state = 'closed';
    this.failures = 0;
    this.halfOpenAttempts = 0;
  }

  recordFailure(now = Date.now()) {
    if (this.state === 'half_open') {
      this.trip(now);
      return;
    }
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.trip(now);
    }
  }

  trip(now = Date.now()) {
    this.state = 'open';
    this.nextAttemptAt = now + this.cooldownMs;
  }

  registerHalfOpenAttempt() {
    if (this.state === 'half_open') {
      this.halfOpenAttempts += 1;
    }
  }
}

export class HttpClient {
  constructor({
    totalTimeoutMs = DEFAULT_TOTAL_TIMEOUT_MS,
    connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
    maxRetries = DEFAULT_MAX_RETRIES,
    failureThreshold = 3,
    cooldownMs = 30000,
  } = {}) {
    this.totalTimeoutMs = totalTimeoutMs;
    this.connectTimeoutMs = connectTimeoutMs;
    this.maxRetries = maxRetries;
    this.breakers = new Map();
    this.breakerConfig = { failureThreshold, cooldownMs };
  }

  getBreaker(key) {
    if (!this.breakers.has(key)) {
      this.breakers.set(key, new CircuitBreaker(this.breakerConfig));
    }
    return this.breakers.get(key);
  }

  shouldRetry({ status, error, retryOnStatuses }) {
    if (error) {
      return true;
    }
    const predicate = retryOnStatuses || (code => TRANSIENT_STATUSES.has(code) || code >= 500);
    return predicate(status);
  }

  async request({
    url,
    method = 'GET',
    headers = {},
    body,
    totalTimeoutMs,
    connectTimeoutMs,
    maxRetries,
    retryOnStatuses,
    log,
    tag = 'http_client',
  }) {
    const attempts = (maxRetries ?? this.maxRetries) + 1;
    const totalTimeout = totalTimeoutMs ?? this.totalTimeoutMs;
    const connectTimeout = connectTimeoutMs ?? this.connectTimeoutMs;
    const target = new URL(url);
    const breaker = this.getBreaker(target.origin);

    if (!breaker.canRequest()) {
      const error = new Error('circuit_open');
      error.code = 'CIRCUIT_OPEN';
      log?.warn('http_request_blocked', { tag, url, error: error.message });
      throw error;
    }

    let lastError;
    let lastResponse;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      if (breaker.state === 'half_open') {
        breaker.registerHalfOpenAttempt();
      }
      try {
        const response = await this.performFetch({
          url,
          method,
          headers,
          body,
          totalTimeout,
          connectTimeout,
        });

        lastResponse = response;
        if (response.ok) {
          breaker.recordSuccess();
          return response;
        }

        if (this.shouldRetry({ status: response.status, retryOnStatuses })) {
          lastError = new Error(`retryable_status_${response.status}`);
          breaker.recordFailure();
          await this.backoff(attempt, log, tag, response.status);
          continue;
        }

        breaker.recordSuccess();
        return response;
      } catch (err) {
        lastError = err;
        if (this.shouldRetry({ status: 0, error: err, retryOnStatuses }) && attempt < attempts) {
          breaker.recordFailure();
          await this.backoff(attempt, log, tag, err.code || err.name);
          continue;
        }
        breaker.recordFailure();
        throw err;
      }
    }

    if (lastResponse) return lastResponse;
    throw lastError || new Error('http_request_failed');
  }

  async performFetch({ url, method, headers, body, totalTimeout, connectTimeout }) {
    const controller = new AbortController();
    const totalTimer = setTimeout(() => controller.abort(new Error('total_timeout')), totalTimeout);
    const connectTimer = setTimeout(
      () => controller.abort(new Error('connect_timeout')),
      connectTimeout,
    );

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(totalTimer);
      clearTimeout(connectTimer);
    }
  }

  async backoff(attempt, log, tag, reason) {
    const delayMs = Math.min(30000, 250 * 2 ** (attempt - 1));
    log?.warn('http_request_retry', { tag, attempt, delayMs, reason });
    await delay(delayMs);
  }
}

export const httpClient = new HttpClient();
