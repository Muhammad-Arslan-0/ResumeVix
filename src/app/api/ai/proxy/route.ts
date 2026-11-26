import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'api.anthropic.com',
  'api.openai.com',
  'openrouter.ai',
  'generativelanguage.googleapis.com',
  'localhost',
  '127.0.0.1',
]);

export async function POST(req: NextRequest) {
  try {
    const { url, headers, body } = (await req.json()) as {
      url?: string;
      headers?: Record<string, string>;
      body?: unknown;
    };

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Missing target url' }, { status: 400 });
    }

    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.has(parsed.hostname) && parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'Disallowed target host' }, { status: 403 });
    }

    // Stateless pass-through: nothing is logged or persisted
    const upstream = await fetch(url, {
      method: 'POST',
      headers: headers ?? { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Proxy error' },
      { status: 502 }
    );
  }
}
