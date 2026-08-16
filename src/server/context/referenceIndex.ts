import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379');
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
  return (await redis.get(INITIALIZED_KEY)) === 'true';
}

/** Query reference index for relevant passages. Returns max 3 passages. */
export async function queryReferenceIndex(
  query: string, phaseId: number, maxResults = 3
): Promise<ReferenceEntry[]> {
  const initialized = await isIndexInitialized();
  if (!initialized) return [];

  // In POC: simple tag-based lookup. Phase tags: p0, p1, p2, ...
  const phaseTag = `p${phaseId}`;
  const keys = await redis.keys(`${INDEX_KEY_PREFIX}${phaseTag}:*`);

  const results: ReferenceEntry[] = [];
  for (const key of keys.slice(0, maxResults)) {
    const raw = await redis.get(key);
    if (raw) results.push(JSON.parse(raw) as ReferenceEntry);
  }
  return results;
}

/** Store a reference passage. Called during system initialization. */
export async function storeReferenceEntry(entry: ReferenceEntry): Promise<void> {
  const key = `${INDEX_KEY_PREFIX}${entry.tags[0]}:${entry.docId}:${entry.section}`;
  await redis.set(key, JSON.stringify(entry));
}

/** Mark reference index as initialized */
export async function markIndexInitialized(): Promise<void> {
  await redis.set(INITIALIZED_KEY, 'true');
}
