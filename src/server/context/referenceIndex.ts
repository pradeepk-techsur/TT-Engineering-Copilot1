import { Redis } from 'ioredis';

/**
 * Reference-passage index, backed by Redis.
 *
 * Redis is optional. The app's normal Preview mode runs without it, and the
 * index is a lookup cache — a miss means "no supporting passage", which every
 * caller already handles. So nothing here may fail loudly:
 *
 *  - the client connects lazily, so importing this module (which
 *    `contextAssembly` does, which the phase agents do) no longer dials Redis
 *    as a side effect of a page render;
 *  - it carries an `error` listener. An ioredis client emits `error` on every
 *    failed reconnect, and an unhandled `'error'` event on an EventEmitter
 *    throws — which was killing the dev server outright, several times an hour,
 *    with nothing but `[ioredis] Unhandled error event` to show for it; and
 *  - retries are bounded, so a missing Redis stops hammering the socket
 *    instead of reconnecting forever.
 */
const MAX_RETRIES = 3;

let warned = false;

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy(times) {
    // `null` stops reconnecting. Without this the client retries for the life
    // of the process.
    if (times > MAX_RETRIES) return null;
    return Math.min(times * 200, 1000);
  },
});

redis.on('error', (err: NodeJS.ErrnoException) => {
  // Say it once. This fires on every reconnect attempt, and a screenful of
  // identical stack traces buries whatever else is in the log.
  if (!warned) {
    warned = true;
    const reason = err.code === 'ECONNREFUSED'
      ? `no Redis at ${process.env.REDIS_URL ?? 'redis://localhost:6379'}`
      : err.message;
    console.warn(
      `Reference index unavailable (${reason}). Phase context will be assembled ` +
      `without cached reference passages.`
    );
  }
});

/** Run a Redis read, treating an unreachable server as an empty result. */
async function tryRedis<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    if (redis.status === 'end' || redis.status === 'close') return fallback;
    if (redis.status === 'wait') await redis.connect();
    return await operation();
  } catch {
    return fallback;
  }
}

const INDEX_KEY_PREFIX = 'ref:';
const INITIALIZED_KEY = 'ref:initialized';

export interface ReferenceEntry {
  docId: string;
  section: string;
  content: string;
  tags: string[];
}

/** Check if the reference index is initialized */
export async function isIndexInitialized(): Promise<boolean> {
  return tryRedis(async () => (await redis.get(INITIALIZED_KEY)) === 'true', false);
}

/** Query reference index for relevant passages. Returns max 3 passages. */
export async function queryReferenceIndex(
  query: string, phaseId: number, maxResults = 3
): Promise<ReferenceEntry[]> {
  const initialized = await isIndexInitialized();
  if (!initialized) return [];

  return tryRedis(async () => {
    // In POC: simple tag-based lookup. Phase tags: p0, p1, p2, ...
    const phaseTag = `p${phaseId}`;
    const keys = await redis.keys(`${INDEX_KEY_PREFIX}${phaseTag}:*`);

    const results: ReferenceEntry[] = [];
    for (const key of keys.slice(0, maxResults)) {
      const raw = await redis.get(key);
      if (raw) results.push(JSON.parse(raw) as ReferenceEntry);
    }
    return results;
  }, []);
}

/**
 * Store a reference passage. Called during system initialization.
 * Returns false when there is no index to write to.
 */
export async function storeReferenceEntry(entry: ReferenceEntry): Promise<boolean> {
  const key = `${INDEX_KEY_PREFIX}${entry.tags[0]}:${entry.docId}:${entry.section}`;
  return tryRedis(async () => {
    await redis.set(key, JSON.stringify(entry));
    return true;
  }, false);
}

/** Mark reference index as initialized. Returns false if it could not be marked. */
export async function markIndexInitialized(): Promise<boolean> {
  return tryRedis(async () => {
    await redis.set(INITIALIZED_KEY, 'true');
    return true;
  }, false);
}
