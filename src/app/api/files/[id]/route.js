import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { getFileById } from '@/lib/repositories/fileRepository.js';
import { updateTextFile, removeFileForUser } from '@/lib/fileService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const record = await getFileById(params.id);
  if (!record || record.user_id !== user.id) {
    return NextResponse.json({ error: 'Файл не знайдено' }, { status: 404 });
  }

  return NextResponse.json({ file: record });
}

export async function PUT(request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const content = body.content ?? '';
    const updated = await updateTextFile(user, params.id, content);
    if (!updated) {
      return NextResponse.json({ error: 'Не вдалося оновити файл' }, { status: 400 });
    }

    return NextResponse.json({ ok: true, file: updated });
  } catch (error) {
    console.error('Put file error', error);
    return NextResponse.json({ error: 'Не вдалося зберегти файл' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  const removed = await removeFileForUser(user.id, params.id);
  if (!removed) {
    return NextResponse.json({ error: 'Файл не знайдено' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
