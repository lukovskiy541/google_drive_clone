import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { pickDirectoryViaSystem } from '@/lib/utils/folderPicker.js';
import { updateLocalSyncDir } from '@/lib/syncService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  try {
    const outcome = pickDirectoryViaSystem();

    if (outcome.cancelled) {
      return NextResponse.json({ cancelled: true });
    }

    if (!outcome.path) {
      return NextResponse.json({ error: 'Не вдалося визначити шлях до папки' }, { status: 500 });
    }

    const { profile, lastSyncedAt } = await updateLocalSyncDir(user.id, outcome.path);
    return NextResponse.json({ profile, lastSync: lastSyncedAt });
  } catch (error) {
    console.error('Folder picker error', error);
    return NextResponse.json(
      { error: error.message || 'Не вдалося відкрити діалог вибору директорії' },
      { status: 500 }
    );
  }
}
