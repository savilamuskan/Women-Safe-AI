/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleClientBackendRequest } from './clientBackend.ts';

/**
 * Returns the base URL for API requests.
 * Uses VITE_API_URL or VITE_BACKEND_URL if provided.
 * Ensures that if running in a remote production environment (e.g. Cloudflare Pages or Vercel),
 * accidental 'localhost' configuration is ignored to prevent connection failures.
 */
export function getApiBaseUrl(): string {
  const envUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env
      ? (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '')
      : '') as string
  ).trim();

  // If in browser and envUrl points to localhost while site is running on a remote domain
  if (typeof window !== 'undefined') {
    const isLocalhostHost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!isLocalhostHost && envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      // Remote deployment (e.g. Cloudflare Pages, Vercel) shouldn't attempt to call client's local machine
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
 * Performs a robust fetch request that safely parses JSON or text responses,
 * preventing 'Unexpected token' and 'Unexpected end of JSON input' syntax errors.
 *
 * If deployed on a static hosting provider (e.g. Cloudflare Pages or Vercel static)
 * where the backend Express server is not running on the same domain, it gracefully
 * executes the request client-side so authentication and risk prediction continue
 * working seamlessly.
 */
export async function apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);
  const baseUrl = getApiBaseUrl();

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

  // Network failed or server unreachable: fallback to client backend if on static host
  if (!response || networkError) {
    // If no remote VITE_API_URL was explicitly set, this is likely a static deploy (Cloudflare Pages/Vercel)
    if (!baseUrl && endpoint.startsWith('/api/')) {
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

  // Safely read response as text first (never call response.json() directly to prevent 'Unexpected end of JSON input')
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

  // Detect static host 404/405 (e.g. Cloudflare Pages or Vercel static missing backend)
  const isStaticHostMissingRoute =
    (response.status === 404 || response.status === 405) &&
    !baseUrl &&
    endpoint.startsWith('/api/');

  const isHtmlErrorPage =
    trimmedText.startsWith('<!DOCTYPE') ||
    trimmedText.startsWith('<html') ||
    trimmedText.includes('The page could not be found') ||
    trimmedText.startsWith('The page');

  if ((isStaticHostMissingRoute || (response.status >= 400 && isHtmlErrorPage)) && endpoint.startsWith('/api/')) {
    // Cloudflare Pages / Vercel static returned 404 or HTML for API route:
    // Seamlessly execute through client-side database
    try {
      return await handleClientBackendRequest(endpoint, options);
    } catch (fallbackErr: any) {
      throw new Error(fallbackErr.message || 'Authentication service error');
    }
  }

  // Handle HTTP error statuses from real backend
  if (!response.ok) {
    let errorMsg: string;

    if (parsedData && typeof parsedData === 'object') {
      errorMsg = parsedData.error || parsedData.message || `Request failed with status ${response.status}`;
    } else if (trimmedText) {
      if (isHtmlErrorPage) {
        errorMsg = `Backend endpoint '${endpoint}' returned ${response.status} (Not Found). Ensure the API server is deployed or VITE_API_URL is configured.`;
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
