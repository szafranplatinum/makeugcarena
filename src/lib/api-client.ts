/**
 * Type-safe API client for frontend requests
 * Handles JSON parsing, error handling, and type safety
 */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type');
  let data: unknown;

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      (typeof data === 'object' && data !== null && 'error' in data && typeof (data as any).error === 'string')
        ? (data as any).error
        : (typeof data === 'object' && data !== null && 'message' in data && typeof (data as any).message === 'string')
          ? (data as any).message
          : `HTTP ${response.status}`;
    throw new ApiError(response.status, message);
  }

  return typeof data === 'object' && data !== null && 'data' in data ? (data as any).data : (data as T);
}

export const apiClient = {
  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const fullUrl = `${BASE_URL}${url}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleResponse<T>(response);
  },

  async post<T = unknown>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    return handleResponse<T>(response);
  },

  async patch<T = unknown>(url: string, body?: unknown): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    return handleResponse<T>(response);
  },

  async delete<T = unknown>(url: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${url}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    return handleResponse<T>(response);
  },
};
