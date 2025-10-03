import { customAlphabet } from 'nanoid';
import { formatISO } from 'date-fns';
import db from '../db.js';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

export function createUser({ username, passwordHash, displayName }) {
  const id = nanoid();
  const createdAt = formatISO(new Date());

  const stmt = db.prepare(`
    INSERT INTO users (id, username, password, display_name, created_at)
    VALUES (@id, @username, @password, @display_name, @created_at)
  `);

  stmt.run({
    id,
    username,
    password: passwordHash,
    display_name: displayName,
    created_at: createdAt
  });

  return { id, username, displayName, createdAt };
}

export function findUserByUsername(username) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) ?? null;
}

export function findUserById(id) {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id) ?? null;
}
