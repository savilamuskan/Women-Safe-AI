/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Leaflet CachedTileLayer
 * Intercepts tile requests to prioritize offline cache (CacheStorage API),
 * dynamically fetches and persists missing tiles on-the-fly, and serves
 * crisp offline grid indicators when connectivity is lost.
 */

import L from 'leaflet';
import {
  getCachedTileObjectUrl,
  putTileInCache,
  createOfflineFallbackTile,
  DEFAULT_TILE_URL_TEMPLATE,
} from './tileCacheManager';

export interface CachedTileLayerOptions extends L.TileLayerOptions {
  isDarkMode?: boolean;
}

export class CachedTileLayer extends L.TileLayer {
  public isDarkMode: boolean;

  constructor(urlTemplate: string = DEFAULT_TILE_URL_TEMPLATE, options?: CachedTileLayerOptions) {
    super(urlTemplate, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      crossOrigin: true,
      ...options,
    });
    this.isDarkMode = Boolean(options?.isDarkMode);
  }

  public setDarkMode(dark: boolean): void {
    this.isDarkMode = dark;
  }

  // Override createTile from L.GridLayer / L.TileLayer
  public createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
    const tile = document.createElement('img');

    L.DomEvent.on(tile, 'load', L.Util.bind((this as any)._tileOnLoad, this, done, tile));
    L.DomEvent.on(tile, 'error', L.Util.bind((this as any)._tileOnError, this, done, tile));

    if (this.options.crossOrigin || this.options.crossOrigin === '') {
      tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    }

    tile.alt = '';
    tile.setAttribute('role', 'presentation');

    const url = this.getTileUrl(coords);

    // Asynchronously resolve tile using cache-first offline strategy
    this.loadTileContent(tile, url, coords, done);

    return tile;
  }

  private async loadTileContent(
    tile: HTMLImageElement,
    url: string,
    coords: L.Coords,
    done: L.DoneCallback
  ): Promise<void> {
    try {
      // 1. Immediate Cache Storage Check (offline ready)
      const cachedUrl = await getCachedTileObjectUrl(url);
      if (cachedUrl) {
        tile.src = cachedUrl;
        return;
      }

      // 2. If online, attempt to fetch and cache for offline resiliency
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        try {
          const res = await fetch(url, {
            mode: 'cors',
            signal: controller.signal,
            headers: {
              Accept: 'image/webp,image/png,image/*;q=0.8',
            },
          });

          clearTimeout(timeout);

          if (res.ok) {
            // Asynchronously store clone in CacheStorage
            putTileInCache(url, res.clone()).catch(() => {});

            const blob = await res.blob();
            const objUrl = URL.createObjectURL(blob);

            tile.onload = () => {
              (this as any)._tileOnLoad(done, tile);
            };
            tile.src = objUrl;
            return;
          }
        } catch {
          clearTimeout(timeout);
          // Network request timed out or was interrupted
        }
      }

      // 3. Offline fallback: render SVG grid tile so layout never breaks
      tile.src = createOfflineFallbackTile(coords.z, coords.x, coords.y, this.isDarkMode);
    } catch {
      tile.src = createOfflineFallbackTile(coords.z, coords.x, coords.y, this.isDarkMode);
    }
  }
}

export function createCachedTileLayer(
  urlTemplate?: string,
  options?: CachedTileLayerOptions
): CachedTileLayer {
  return new CachedTileLayer(urlTemplate, options);
}
