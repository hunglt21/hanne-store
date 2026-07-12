import express from 'express';
import cors from 'cors';
import path from 'node:path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { CLIENT_DIST, hasClientBuild } from './paths.js';
import { env } from './env.js';
import { authRequired } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import invoiceRoutes from './routes/invoices.js';
import statsRoutes from './routes/stats.js';
import uploadRoutes from './routes/upload.js';
import imageRoutes from './routes/images.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1); // behind Render/Fly proxy

  // Security headers. CSP disabled to avoid blocking the SPA (Google Fonts, emotion inline styles).
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'same-origin' } }));

  // CORS: same-origin in production; allow the configured origin (or all) otherwise.
  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin.split(',') }));

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'hanne-store-api', time: new Date().toISOString() }));

  // Public: product images (referenced directly by <img>)
  app.use('/api/images', imageRoutes);

  // Throttle login to slow brute-force attempts.
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Quá nhiều lần thử đăng nhập, vui lòng đợi ít phút.' },
  });
  app.use('/api/auth/login', loginLimiter);

  // Public auth (login, me, change-password have their own guards)
  app.use('/api/auth', authRoutes);

  // Protected API
  app.use('/api/products', authRequired, productRoutes);
  app.use('/api/customers', authRequired, customerRoutes);
  app.use('/api/invoices', authRequired, invoiceRoutes);
  app.use('/api/stats', authRequired, statsRoutes);
  app.use('/api/upload', authRequired, uploadRoutes);

  // Unknown API routes → JSON 404 (before the SPA catch-all)
  app.use('/api', notFound);

  // Serve the built SPA (production). In dev, Vite serves the client instead.
  if (hasClientBuild) {
    app.use(express.static(CLIENT_DIST));
    app.get('*', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  } else {
    app.use(notFound);
  }

  app.use(errorHandler);
  return app;
}
