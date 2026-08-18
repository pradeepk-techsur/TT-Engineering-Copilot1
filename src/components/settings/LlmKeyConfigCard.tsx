'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { KeyRound, ShieldCheck, ShieldOff, Loader2 } from 'lucide-react';

interface KeyStatus {
  configured: boolean;
  maskedKey: string | null;
  updatedAt: string | null;
}

export function LlmKeyConfigCard() {
  const [status, setStatus] = useState<KeyStatus | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/llm-key')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setError('Failed to load key status.'));
  }, []);

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
        setStatus(data);
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
        setStatus(data);
        setSuccessMsg('API key removed. AI agents will not function until a new key is saved.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)] max-w-xl">
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-[var(--color-text-muted)]" />
          <CardTitle className="text-base">Anthropic API Key</CardTitle>
        </div>
        <CardDescription className="text-[var(--color-text-muted)] text-xs">
          The key is encrypted at rest (AES-256-GCM) and never transmitted back to the browser
          after saving. It is used exclusively by server-side AI agents to call the Claude API.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current status */}
        {status === null ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Loader2 size={14} className="animate-spin" />
            Loading status...
          </div>
        ) : status.configured ? (
          <div className="flex items-center gap-2 flex-wrap" data-testid="key-configured-status">
            <ShieldCheck size={14} className="text-green-400" />
            <span className="text-sm text-green-400">Key configured</span>
            <code className="text-xs font-mono text-[var(--color-text-muted)] bg-black/20 px-2 py-0.5 rounded">
              {status.maskedKey}
            </code>
            {status.updatedAt && (
              <span className="text-xs text-[var(--color-text-muted)]">
                — saved {new Date(status.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2" data-testid="key-not-configured-status">
            <ShieldOff size={14} className="text-red-400" />
            <span className="text-sm text-red-400">No key configured — AI agents cannot run</span>
          </div>
        )}

        {/* Key entry — always password type, no show-toggle */}
        <div className="space-y-1.5">
          <Label htmlFor="llm-key-input" className="text-xs text-[var(--color-text-muted)]">
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
            className="font-mono text-sm"
            data-testid="llm-key-input"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Key is not visible after saving. To update, enter a new key and save again.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <p className="text-xs text-red-400" data-testid="key-error-msg">{error}</p>
        )}
        {successMsg && (
          <p className="text-xs text-green-400" data-testid="key-success-msg">{successMsg}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || !inputKey.trim()}
            data-testid="save-key-btn"
          >
            {saving
              ? <><Loader2 size={12} className="animate-spin mr-1" />Saving...</>
              : 'Save Key'
            }
          </Button>

          {status?.configured && (
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-8 px-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                disabled={removing}
                data-testid="remove-key-btn"
              >
                {removing
                  ? <><Loader2 size={12} className="animate-spin mr-1" />Removing...</>
                  : 'Remove Key'
                }
              </AlertDialogTrigger>
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
