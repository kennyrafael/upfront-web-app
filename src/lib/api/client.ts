export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type TokenReader = () => string | null;

let readToken: TokenReader = () => null;

/** Lets the auth store own the token while keeping the client free of store imports. */
export function setTokenReader(reader: TokenReader): void {
  readToken = reader;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = readToken();

  const response = await fetch(`/api${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(await extractMessage(response), response.status);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

async function extractMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    const { message } = payload;
    if (Array.isArray(message)) return message.join(', ');
    if (message) return message;
  } catch {
    // Non-JSON error body; fall through to the generic message.
  }
  return `Request failed with status ${response.status}`;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
