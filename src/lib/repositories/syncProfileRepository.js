import { customAlphabet } from 'nanoid';
import { formatISO } from 'date-fns';
import { query } from '../db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 18);

export async function getSyncProfileByUserId(userId) {
  const { rows } = await query('SELECT * FROM sync_profiles WHERE user_id = $1', [userId]);
  return rows[0] ?? null;
}

export async function upsertSyncProfile(userId, localDir) {
  const existing = await getSyncProfileByUserId(userId);

  if (existing) {
    const { rows } = await query(
      'UPDATE sync_profiles SET local_dir = $1 WHERE id = $2 RETURNING *',
      [localDir, existing.id]
    );
    return rows[0] ?? { ...existing, local_dir: localDir };
  }

  const id = nanoid();
  const createdAt = formatISO(new Date());
  const { rows } = await query(
    'INSERT INTO sync_profiles (id, user_id, local_dir, created_at) VALUES ($1, $2, $3, $4) RETURNING *',
    [id, userId, localDir, createdAt]
  );

  return rows[0] ?? {
    id,
    user_id: userId,
    local_dir: localDir,
    created_at: createdAt
  };
}

export async function deleteSyncProfile(id) {
  await query('DELETE FROM sync_profiles WHERE id = $1', [id]);
}
