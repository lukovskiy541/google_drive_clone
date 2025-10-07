import { Pool } from 'pg';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('POSTGRES_URL (or DATABASE_URL) is not set. Please define it in your environment.');
}

const pool = new Pool({ connectionString });

let schemaPromise = null;

async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            display_name TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS files (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            extension TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            storage_path TEXT NOT NULL,
            size_bytes BIGINT NOT NULL,
            uploaded_by TEXT NOT NULL,
            edited_by TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS sync_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            local_dir TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        `);

        await client.query(`
          CREATE TABLE IF NOT EXISTS sync_states (
            user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            last_synced_at TEXT
          )
        `);

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

export async function query(text, params = []) {
  await ensureSchema();
  return pool.query(text, params);
}

export async function getClient() {
  await ensureSchema();
  return pool.connect();
}

export { pool };

export default {
  query,
  getClient,
  pool
};
