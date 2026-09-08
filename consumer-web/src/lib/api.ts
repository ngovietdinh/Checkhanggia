const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers as any) },
  });

  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : undefined;

  if (!res.ok) {
    const message = body?.message || `Loi khong xac dinh (HTTP ${res.status})`;
    throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
  }
  return body as T;
}

export const api = {
  base: API_BASE_URL,
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  // Upload dung FormData - khong duoc set Content-Type thu cong (trinh duyet
  // tu them boundary cho multipart/form-data), nen dung fetch rieng o day.
  async postForm<T>(path: string, formData: FormData): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', body: formData });
    const contentType = res.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await res.json() : undefined;
    if (!res.ok) {
      const message = body?.message || `Loi khong xac dinh (HTTP ${res.status})`;
      throw new ApiError(res.status, Array.isArray(message) ? message.join(', ') : message);
    }
    return body as T;
  },
};
