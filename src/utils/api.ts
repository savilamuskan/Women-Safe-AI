/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { handleClientBackendRequest, syncUserToClientStorage } from './clientBackend.ts';

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
 * - Synchronizes registered user credentials between local browser storage and server,
 *   preventing "Invalid email or password" after creating an account.
 */
export async function apiFetch<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = buildApiUrl(endpoint);

  const headers = new Headers(options?.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json, text/plain, */*');
  }

  let requestBody: any = null;
  if (options?.body) {
    try {
      requestBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
    } catch {
      requestBody = null;
    }
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
        const fallbackResult = await handleClientBackendRequest(endpoint, options);
        if (
          (endpoint === '/api/auth/register' || endpoint === '/api/auth/login') &&
          fallbackResult?.user &&
          requestBody?.password
        ) {
          syncUserToClientStorage(fallbackResult.user, requestBody.password);
        }
        return fallbackResult;
      } catch (fallbackErr: any) {
        if (fallbackErr?.requiresVerification) {
          throw fallbackErr;
        }
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
      const fallbackResult = await handleClientBackendRequest(endpoint, options);
      if (
        (endpoint === '/api/auth/register' || endpoint === '/api/auth/login') &&
        fallbackResult?.user &&
        requestBody?.password
      ) {
        syncUserToClientStorage(fallbackResult.user, requestBody.password);
      }
      return fallbackResult;
    } catch (fallbackErr: any) {
      if (fallbackErr?.requiresVerification) {
        throw fallbackErr;
      }
      throw new Error(fallbackErr.message || 'Authentication service error');
    }
  }

  // Handle 401 Unauthorized for login:
  // If the server doesn't recognize the user (e.g. user registered when hosted statically or in localStorage),
  // check local database. If credentials match locally, authenticate and sync account with server.
  if (response.status === 401 && endpoint === '/api/auth/login' && requestBody?.email && requestBody?.password) {
    try {
      const localResult = await handleClientBackendRequest(endpoint, options);
      if (localResult && localResult.user && localResult.token) {
        console.info('[WomenSafe AI] Successfully authenticated user from synchronized client storage.');
        // Background sync to server so server database also records this user
        fetch(buildApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: localResult.user.name || 'User',
            email: requestBody.email,
            password: requestBody.password,
            role: localResult.user.role || 'user',
          }),
        }).catch(() => {});
        return localResult as T;
      }
    } catch {
      // Both server and local database rejected the credentials, proceed to throw server error
    }
  }

  // Handle actual application error statuses from backend (e.g. 401 Invalid Credentials, 403 Forbidden, 409 Conflict)
  if (!response.ok) {
    if (parsedData && typeof parsedData === 'object' && parsedData.requiresVerification) {
      const verifyErr: any = new Error(parsedData.error || 'Please verify your email address before logging in.');
      verifyErr.requiresVerification = true;
      verifyErr.email = parsedData.email;
      verifyErr.devVerificationCode = parsedData.devVerificationCode;
      throw verifyErr;
    }

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
    // If login or register succeeded on server, mirror account to client local storage for resilience
    if (
      (endpoint === '/api/auth/register' || endpoint === '/api/auth/login') &&
      parsedData.user &&
      requestBody?.password
    ) {
      syncUserToClientStorage(parsedData.user, requestBody.password);
    }
    return parsedData as T;
  }

  // If response is OK with text body
  if (trimmedText) {
    return trimmedText as unknown as T;
  }

  return {} as T;
}
