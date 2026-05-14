import morgan from 'morgan';
import { env } from '../config/env';

/**
 * Request Logger Middleware
 *
 * Logs every HTTP request to the console.
 * - Development: detailed colored output with response time
 * - Production: compact Apache-style logs for log aggregation
 */

// Custom token for colored status codes
morgan.token('status-colored', (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;       // Red
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`;       // Yellow
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;       // Cyan
  return `\x1b[32m${status}\x1b[0m`;                           // Green
});

const devFormat = ':method :url :status-colored :response-time ms - :res[content-length]';
const prodFormat = 'combined';

export const requestLogger = morgan(
  env.NODE_ENV === 'development' ? devFormat : prodFormat,
  {
    // Don't log health check endpoints (they're noisy)
    skip: (req) => req.url === '/health' || req.url === '/api/health',
  }
);
