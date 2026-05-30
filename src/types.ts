/**
 * TypeScript shapes mirroring the byteforge-converse-models Python package.
 * Keep these in sync with src/byteforge_converse_models/* in the models lib.
 *
 * All timestamps are unix epoch seconds (BIGINT in Postgres, int in Python,
 * number here). Do NOT use Date objects on the wire.
 */

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: number;
  updated_at: number | null;
  /** OpenRouter model id; null falls back to the backend default. */
  model: string | null;
  /** Per-conversation system prompt encoding its purpose. */
  system_prompt: string | null;
  /** JSON schema for structured-output conversations; null for freeform. */
  response_schema: Record<string, unknown> | null;
  /**
   * Opaque list of OpenAI/OpenRouter tool definitions advertised to the
   * model. Converse forwards them on each turn and relays any tool calls
   * back to the caller; it never executes a tool itself.
   *
   * Optional on the wire: backends older than 0.2.0 (and the schema before
   * the `tools` column existed) omit this field entirely, so consumers that
   * destructure it must handle both `null` and `undefined`.
   */
  tools?: Record<string, unknown>[] | null;
}

/**
 * Input payload for creating a conversation. The server owns id/created_at/
 * updated_at, so callers supply only these fields.
 */
export interface ConversationCreate {
  user_id: string;
  title: string;
  model?: string | null;
  system_prompt?: string | null;
  response_schema?: Record<string, unknown> | null;
  tools?: Record<string, unknown>[] | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: number;
  token_count: number | null;
  /**
   * Raw OpenAI/OpenRouter tool-call list emitted on this turn (assistant
   * rows only). Persisted so a future replay can rebuild the OpenAI-spec
   * message sequence the model needs to correlate results with requests.
   */
  tool_calls?: Record<string, unknown>[] | null;
  /**
   * For tool-role rows, the id of the assistant tool_call this row responds
   * to (matches a ToolCall.id from a prior ChatTurn). Required by the
   * OpenAI protocol when role === "tool".
   */
  tool_call_id?: string | null;
}

export interface Session {
  id: string;
  user_id: string;
  conversation_id: string | null;
  created_at: number;
  expires_at: number;
}

export interface ListResponse<T> {
  data: T[];
  limit: number;
  offset: number;
}

/**
 * A single tool invocation the model wants the caller to execute. The
 * `arguments` field is the raw JSON string the model emitted — Converse does
 * not parse it.
 */
export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

/**
 * Result of a single chat turn.
 *
 * `message` is the persisted assistant `Message`. It is always present —
 * `message.content` may be the empty string for a pure tool-call turn, or
 * carry narration that accompanied tool calls in the same turn.
 *
 * `tool_calls` is the list of tools the model asked the caller to execute.
 * `null` when the turn was a normal reply. The caller executes each tool
 * out-of-band and feeds the results back as `tool`-role messages with
 * matching `tool_call_id` before the next chat turn.
 */
export interface ChatTurn {
  message: Message;
  tool_calls: ToolCall[] | null;
}
