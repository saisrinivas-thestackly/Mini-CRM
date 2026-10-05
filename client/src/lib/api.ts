const API_URL: string | undefined = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error('VITE_API_URL is not set. Copy client/.env.example to client/.env.local and fill it in.');
}

const BASE = `${API_URL.replace(/\/$/, '')}/api`;

export interface FieldError {
  field: string | null;
  message: string;
}

export class ApiError extends Error {
  status: number;
  errors: FieldError[];

  constructor(status: number, message: string, errors: FieldError[] = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }

  get fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const e of this.errors) {
      if (e.field && !map[e.field]) map[e.field] = e.message;
    }
    return map;
  }
}

type Unauthorized = () => void;
let onUnauthorized: Unauthorized | null = null;

export function setUnauthorizedHandler(handler: Unauthorized | null) {
  onUnauthorized = handler;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Query;
  ignoreUnauthorized?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(`${BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, ignoreUnauthorized, signal } = options;

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      credentials: 'include',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && !ignoreUnauthorized) onUnauthorized?.();
    throw new ApiError(res.status, data?.message || `Request failed (${res.status})`, data?.errors || []);
  }
  return data as T;
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
