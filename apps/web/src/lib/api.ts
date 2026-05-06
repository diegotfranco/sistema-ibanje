const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

let csrfToken: string | null = null;

export function invalidateCsrfToken() {
  csrfToken = null;
}

async function ensureCsrfToken(): Promise<string> {
  if (!csrfToken) {
    const res = await fetch(`${BASE_URL}/auth/csrf-token`, { credentials: 'include' });
    if (!res.ok) throw new ApiError(res.status, 'Failed to fetch CSRF token');
    const data = (await res.json()) as { csrfToken: string };
    csrfToken = data.csrfToken;
  }
  return csrfToken;
}

async function parseError(res: Response): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as { message?: string };
  return new ApiError(res.status, body.message ?? res.statusText);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isMutation = method !== 'GET';
  const headers: Record<string, string> = {};

  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (isMutation) headers['x-csrf-token'] = await ensureCsrfToken();

  const init: RequestInit = {
    method,
    credentials: 'include',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  };

  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    // On 403, the CSRF token may have expired (e.g. after session regeneration on login).
    // Clear the cache and retry once before surfacing the error.
    if (isMutation && res.status === 403) {
      csrfToken = null;
      headers['x-csrf-token'] = await ensureCsrfToken();
      const retry = await fetch(`${BASE_URL}${path}`, init);
      if (!retry.ok) throw await parseError(retry);
      if (retry.status === 204) return undefined as T;
      return retry.json() as Promise<T>;
    }
    throw await parseError(res);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestForm<T>(method: string, path: string, body: FormData): Promise<T> {
  const csrf = await ensureCsrfToken();
  const headers: Record<string, string> = { 'x-csrf-token': csrf };
  const init: RequestInit = { method, credentials: 'include', headers, body };

  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    if (res.status === 403) {
      csrfToken = null;
      const retryHeaders = { 'x-csrf-token': await ensureCsrfToken() };
      const retry = await fetch(`${BASE_URL}${path}`, { ...init, headers: retryHeaders });
      if (!retry.ok) throw await parseError(retry);
      if (retry.status === 204) return undefined as T;
      return retry.json() as Promise<T>;
    }
    throw await parseError(res);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestBlob(path: string): Promise<Blob> {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'GET', credentials: 'include' });
  if (!res.ok) throw await parseError(res);
  return res.blob();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
  postForm: <T>(path: string, body: FormData) => requestForm<T>('POST', path, body),
  getBlob: (path: string) => requestBlob(path)
};
