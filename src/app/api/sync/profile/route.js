import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { getEffectiveLocalSyncDir, getLastSyncTimestamp, updateLocalSyncDir } from '@/lib/syncService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const profile = getEffectiveLocalSyncDir(user.id);
  const lastSync = getLastSyncTimestamp(user.id);

  return NextResponse.json({ profile, lastSync });
}

export async function PUT(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Некоректний формат запиту' }, { status: 400 });
  }

  const rawDir = typeof payload?.localDir === 'string' ? payload.localDir.trim() : '';
  if (!rawDir) {
    return NextResponse.json({ error: 'Шлях до каталогу обов\'язковий' }, { status: 400 });
  }

  const resolved = path.resolve(rawDir);

  try {
    const stats = fs.existsSync(resolved) ? fs.statSync(resolved) : null;
    if (stats && !stats.isDirectory()) {
      return NextResponse.json({ error: 'Вказаний шлях не є директорією' }, { status: 400 });
    }

    const { profile, lastSyncedAt } = await updateLocalSyncDir(user.id, resolved);
    return NextResponse.json({ profile, lastSync: lastSyncedAt });
  } catch (error) {
    console.error('Failed to update sync directory', error);
    return NextResponse.json({ error: 'Не вдалося оновити каталог синхронізації' }, { status: 500 });
  }
}
