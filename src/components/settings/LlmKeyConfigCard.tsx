'use client';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { KeyRound, ShieldCheck, ShieldOff, Loader2, Trash2, Save } from 'lucide-react';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/format';
import { useLlmKeyStatus, type LlmKeyStatus } from '@/lib/hooks';

export function LlmKeyConfigCard() {
  /**
   * Shared with the top-bar badge rather than kept in local state. This card
   * used to own a private copy and update only itself, so saving a key left the
   * badge still reading "LLM Key Not Set" until the page was reloaded.
   */
  const { data: status, error: loadError, mutate } = useLlmKeyStatus();
  const [inputKey, setInputKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = async () => {
    if (!inputKey.trim()) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/settings/llm-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: inputKey.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Failed to save API key.');
      } else {
        // Updates this card AND the top-bar badge, in one place.
        await mutate(data as LlmKeyStatus, { revalidate: false });
        setInputKey(''); // Clear immediately — key no longer in component state
        setSuccessMsg('API key saved and encrypted successfully.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/settings/llm-key', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Failed to remove API key.');
      } else {
        await mutate(data as LlmKeyStatus, { revalidate: false });
        setSuccessMsg('API key removed. AI agents will not function until a new key is saved.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound size={15} strokeWidth={2} className="text-fg-muted" />
          <CardTitle>Anthropic API Key</CardTitle>
        </div>
        <CardDescription>
          The key is encrypted at rest (AES-256-GCM) and never transmitted back to the browser
          after saving. It is used exclusively by server-side AI agents to call the Claude API.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current status */}
        {!status && loadError ? (
          <Callout tone="fail" icon={ShieldOff} title="Could not load key status">
            The settings service did not respond. It will retry automatically.
          </Callout>
        ) : !status ? (
          <Skeleton className="h-11 rounded-lg" />
        ) : status.configured ? (
          <div data-testid="key-configured-status">
            <Callout tone="pass" icon={ShieldCheck} title="Key configured">
              <span className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[11.5px] text-fg-2">
                  {status.maskedKey}
                </code>
                {status.updatedAt && <span>saved {formatDate(status.updatedAt)}</span>}
              </span>
            </Callout>
          </div>
        ) : (
          <div data-testid="key-not-configured-status">
            <Callout tone="warn" icon={ShieldOff} title="No key configured">
              AI agents cannot run until a key is saved. Gate decisions and the audit
              log are unaffected.
            </Callout>
          </div>
        )}

        {/* Key entry — always password type, no show-toggle */}
        <div className="space-y-1.5">
          <Label htmlFor="llm-key-input">
            {status?.configured ? 'Enter new key to replace existing' : 'Enter Anthropic API key'}
          </Label>
          <Input
            id="llm-key-input"
            type="password"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="sk-ant-api03-..."
            value={inputKey}
            onChange={e => {
              setInputKey(e.target.value);
              setError(null);
              setSuccessMsg(null);
            }}
            className="font-mono"
            data-testid="llm-key-input"
          />
          <p className="text-[11.5px] text-fg-muted">
            To update, enter a new key and save again.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <p className="text-[12px] font-medium text-fail" data-testid="key-error-msg">{error}</p>
        )}
        {successMsg && (
          <p className="text-[12px] font-medium text-pass" data-testid="key-success-msg">{successMsg}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-line pt-4">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !inputKey.trim()}
            data-testid="save-key-btn"
          >
            {saving ? (
              <Loader2 size={13} strokeWidth={2} className="animate-spin" />
            ) : (
              <Save size={13} strokeWidth={2} />
            )}
            {saving ? 'Saving…' : 'Save key'}
          </Button>

          {status?.configured && (
            <AlertDialog>
              <AlertDialogTrigger
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={removing}
                    data-testid="remove-key-btn"
                  >
                    {removing ? (
                      <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} strokeWidth={2} />
                    )}
                    {removing ? 'Removing…' : 'Remove key'}
                  </Button>
                }
              />
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Anthropic API Key?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the stored key. All AI agents (Phase 0–9) will
                    stop functioning until a new key is saved. Gate decisions already recorded
                    are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemove}>Remove Key</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
