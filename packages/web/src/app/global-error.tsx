'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: 40, fontFamily: 'monospace' }}>
          <h1>Client Error</h1>
          <pre style={{ whiteSpace: 'pre-wrap', color: 'red' }}>
            {error.message}
          </pre>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#666', fontSize: 12 }}>
            {error.stack}
          </pre>
          <button onClick={reset} style={{ marginTop: 20, padding: '8px 16px' }}>
            Retry
          </button>
        </div>
      </body>
    </html>
  );
}
