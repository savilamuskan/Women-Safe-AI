/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Offline & Intermittent Connectivity Map Tile Cache Manager
 * Provides client-side CacheStorage persistence, proactive bounding-box pre-caching,
 * and SVG grid fallbacks for Leaflet emergency maps.
 */

export const EMERGENCY_TILE_CACHE_NAME = 'womensafe-emergency-tiles-v1';

// CartoDB Voyager tile template (clean, modern, full CORS enabled)
export const DEFAULT_TILE_URL_TEMPLATE = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
export const OSM_TILE_URL_TEMPLATE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

export interface PrecacheProgress {
  total: number;
  completed: number;
  failed: number;
  percentage: number;
}

export interface TileCacheStats {
  supported: boolean;
  tileCount: number;
  estimatedBytes: number;
  cacheName: string;
}

/**
 * Check if the browser supports the Cache Storage API
 */
export function isCacheStorageSupported(): boolean {
  return typeof window !== 'undefined' && 'caches' in window;
}

/**
 * Converts geographic latitude and longitude into tile coordinates at a specific zoom level
 */
export function latLngToTileCoords(lat: number, lng: number, zoom: number): { x: number; y: number; z: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return {
    x: Math.max(0, Math.min(n - 1, x)),
    y: Math.max(0, Math.min(n - 1, y)),
    z: zoom,
  };
}

/**
 * Builds a concrete tile URL from a template with subdomains and coordinates
 */
export function buildTileUrl(
  template: string = DEFAULT_TILE_URL_TEMPLATE,
  x: number,
  y: number,
  z: number,
  subdomain: string = 'a'
): string {
  return template
    .replace('{s}', subdomain)
    .replace('{z}', String(z))
    .replace('{x}', String(x))
    .replace('{y}', String(y))
    .replace('{r}', window.devicePixelRatio > 1 ? '@2x' : '');
}

/**
 * In-memory object URL cache to speed up tile reuse and prevent memory leaks
 */
const objectUrlRegistry = new Map<string, string>();
const maxInMemoryUrls = 300;

function registerObjectUrl(tileUrl: string, blob: Blob): string {
  if (objectUrlRegistry.has(tileUrl)) {
    return objectUrlRegistry.get(tileUrl)!;
  }
  if (objectUrlRegistry.size >= maxInMemoryUrls) {
    // Evict oldest 50 entries
    const keys = Array.from(objectUrlRegistry.keys()).slice(0, 50);
    for (const key of keys) {
      const url = objectUrlRegistry.get(key);
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch {}
      }
      objectUrlRegistry.delete(key);
    }
  }
  const objUrl = URL.createObjectURL(blob);
  objectUrlRegistry.set(tileUrl, objUrl);
  return objUrl;
}

/**
 * Retrieves a cached tile as an Object URL if available in CacheStorage
 */
export async function getCachedTileObjectUrl(tileUrl: string): Promise<string | null> {
  if (objectUrlRegistry.has(tileUrl)) {
    return objectUrlRegistry.get(tileUrl)!;
  }

  if (!isCacheStorageSupported()) return null;

  try {
    const cache = await caches.open(EMERGENCY_TILE_CACHE_NAME);
    const cachedResponse = await cache.match(tileUrl);
    if (cachedResponse && cachedResponse.ok) {
      const blob = await cachedResponse.blob();
      return registerObjectUrl(tileUrl, blob);
    }
  } catch (err) {
    console.warn('CacheStorage read error:', err);
  }
  return null;
}

/**
 * Stores a tile response in CacheStorage
 */
export async function putTileInCache(tileUrl: string, response: Response): Promise<void> {
  if (!isCacheStorageSupported() || !response.ok) return;

  try {
    const cache = await caches.open(EMERGENCY_TILE_CACHE_NAME);
    await cache.put(tileUrl, response);
  } catch (err) {
    console.warn('CacheStorage write error:', err);
  }
}

/**
 * Fetches a tile with CORS, caches it, and returns an Object URL
 */
export async function fetchAndCacheTile(tileUrl: string, timeoutMs: number = 8000): Promise<string> {
  // 1. Check cache first
  const cachedUrl = await getCachedTileObjectUrl(tileUrl);
  if (cachedUrl) {
    return cachedUrl;
  }

  // 2. Fetch over network
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(tileUrl, {
      mode: 'cors',
      signal: controller.signal,
      headers: {
        Accept: 'image/webp,image/png,image/*;q=0.8',
      },
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Tile fetch failed with status ${res.status}`);
    }

    // Cache a clone
    putTileInCache(tileUrl, res.clone()).catch(() => {});

    // Produce Blob
    const blob = await res.blob();
    return registerObjectUrl(tileUrl, blob);
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
}

/**
 * Generates an SVG fallback tile for offline areas that haven't been pre-cached.
 * Prevents broken image icons and maintains visual orientation for emergency users.
 */
export function createOfflineFallbackTile(z: number, x: number, y: number, isDark: boolean = false): string {
  const bg = isDark ? '#1e293b' : '#f8fafc';
  const grid = isDark ? '#334155' : '#e2e8f0';
  const text = isDark ? '#94a3b8' : '#64748b';
  const subtext = isDark ? '#64748b' : '#94a3b8';
  const badge = isDark ? '#f43f5e' : '#e11d48';

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" fill="${bg}"/>
  <line x1="0" y1="0" x2="256" y2="0" stroke="${grid}" stroke-width="1.5"/>
  <line x1="0" y1="0" x2="0" y2="256" stroke="${grid}" stroke-width="1.5"/>
  <line x1="0" y1="128" x2="256" y2="128" stroke="${grid}" stroke-dasharray="3,3" stroke-width="1"/>
  <line x1="128" y1="0" x2="128" y2="256" stroke="${grid}" stroke-dasharray="3,3" stroke-width="1"/>
  
  <circle cx="128" cy="110" r="14" fill="${isDark ? '#3b1d28' : '#ffe4e6'}" stroke="${badge}" stroke-width="1.5"/>
  <path d="M128 103v8M128 117v1.5" stroke="${badge}" stroke-width="2" stroke-linecap="round"/>
  
  <text x="128" y="142" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="700" fill="${text}">
    OFFLINE MAP GRID
  </text>
  <text x="128" y="157" text-anchor="middle" font-family="ui-monospace, monospace" font-size="9" fill="${subtext}">
    Zoom ${z} • Tile ${x},${y}
  </text>
  <text x="128" y="172" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="8.5" fill="${subtext}">
    Connect to sync surrounding roads
  </text>
</svg>
`.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Pre-caches tiles in a radius around the user's coordinates for multiple zoom levels.
 * Guarantees that the surrounding neighborhood (2-5 km) remains accessible offline.
 */
export async function precacheEmergencyArea(
  lat: number,
  lng: number,
  options: {
    zoomLevels?: number[];
    radiusTiles?: number;
    template?: string;
    onProgress?: (progress: PrecacheProgress) => void;
  } = {}
): Promise<{ total: number; completed: number; failed: number }> {
  const zoomLevels = options.zoomLevels || [14, 15, 16];
  const template = options.template || DEFAULT_TILE_URL_TEMPLATE;
  const subdomains = ['a', 'b', 'c'];

  if (!isCacheStorageSupported()) {
    return { total: 0, completed: 0, failed: 0 };
  }

  // Generate unique list of tile coordinates
  const tileUrls: string[] = [];
  const visited = new Set<string>();

  for (const zoom of zoomLevels) {
    const center = latLngToTileCoords(lat, lng, zoom);
    // Radius 1 means a 3x3 grid (9 tiles). At zoom 16, radius 1 or 2.
    const radius = zoom >= 16 ? 1 : (options.radiusTiles ?? 1);

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const tx = center.x + dx;
        const ty = center.y + dy;
        const key = `${zoom}/${tx}/${ty}`;

        if (!visited.has(key)) {
          visited.add(key);
          const sub = subdomains[Math.abs(tx + ty) % subdomains.length];
          tileUrls.push(buildTileUrl(template, tx, ty, zoom, sub));
        }
      }
    }
  }

  const total = tileUrls.length;
  let completed = 0;
  let failed = 0;

  const report = () => {
    if (options.onProgress) {
      options.onProgress({
        total,
        completed,
        failed,
        percentage: total > 0 ? Math.round(((completed + failed) / total) * 100) : 100,
      });
    }
  };

  report();

  // Concurrency pool to avoid flooding network or tile servers
  const concurrency = 4;
  let index = 0;

  async function worker() {
    while (index < tileUrls.length) {
      const currentUrl = tileUrls[index++];
      try {
        await fetchAndCacheTile(currentUrl, 7000);
        completed++;
      } catch (e) {
        failed++;
      }
      report();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, total) }, () => worker());
  await Promise.all(workers);

  return { total, completed, failed };
}

/**
 * Retrieves tile cache stats (number of cached tiles, size)
 */
export async function getTileCacheStats(): Promise<TileCacheStats> {
  if (!isCacheStorageSupported()) {
    return {
      supported: false,
      tileCount: 0,
      estimatedBytes: 0,
      cacheName: EMERGENCY_TILE_CACHE_NAME,
    };
  }

  try {
    const cache = await caches.open(EMERGENCY_TILE_CACHE_NAME);
    const requests = await cache.keys();
    const tileCount = requests.length;
    // Average tile size is ~4.5 KB
    const estimatedBytes = tileCount * 4500;

    return {
      supported: true,
      tileCount,
      estimatedBytes,
      cacheName: EMERGENCY_TILE_CACHE_NAME,
    };
  } catch (err) {
    console.warn('Failed to retrieve cache stats:', err);
    return {
      supported: true,
      tileCount: 0,
      estimatedBytes: 0,
      cacheName: EMERGENCY_TILE_CACHE_NAME,
    };
  }
}

/**
 * Clears the emergency map tile cache
 */
export async function clearEmergencyTileCache(): Promise<boolean> {
  if (!isCacheStorageSupported()) return false;

  try {
    // Revoke all in-memory object URLs
    for (const [, objUrl] of objectUrlRegistry.entries()) {
      try {
        URL.revokeObjectURL(objUrl);
      } catch {}
    }
    objectUrlRegistry.clear();

    const deleted = await caches.delete(EMERGENCY_TILE_CACHE_NAME);
    return deleted;
  } catch (err) {
    console.error('Failed to clear tile cache:', err);
    return false;
  }
}
