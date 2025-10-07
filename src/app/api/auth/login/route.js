import { NextResponse } from 'next/server';
import { findUserByUsername } from '@/lib/repositories/userRepository.js';
import { validatePassword, issueToken, setAuthCookie } from '@/lib/auth.js';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const username = (body.username || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!username || !password) {
      return NextResponse.json({ error: 'Уведіть логін і пароль' }, { status: 400 });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Невірний логін або пароль' }, { status: 401 });
    }

    const ok = await validatePassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Невірний логін або пароль' }, { status: 401 });
    }

    const token = issueToken({ userId: user.id, username: user.username });
    await setAuthCookie(token);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name
      }
    });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Сталася помилка авторизації' }, { status: 500 });
  }
}
