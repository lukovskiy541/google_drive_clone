import db from '../db.js';

export function getLastSyncedAtForUser(userId) {
  const stmt = db.prepare('SELECT last_synced_at FROM sync_states WHERE user_id = ?');
  const row = stmt.get(userId);
  return row?.last_synced_at ?? null;
}

export function setLastSyncedAtForUser(userId, timestamp) {
  const stmt = db.prepare(
    'INSERT INTO sync_states (user_id, last_synced_at) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET last_synced_at = excluded.last_synced_at'
  );
  stmt.run(userId, timestamp);
  return timestamp;
}
