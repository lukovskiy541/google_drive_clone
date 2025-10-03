import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      createdAt: user.created_at
    }
  });
}
