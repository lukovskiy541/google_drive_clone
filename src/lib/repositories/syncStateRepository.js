import { query } from '../db.js';

export async function getLastSyncedAtForUser(userId) {
  const { rows } = await query('SELECT last_synced_at FROM sync_states WHERE user_id = $1', [userId]);
  return rows[0]?.last_synced_at ?? null;
}

export async function setLastSyncedAtForUser(userId, timestamp) {
  await query(
    `
      INSERT INTO sync_states (user_id, last_synced_at)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET last_synced_at = EXCLUDED.last_synced_at
    `,
    [userId, timestamp]
  );

  return timestamp;
}
