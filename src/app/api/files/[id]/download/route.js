import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { getFileById } from '@/lib/repositories/fileRepository.js';
import { readFileBuffer } from '@/lib/fileStorage.js';

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

  const buffer = await readFileBuffer(record.storage_path);
  const response = new NextResponse(buffer);
  response.headers.set('Content-Type', record.mime_type || 'application/octet-stream');
  response.headers.set('Content-Disposition', `attachment; filename="${record.original_name}"`);
  return response;
}
