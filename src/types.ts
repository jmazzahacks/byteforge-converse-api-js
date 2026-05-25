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
