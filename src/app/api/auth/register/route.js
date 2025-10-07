import { NextResponse } from 'next/server';
import { createUser, findUserByUsername } from '@/lib/repositories/userRepository.js';
import { hashPassword, issueToken, setAuthCookie } from '@/lib/auth.js';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const displayName = (body.displayName || '').trim();

    if (!username || !password || !displayName) {
      return NextResponse.json({ error: 'Будь ласка, заповніть усі поля' }, { status: 400 });
    }

    if (await findUserByUsername(username)) {
      return NextResponse.json({ error: 'Такий користувач вже існує' }, { status: 400 });
    }

    const hash = await hashPassword(password);
    const user = await createUser({ username, passwordHash: hash, displayName });

    const token = issueToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, displayName: user.displayName } });
  } catch (error) {
    console.error('Register error', error);
    return NextResponse.json({ error: 'Сталася помилка при реєстрації' }, { status: 500 });
  }
}
