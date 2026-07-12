import express from 'express';
import cors from 'cors';
import { UPLOAD_DIR } from './paths.js';
import { authRequired } from './middleware/auth.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import customerRoutes from './routes/customers.js';
import invoiceRoutes from './routes/invoices.js';
import statsRoutes from './routes/stats.js';
import uploadRoutes from './routes/upload.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '5mb' }));

  // Serve uploaded product images.
  app.use('/uploads', express.static(UPLOAD_DIR));

  app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'hanne-store-api', time: new Date().toISOString() }));

  // Public
  app.use('/api/auth', authRoutes);

  // Protected
  app.use('/api/products', authRequired, productRoutes);
  app.use('/api/customers', authRequired, customerRoutes);
  app.use('/api/invoices', authRequired, invoiceRoutes);
  app.use('/api/stats', authRequired, statsRoutes);
  app.use('/api/upload', authRequired, uploadRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
