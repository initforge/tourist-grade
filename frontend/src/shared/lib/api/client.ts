// Default to same-origin so static hosting (e.g. Cloudflare Pages) does not accidentally call localhost.
// Local dev/docker should set VITE_API_BASE_URL explicitly when a real API is available.
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? '';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await response?.json()?.catch(() => null);

  if (!response?.ok) {
    throw new ApiError(data?.message ?? 'API request failed', response?.status);
  }

  return data as T;
}

export { API_BASE_URL };
