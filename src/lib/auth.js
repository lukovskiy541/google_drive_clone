import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { findUserById } from './repositories/userRepository.js';

const TOKEN_NAME = 'drive_token';
const ONE_WEEK = 7 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Please define it in .env.local');
  }
  return secret;
}

export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function validatePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function issueToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function decodeToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (error) {
    return null;
  }
}

export async function setAuthCookie(token) {
  const store = await cookies();
  store.set({
    name: TOKEN_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: ONE_WEEK,
    sameSite: 'lax',
    path: '/' 
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(TOKEN_NAME);
}

export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(TOKEN_NAME)?.value;
  if (!token) {
    return null;
  }

  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  return (await findUserById(decoded.userId)) ?? null;
}
