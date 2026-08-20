import { NextRequest, NextResponse } from 'next/server';
import { getLlmKeyStatus, saveLlmApiKey, removeLlmApiKey } from '@/server/config/llmKeyService';

/**
 * GET /api/settings/llm-key
 * Returns whether the key is configured and the masked representation.
 * NEVER returns the real key.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const status = await getLlmKeyStatus();
    return NextResponse.json(status);
  } catch (err) {
    // The top bar polls this on every page. In Preview mode the key store is
    // simply unreachable, which means "no key configured" — not a server
    // fault. Returning 500 put a red error in the console of every screen in
    // the app and told the user nothing they could act on.
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ECONNREFUSED' || code === 'ENOTFOUND' || code === 'ETIMEDOUT') {
      return NextResponse.json({
        configured: false, maskedKey: null, updatedAt: null, storeUnavailable: true,
      });
    }
    console.error('[settings/llm-key GET]', err);
    return NextResponse.json(
      { error_code: 'INTERNAL_ERROR', message: 'Failed to retrieve key status.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/llm-key
 * Body: { key: string }
 * Encrypts and stores the Anthropic API key.
 * Returns { configured: true, maskedKey: "sk-ant-...****" }.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const { key } = body as { key?: string };

    if (!key || typeof key !== 'string' || key.trim().length === 0) {
      return NextResponse.json(
        { error_code: 'MISSING_KEY', message: 'Request body must include a non-empty "key" field.' },
        { status: 400 }
      );
    }

    await saveLlmApiKey(key.trim());
    const status = await getLlmKeyStatus();
    return NextResponse.json(status, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save key.';

    if (message.includes('Invalid Anthropic API key format') || message.includes('API_KEY_ENCRYPTION_SECRET')) {
      return NextResponse.json({ error_code: 'INVALID_KEY', message }, { status: 400 });
    }

    console.error('[settings/llm-key POST]', err);
    return NextResponse.json(
      { error_code: 'INTERNAL_ERROR', message: 'Failed to save API key.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/llm-key
 * Removes the stored key. After this, agents cannot call the LLM until a new key is saved.
 */
export async function DELETE(): Promise<NextResponse> {
  try {
    await removeLlmApiKey();
    return NextResponse.json({ configured: false, maskedKey: null, updatedAt: null });
  } catch (err) {
    console.error('[settings/llm-key DELETE]', err);
    return NextResponse.json(
      { error_code: 'INTERNAL_ERROR', message: 'Failed to remove API key.' },
      { status: 500 }
    );
  }
}
