import { customAlphabet } from 'nanoid';
import { formatISO } from 'date-fns';
import { query } from '../db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

export async function createUser({ username, passwordHash, displayName }) {
  const id = nanoid();
  const createdAt = formatISO(new Date());

  await query(
    `
      INSERT INTO users (id, username, password, display_name, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [id, username, passwordHash, displayName, createdAt]
  );

  return { id, username, displayName, createdAt };
}

export async function findUserByUsername(username) {
  const { rows } = await query('SELECT * FROM users WHERE username = $1', [username]);
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}
