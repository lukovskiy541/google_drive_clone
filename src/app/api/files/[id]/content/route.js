import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { getPreviewPayload } from '@/lib/fileService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const preview = await getPreviewPayload(user.id, params.id);
  if (!preview) {
    return NextResponse.json({ error: 'Файл не знайдено' }, { status: 404 });
  }

  return NextResponse.json(preview);
}
