import { randomUUID } from 'crypto';

export function requestLogger(req, _res, next) {
  const correlationId = req.headers['x-correlation-id'] || randomUUID();
  req.correlationId = correlationId;
  req.log = createLogger(correlationId);
  next();
}

function createLogger(correlationId) {
  return {
    info: (message, meta = {}) =>
      console.log(JSON.stringify({ level: 'info', correlationId, message, ...meta })),
    warn: (message, meta = {}) =>
      console.warn(JSON.stringify({ level: 'warn', correlationId, message, ...meta })),
    error: (message, meta = {}) =>
      console.error(JSON.stringify({ level: 'error', correlationId, message, ...meta })),
  };
}
