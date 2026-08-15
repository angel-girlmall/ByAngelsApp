// 30-minute LocalStorage & In-Memory Cache Utility for Web App
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const memoryCache = {};

export async function fetchWith30MinCache(key, fetchFn, forceRefresh = false) {
  const now = Date.now();

  // 1. Check In-Memory Cache
  if (!forceRefresh && memoryCache[key] && (now - memoryCache[key].timestamp) < CACHE_DURATION_MS) {
    return memoryCache[key].data;
  }

  // 2. Check LocalStorage Cache
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(`web_cache_${key}`);
      if (raw) {
        const envelope = JSON.parse(raw);
        if (envelope && envelope.timestamp && (now - envelope.timestamp) < CACHE_DURATION_MS) {
          memoryCache[key] = envelope;
          return envelope.data;
        }
      }
    } catch (e) {
      console.warn("LocalStorage cache read error:", e);
    }
  }

  // 3. Fetch Fresh Data from API
  const freshData = await fetchFn();
  if (freshData !== null && freshData !== undefined) {
    const envelope = { timestamp: now, data: freshData };
    memoryCache[key] = envelope;
    try {
      localStorage.setItem(`web_cache_${key}`, JSON.stringify(envelope));
    } catch (e) {
      console.warn("LocalStorage cache write error:", e);
    }
  }

  return freshData;
}

export function invalidateCache(key) {
  delete memoryCache[key];
  try {
    localStorage.removeItem(`web_cache_${key}`);
  } catch (e) {}
}

export function clearAllCache() {
  Object.keys(memoryCache).forEach(k => delete memoryCache[k]);
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("web_cache_")) localStorage.removeItem(k);
    });
  } catch (e) {}
}
