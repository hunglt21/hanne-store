import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  jwtSecret: process.env.JWT_SECRET || 'hanne-store-dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  // Comma-separated allowed origins, or "*" for any (default; safe because same-origin in prod).
  corsOrigin: process.env.CORS_ORIGIN || '*',
};
