'use client';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/status-pill';
import { cn } from '@/lib/utils';
import { useLlmKeyStatus } from '@/lib/hooks';

export function LlmKeyStatusBadge() {
  // Was a bare fetch in useEffect, so every page navigation re-hit this
  // endpoint. Cached via SWR now — it only changes on the settings page.
  const { data, error } = useLlmKeyStatus();

  if (!data && !error) return null;
  const configured = data?.configured ?? false;

  // Unset is a real blocker — AI phases can't run — so it stays prominent,
  // but as a quiet warning rather than a pulsing red alarm in the chrome.
  return (
    <Link
      href="/settings"
      title={
        configured
          ? 'Anthropic API key is configured'
          : 'No Anthropic API key — AI agents cannot run. Click to configure.'
      }
      className="rounded-full"
    >
      <StatusPill
        tone={configured ? 'pass' : 'warn'}
        className={cn('gap-1.5 transition-colors', !configured && 'hover:bg-warn-soft')}
        data-testid="llm-key-status-badge"
      >
        <KeyRound size={11} strokeWidth={2.5} />
        {/* "Configured" matches the wording on the settings card, so the two
            never describe the same state with different words. */}
        {configured ? 'LLM Key Configured' : 'LLM Key Not Set'}
      </StatusPill>
    </Link>
  );
}
