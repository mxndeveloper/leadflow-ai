// test-db-pg.mjs (note .mjs extension)
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env.local') });

const pool = new Pool({
  connectionString: process.env.POSTGRES_DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 30000,
});

const res = await pool.query('SELECT NOW()');
console.log('Connected!', res.rows[0]);
await pool.end();