import 'dotenv/config';

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { env } from '../../config/env.js';
import { seedRbac } from './rbac.js';
import { seedusers } from './users.js';

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 1000,
  maxUses: 7500,
});

export const dbSeed = drizzle({
  client: pool
});

try {
  await seedRbac(dbSeed);
  await seedusers(dbSeed);
} finally {
  await pool.end();
}