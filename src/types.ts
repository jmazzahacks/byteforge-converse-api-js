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
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: number;
  token_count: number | null;
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
