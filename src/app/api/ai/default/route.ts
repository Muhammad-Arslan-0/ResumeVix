import { NextRequest, NextResponse } from 'next/server';

// Lightweight in-memory rate limiter per IP (20 requests / minute)
const rateBucket = new Map<string, { count: number; resetAt: number }>();
const ALLOWED_DEFAULT_MODELS = new Set(['gemini-3.5-flash-lite', 'gemini-3.8-flash']);

export async function POST(req: NextRequest) {
  const serverKey = process.env.GEMINI_API_KEY;
  if (!serverKey) {
    return NextResponse.json(
      {
        error:
          'Default free-tier AI is not configured on this server. Add your own BYOK API key in AI Settings.',
      },
      { status: 503 }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= 20) {
      return NextResponse.json(
        { error: 'Free-tier rate limit reached (20 req/min). Add your own BYOK key for unlimited use.' },
        { status: 429 }
      );
    }
    entry.count += 1;
  } else {
    rateBucket.set(ip, { count: 1, resetAt: now + 60_000 });
  }

  try {
    const { model, systemPrompt, userPrompt } = (await req.json()) as {
      model?: string;
      systemPrompt?: string;
      userPrompt?: string;
    };

    const chosenModel =
      model && ALLOWED_DEFAULT_MODELS.has(model) ? model : 'gemini-3.5-flash-lite';

    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        chosenModel
      )}:generateContent?key=${encodeURIComponent(serverKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt || '' }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt || '' }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        }),
      }
    );

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Default AI route failed' },
      { status: 502 }
    );
  }
}
