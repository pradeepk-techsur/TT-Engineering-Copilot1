-- Migration: 0001_llm_key_config
-- Adds single-row encrypted LLM API key storage table.
-- Plaintext key is NEVER stored. Only AES-256-GCM ciphertext + iv + authTag.

CREATE TABLE IF NOT EXISTS "llm_key_config" (
  "config_id"   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ciphertext"  TEXT NOT NULL,
  "iv"          TEXT NOT NULL,
  "auth_tag"    TEXT NOT NULL,
  "masked_key"  TEXT NOT NULL,
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "llm_key_config" IS
  'Single-row table storing AES-256-GCM encrypted Anthropic API key. Plaintext key is never persisted. Decryption happens in-process at LLM call time only.';
