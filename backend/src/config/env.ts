import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(24),
  AUTH_CACHE_TTL_SECONDS: z.coerce.number().int().min(0).default(30),
});

export const env = envSchema.parse(process.env);
