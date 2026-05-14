import cors from 'cors';
import { env } from '../config/env';

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * CORS controls which websites can make API requests to our backend.
 * Without this, the browser blocks frontend → backend communication
 * because they run on different ports (8100 vs 3000).
 *
 * In production, we only allow our own frontend domain.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      env.FRONTEND_URL,
      'http://localhost:8100',      // Ionic dev server
      'http://localhost:4200',      // Angular dev server
      'capacitor://localhost',       // Capacitor on iOS
      'http://localhost',            // Capacitor on Android
    ];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked request from: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,               // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  maxAge: 86400,                    // Cache preflight for 24 hours
});
