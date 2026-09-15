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

type SessionHandlers = {
  /** Trades the refresh cookie for a new access token. Returns it, or null if refused. */
  refresh: () => Promise<string | null>;
  /** Called when the session is gone for good, so the app can show the sign-in screen. */
  onSignedOut: () => void;
};

let session: SessionHandlers = {
  refresh: async () => null,
  onSignedOut: () => {},
};

export function setSessionHandlers(handlers: SessionHandlers): void {
  session = handlers;
}

/**
 * One refresh at a time.
 *
 * Every screen fires several requests at once, and after fifteen minutes they all get a 401
 * together. Without this they would each start their own refresh — and since refreshing
 * *rotates* the token, the second one to arrive would be replaying a spent token and the
 * server would revoke the whole session as a suspected theft. Signing the user out for the
 * crime of having two panels on screen.
 */
let inFlight: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  if (!inFlight) {
    inFlight = session.refresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function send(path: string, options: RequestOptions, token: string | null): Promise<Response> {
  const { body, headers, ...rest } = options;

  return fetch(`/api${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, readToken());

  /**
   * A 401 is now routine rather than exceptional: access tokens last fifteen minutes, so any
   * session older than that hits one on its next request. Refresh and replay it once — the
   * provider should never see a screen fail for a reason that fixes itself.
   *
   * `/auth/` is excluded so a genuine bad-password 401 is not mistaken for an expired token,
   * and so a failing refresh cannot recurse into itself.
   */
  if (response.status === 401 && !path.startsWith('/auth/')) {
    const token = await refreshOnce();

    if (!token) {
      session.onSignedOut();
      throw new ApiError('Your session has ended. Please sign in again.', 401);
    }
    response = await send(path, options, token);
  }

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

async function requestText(path: string): Promise<string> {
  const token = readToken();
  const response = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    throw new ApiError(await extractMessage(response), response.status);
  }
  return response.text();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  /** For endpoints that answer with CSV or plain text rather than JSON. */
  text: (path: string) => requestText(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
