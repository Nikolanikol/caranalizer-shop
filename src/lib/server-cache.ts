const cache = new Map<string, { data: unknown; expires: number }>();

export function cachedFetch<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): () => Promise<T> {
  return async () => {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expires) return entry.data as T;
    const data = await fn();
    cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
    return data;
  };
}
