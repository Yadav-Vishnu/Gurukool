import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { testConnection } from './config/database';
import { testRedisConnection } from './config/redis';
import { configurePassport } from './config/passport';
import { corsMiddleware } from './middleware/cors';
import { requestLogger } from './middleware/logger';
import { errorHandler } from './middleware/error-handler';
import { apiRateLimiter } from './middleware/rate-limiter';
import passport from 'passport';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import sessionRoutes from './modules/session/session.routes';
import testEngineRoutes from './modules/test-engine/test-engine.routes';
import booksRoutes from './modules/books/books.routes';
import communityRoutes from './modules/community/community.routes';
import engagementRoutes from './modules/engagement/engagement.routes';
import platformRoutes from './modules/platform/platform.routes';

/**
 * Gurukool Backend Server
 *
 * Express app with:
 * - Security headers (Helmet)
 * - CORS for cross-origin requests
 * - Request logging
 * - Rate limiting
 * - Google OAuth (Passport)
 * - Modular routing
 * - Centralized error handling
 */
const app = express();

// ============================================================
// Global Middleware (order matters!)
// ============================================================

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS
app.use(corsMiddleware);

// Parse JSON bodies. PDF uploads are base64 encoded, so the body is larger than the file.
app.use(express.json({ limit: '20mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting on all API routes
app.use('/api', apiRateLimiter);

// Passport (Google OAuth)
configurePassport();
app.use(passport.initialize());

// ============================================================
// Health Check
// ============================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gurukool-backend',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gurukool-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ============================================================
// API Routes
// ============================================================

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/tests', testEngineRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/engagement', engagementRoutes);
app.use('/api/platform', platformRoutes);

// ============================================================
// 404 Handler (must be after all routes)
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ============================================================
// Global Error Handler (must be LAST middleware)
// ============================================================

app.use(errorHandler);

// ============================================================
// Start Server
// ============================================================

const startServer = async () => {
  console.log('\n🎓 ======================================');
  console.log('   GURUKOOL Backend Server Starting...');
  console.log('   ======================================\n');

  // Test database connections
  const dbConnected = await testConnection();
  const redisConnected = await testRedisConnection();

  if (!dbConnected) {
    console.error('❌ Cannot start without PostgreSQL. Is Docker running?');
    console.error('   Run: docker-compose up -d');
    process.exit(1);
  }

  if (!redisConnected) {
    console.error('❌ Cannot start without Redis. Is Docker running?');
    console.error('   Run: docker-compose up -d');
    process.exit(1);
  }

  // Start listening
  app.listen(env.PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${env.PORT}`);
    console.log(`📊 Health check: http://localhost:${env.PORT}/health`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
    console.log('\n📋 API Endpoints:');
    console.log('   POST /api/auth/otp/send       → Send OTP');
    console.log('   POST /api/auth/otp/verify     → Verify OTP');
    console.log('   GET  /api/auth/google         → Google OAuth');
    console.log('   POST /api/auth/refresh        → Refresh Token');
    console.log('   POST /api/auth/logout         → Logout');
    console.log('   GET  /api/users/me            → My Profile');
    console.log('   PUT  /api/users/me            → Update Profile');
    console.log('   GET  /api/sessions            → My Sessions');
    console.log('\n🎓 Gurukool backend is ready!\n');
  });
};

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default app;
