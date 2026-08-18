// SERVER-ONLY. This file must never be imported by client components or pages.
// It contains crypto operations and DB access for the Anthropic API key.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { db } from '@/db';
import { llmKeyConfig, auditHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { LlmKeyStatus } from './types';

const ALGORITHM = 'aes-256-gcm';

/**
 * Derives the 32-byte encryption key from API_KEY_ENCRYPTION_SECRET env var.
 * Throws at startup if the secret is absent or not exactly 64 hex chars (32 bytes).
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!secret || secret.length !== 64) {
    throw new Error(
      'API_KEY_ENCRYPTION_SECRET must be set and exactly 64 hex characters (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(secret, 'hex');
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns ciphertext, iv, and authTag all hex-encoded.
 */
function encrypt(plaintext: string): { ciphertext: string; iv: string; authTag: string } {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString('hex'),
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts AES-256-GCM ciphertext. Throws if tampered (authTag mismatch).
 */
function decrypt(ciphertext: string, iv: string, authTag: string): string {
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(authTag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/**
 * Produces a masked representation of the key for display only.
 * Shows first 10 chars + "****". Example: "sk-ant-api...****"
 * Never call this with the full key on the client side.
 */
function maskKey(plaintext: string): string {
  if (plaintext.length <= 10) return '****';
  return plaintext.slice(0, 10) + '...****';
}

/**
 * Writes a safe audit event for key operations.
 * NEVER includes the key value in the payload.
 */
async function writeKeyAuditEvent(action: 'LLM_KEY_CONFIGURED' | 'LLM_KEY_REMOVED'): Promise<void> {
  await db.insert(auditHistory).values({
    eventType: action,
    phaseId: null,
    description: action === 'LLM_KEY_CONFIGURED'
      ? 'Anthropic API key configured via Settings UI'
      : 'Anthropic API key removed via Settings UI',
    actor: 'system',
    relatedIds: [],
    // IMPORTANT: payload intentionally omits key value
    payload: { action, source: 'settings-ui' },
  });
}

/**
 * SERVER-ONLY: Decrypts and returns the plaintext Anthropic API key.
 * Called by BaseAgent.callLLM() at LLM invocation time.
 * Throws LLM_KEY_NOT_CONFIGURED error if no key is stored.
 */
export async function getLlmApiKey(): Promise<string> {
  const rows = await db.select().from(llmKeyConfig).limit(1);
  if (rows.length === 0) {
    const err = new Error(
      'Anthropic API key is not configured. Go to Settings to add your key.'
    );
    (err as NodeJS.ErrnoException).code = 'LLM_KEY_NOT_CONFIGURED';
    throw err;
  }
  const { ciphertext, iv, authTag } = rows[0];
  return decrypt(ciphertext, iv, authTag);
}

/**
 * Encrypts the given plaintext key and upserts it into llm_key_config.
 * Only one row ever exists. Overwrites any existing key.
 */
export async function saveLlmApiKey(plaintext: string): Promise<void> {
  // Basic format validation — Anthropic keys start with "sk-ant-"
  if (!plaintext.startsWith('sk-ant-') || plaintext.length < 20) {
    throw new Error('Invalid Anthropic API key format. Key must start with "sk-ant-".');
  }

  const { ciphertext, iv, authTag } = encrypt(plaintext);
  const masked = maskKey(plaintext);
  const now = new Date().toISOString();

  const existing = await db.select({ configId: llmKeyConfig.configId }).from(llmKeyConfig).limit(1);

  if (existing.length > 0) {
    await db.update(llmKeyConfig)
      .set({ ciphertext, iv, authTag, maskedKey: masked, updatedAt: now })
      .where(eq(llmKeyConfig.configId, existing[0].configId));
  } else {
    await db.insert(llmKeyConfig).values({ ciphertext, iv, authTag, maskedKey: masked });
  }

  await writeKeyAuditEvent('LLM_KEY_CONFIGURED');
}

/**
 * Removes the stored LLM key. After this call getLlmApiKey() will throw.
 */
export async function removeLlmApiKey(): Promise<void> {
  await db.delete(llmKeyConfig);
  await writeKeyAuditEvent('LLM_KEY_REMOVED');
}

/**
 * Returns the safe status object for API responses.
 * NEVER includes the plaintext key.
 */
export async function getLlmKeyStatus(): Promise<LlmKeyStatus> {
  const rows = await db.select({
    maskedKey: llmKeyConfig.maskedKey,
    updatedAt: llmKeyConfig.updatedAt,
  }).from(llmKeyConfig).limit(1);

  if (rows.length === 0) {
    return { configured: false, maskedKey: null, updatedAt: null };
  }
  return {
    configured: true,
    maskedKey: rows[0].maskedKey,
    updatedAt: rows[0].updatedAt,
  };
}
