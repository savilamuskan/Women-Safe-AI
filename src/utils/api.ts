/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleClientBackendRequest } from './clientBackend.ts';

/**
 * Returns the base URL for API requests.
 * Uses VITE_API_URL or VITE_BACKEND_URL if provided on external deployments.
 * If running in AI Studio preview (*.run.app) or local development, always uses
 * the local full-stack Express server (same-origin) to avoid calling external broken workers.
 */
export function getApiBaseUrl(): string {
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '')
      : '') as string
  ).trim();

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhostHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isAIStudioPreview = hostname.endsWith('.run.app');

    // In AI Studio preview container or localhost, Express backend runs locally on same origin
    if (isAIStudioPreview || isLocalhostHost) {
      return '';
    }

    // Remote deployments (e.g. Cloudflare Pages, Vercel) shouldn't attempt to call localhost
    if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      return '';
    }
  }

  return envUrl.replace(/\/+$/, '');
}

/**
 * Normalizes an API path and prepends the configured base URL if available.
 */
export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${normalized}` : normalized;
}

/**
 * Performs a resilient fetch request that safely parses JSON/text responses.
 *
 * Prevents 'Failed to fetch', 'Unexpected token', and 'Unexpected end of JSON input' errors:
 * - If the remote server or worker is down, returns 404/502/503/1042, or blocks CORS,
 *   it transparently falls back to the client database so authentication and risk predictions
 *   work without interruption.
 * - Extracts real server error messages (e.g. "Invalid email or password") cleanly.
 */
export async function apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers = new Headers(options?.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain, */*');
  }

  let response: Response | null = null;
  let networkError: any = null;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (err: any) {
    networkError = err;
  }

  // Network failure (CORS blocked, DNS failed, worker down, or offline):
  // Gracefully fallback to client database so the user never sees "Failed to fetch"
  if (!response || networkError) {
    if (endpoint.startsWith('/api/')) {
      console.warn(
        `[WomenSafe AI] Network request to ${url} failed (${networkError?.message || 'Failed to fetch'}). Falling back to resilient local database.`
      );
      try {
        return await handleClientBackendRequest(endpoint, options);
      } catch (fallbackErr: any) {
        throw new Error(fallbackErr.message || 'Authentication service error');
      }
    }
    throw new Error(
      networkError?.message || 'Network error: Unable to reach the API server. Please check your connection.'
    );
  }

  // Safely read response as text first (never call response.json() directly)
  let rawText = '';
  try {
    rawText = await response.text();
  } catch {
    rawText = '';
  }

  const trimmedText = rawText.trim();
  let parsedData: any = null;

  if (trimmedText.length > 0) {
    try {
      parsedData = JSON.parse(trimmedText);
    } catch {
      parsedData = null;
    }
  }

  // Detect static host 404/405 or Cloudflare worker 404/502/1042 errors
  const isNotFoundOrMethodNotAllowed =
    response.status === 404 ||
    response.status === 405 ||
    response.status === 502 ||
    response.status === 503;

  const isHtmlOrCloudflareError =
    trimmedText.startsWith('<!DOCTYPE') ||
    trimmedText.startsWith('<html') ||
    trimmedText.includes('The page could not be found') ||
    trimmedText.includes('error code: 1042') ||
    trimmedText.startsWith('error code:');

  if ((isNotFoundOrMethodNotAllowed || isHtmlOrCloudflareError) && endpoint.startsWith('/api/')) {
    console.warn(
      `[WomenSafe AI] Backend at ${url} returned status ${response.status}. Falling back to resilient local database.`
    );
    try {
      return await handleClientBackendRequest(endpoint, options);
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr.message || 'Authentication service error');
    }
  }

  // Handle actual application error statuses from backend (e.g. 401 Invalid Credentials, 403 Forbidden, 409 Conflict)
  if (!response.ok) {
    let errorMsg: string;

    if (parsedData && typeof parsedData === 'object') {
      errorMsg = parsedData.error || parsedData.message || `Request failed with status ${response.status}`;
    } else if (trimmedText) {
      if (isHtmlOrCloudflareError) {
        errorMsg = `Backend endpoint '${endpoint}' returned ${response.status}. Ensure the API server is active or remove invalid VITE_API_URL.`;
      } else {
        errorMsg = trimmedText.length > 200 ? `${trimmedText.slice(0, 200)}...` : trimmedText;
      }
    } else {
      errorMsg = `Server returned status ${response.status} (${response.statusText || 'Error'})`;
    }

    throw new Error(errorMsg);
  }

  // If response is OK and was valid JSON
  if (parsedData !== null) {
    return parsedData as T;
  }

  // If response is OK with text body
  if (trimmedText) {
    return trimmedText as unknown as T;
  }

  return {} as T;
}
