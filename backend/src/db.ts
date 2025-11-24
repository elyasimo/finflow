import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../drizzle/schema.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://finflow:secret@localhost:5432/finflow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export default db;
