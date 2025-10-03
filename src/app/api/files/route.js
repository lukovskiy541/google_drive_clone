import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { uploadFileForUser, fetchFilesForUser } from '@/lib/fileService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get('sort') ?? 'extension';
  const order = searchParams.get('order') ?? 'asc';
  const filter = searchParams.get('filter') ?? 'all';

  const files = fetchFilesForUser(user.id, { sort, order, filter });
  return NextResponse.json({ files });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'Файл не отримано' }, { status: 400 });
  }

  try {
    const saved = await uploadFileForUser(user, file);
    return NextResponse.json({ ok: true, file: saved });
  } catch (error) {
    console.error('Upload error', error);
    return NextResponse.json({ error: 'Не вдалося зберегти файл' }, { status: 500 });
  }
}
