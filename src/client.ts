import type {
  Conversation,
  ConversationCreate,
  ListResponse,
  Message,
  Session,
} from "./types";

export class ConverseAPIError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`[${status}] ${detail}`);
    this.name = "ConverseAPIError";
    this.status = status;
    this.detail = detail;
  }
}

export interface ConverseClientOptions {
  baseUrl: string;
  /** Extra headers merged into every request (e.g. for auth from the host app). */
  extraHeaders?: Record<string, string>;
  /** Custom fetch implementation (defaults to global fetch). */
  fetchImpl?: typeof fetch;
}

export class ConverseClient {
  private readonly baseUrl: string;
  private readonly extraHeaders: Record<string, string>;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ConverseClientOptions) {
    if (!opts.baseUrl) {
      throw new Error("baseUrl is required");
    }
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.extraHeaders = opts.extraHeaders ?? {};
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  // ---- sessions -----------------------------------------------------

  createSession(payload: Partial<Session>): Promise<Session> {
    return this.request<Session>("POST", "/api/sessions", { body: payload });
  }

  getSession(sessionId: string): Promise<Session> {
    return this.request<Session>("GET", `/api/sessions/${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.request<unknown>("DELETE", `/api/sessions/${sessionId}`);
  }

  // ---- conversations ------------------------------------------------

  listConversations(limit = 100, offset = 0): Promise<ListResponse<Conversation>> {
    return this.request<ListResponse<Conversation>>("GET", "/api/conversations", {
      query: { limit, offset },
    });
  }

  createConversation(payload: ConversationCreate): Promise<Conversation> {
    return this.request<Conversation>("POST", "/api/conversations", { body: payload });
  }

  getConversation(conversationId: string): Promise<Conversation> {
    return this.request<Conversation>("GET", `/api/conversations/${conversationId}`);
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.request<unknown>("DELETE", `/api/conversations/${conversationId}`);
  }

  // ---- messages -----------------------------------------------------

  listMessages(
    conversationId: string,
    limit = 100,
    offset = 0,
  ): Promise<ListResponse<Message>> {
    return this.request<ListResponse<Message>>(
      "GET",
      `/api/conversations/${conversationId}/messages`,
      { query: { limit, offset } },
    );
  }

  postMessage(conversationId: string, payload: Partial<Message>): Promise<Message> {
    return this.request<Message>(
      "POST",
      `/api/conversations/${conversationId}/messages`,
      { body: payload },
    );
  }

  // ---- chat turn ----------------------------------------------------

  /**
   * Submit a user message and receive the assistant reply as a Message.
   */
  chat(conversationId: string, content: string): Promise<Message> {
    return this.request<Message>(
      "POST",
      `/api/conversations/${conversationId}/chat`,
      { body: { content } },
    );
  }

  // ---- internals ----------------------------------------------------

  private async request<T>(
    method: string,
    path: string,
    opts: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined>;
    } = {},
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (opts.query) {
      for (const [key, val] of Object.entries(opts.query)) {
        if (val !== undefined) url.searchParams.set(key, String(val));
      }
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.extraHeaders,
    };
    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }

    const resp = await this.fetchImpl(url.toString(), { method, headers, body });
    if (!resp.ok) {
      let detail = await resp.text();
      try {
        const parsed = JSON.parse(detail) as { message?: string };
        if (parsed.message) detail = parsed.message;
      } catch {
        // detail stays as raw text
      }
      throw new ConverseAPIError(resp.status, detail);
    }

    const text = await resp.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  }
}
