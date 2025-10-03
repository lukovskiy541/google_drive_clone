import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { triggerManualSync } from '@/lib/fileService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const { lastSyncedAt } = (await triggerManualSync(user.id)) ?? {};
  return NextResponse.json({ ok: true, lastSync: lastSyncedAt ?? null });
}
