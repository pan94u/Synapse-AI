import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function proxyRequest(req: NextRequest) {
  const url = new URL(req.url);
  // Strip /api prefix — forward the rest to backend /api/
  const path = url.pathname.replace(/^\/api/, '');
  const target = `${BACKEND_URL}/api${path}${url.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (key !== 'host' && key !== 'connection') {
      headers.set(key, value);
    }
  });

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
    // @ts-expect-error duplex is required for streaming body
    init.duplex = 'half';
  }

  try {
    const upstream = await fetch(target, init);

    // SSE: stream the response through
    const contentType = upstream.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const responseHeaders = new Headers();
    upstream.headers.forEach((value, key) => {
      if (key !== 'transfer-encoding') {
        responseHeaders.set(key, value);
      }
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const DELETE = proxyRequest;
export const PATCH = proxyRequest;
