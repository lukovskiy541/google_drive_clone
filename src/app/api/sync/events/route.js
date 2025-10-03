import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth.js';
import { subscribeToSync, ensureWatchers } from '@/lib/syncService.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Необхідна авторизація' }, { status: 401 });
  }

  ensureWatchers(user.id);

  let unsubscribe = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload) => {
        controller.enqueue(`data: ${JSON.stringify(payload)}\n\n`);
      };

      send({ type: 'connected', at: new Date().toISOString() });

      unsubscribe = subscribeToSync(user.id, (payload) => {
        send(payload);
      });

      request.signal.addEventListener('abort', () => {
        unsubscribe();
      });
    },
    cancel() {
      unsubscribe();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    }
  });
}
