import { customAlphabet } from 'nanoid';
import { formatISO } from 'date-fns';
import db from '../db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 18);

export function getSyncProfileByUserId(userId) {
  const stmt = db.prepare('SELECT * FROM sync_profiles WHERE user_id = ?');
  return stmt.get(userId) ?? null;
}

export function upsertSyncProfile(userId, localDir) {
  const existing = getSyncProfileByUserId(userId);

  if (existing) {
    const stmt = db.prepare('UPDATE sync_profiles SET local_dir = ? WHERE id = ?');
    stmt.run(localDir, existing.id);
    return { ...existing, local_dir: localDir };
  }

  const id = nanoid();
  const createdAt = formatISO(new Date());
  const stmt = db.prepare(
    'INSERT INTO sync_profiles (id, user_id, local_dir, created_at) VALUES (?, ?, ?, ?)'
  );
  stmt.run(id, userId, localDir, createdAt);

  return {
    id,
    user_id: userId,
    local_dir: localDir,
    created_at: createdAt
  };
}

export function deleteSyncProfile(id) {
  const stmt = db.prepare('DELETE FROM sync_profiles WHERE id = ?');
  stmt.run(id);
}
