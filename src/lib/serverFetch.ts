import { headers } from 'next/headers';

/**
 * Same-origin API access from server components.
 *
 * The pages used to build an absolute URL from `NEXT_PUBLIC_BASE_URL`, with a
 * hardcoded `http://localhost:3010` fallback. Two problems:
 *
 *  1. The port is baked in. `.env.local` pins :3010, but `npm run dev` and the
 *     sandbox preview serve the app on :3000 — so the server component fetched
 *     a port with nothing listening on it.
 *  2. The `fetch` was un-guarded, so that failure threw during render and took
 *     the whole route down with a 500 ("Runtime TypeError: fetch failed")
 *     instead of falling back to the page's own empty state.
 *
 * The API routes live in this same app, so the right origin is simply the one
 * the request arrived on. We read it from the request headers FIRST — ahead of
 * the env var, which is what made this fail — and only fall back when there is
 * no request scope to read.
 */
export async function getOrigin(): Promise<string> {
  try {
    const h = await headers();
    // x-forwarded-* first: the sandbox preview and any reverse proxy set these.
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) {
      const proto =
        h.get('x-forwarded-proto') ??
        (/^(localhost|127\.0\.0\.1|\[::1\])(:|$)/.test(host) ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  } catch {
    // No request scope (e.g. during static generation) — fall through.
  }
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
}

/**
 * GET JSON from a same-origin API route.
 *
 * Returns `null` on any failure — unreachable server, non-2xx, unparseable
 * body — so a page renders a degraded state instead of crashing. Callers are
 * expected to handle `null`.
 */
export async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const origin = await getOrigin();
    const res = await fetch(`${origin}${path}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
