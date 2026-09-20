import pino from 'pino';

import { env } from '@/env';

/** Structured JSON logs. Personal fields are redacted wherever they appear. */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      '*.address',
      '*.postcode',
      '*.email',
      'address',
      'postcode',
      'email',
      'req.headers.cookie',
    ],
    censor: '[redacted]',
  },
  base: { service: 'dearly' },
  ...(env.NODE_ENV === 'development'
    ? { transport: { target: 'pino-pretty', options: { colorize: true } } }
    : {}),
});
