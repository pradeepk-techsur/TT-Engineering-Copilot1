'use client';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';
import { StatusPill } from '@/components/ui/status-pill';
import { useLlmKeyStatus } from '@/lib/hooks';

export function LlmKeyStatusBadge() {
  // Was a bare fetch in useEffect, so every page navigation re-hit this
  // endpoint. Cached via SWR now — it only changes on the settings page.
  const { data, error } = useLlmKeyStatus();

  if (!data && !error) return null;
  const configured = data?.configured ?? false;

  // Unset is a real blocker — AI phases can't run — but this sits in the
  // chrome on every screen, so it earns a dot, not a fill. `emphasis="quiet"`
  // keeps the warn tone (and therefore the amber dot) while dropping the
  // tinted slab that made the top bar compete with the page.
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
        emphasis="quiet"
        size="sm"
        dot={!configured}
        className="gap-1.5 transition-colors hover:border-line-strong hover:text-fg"
        data-testid="llm-key-status-badge"
      >
        <KeyRound size={10} strokeWidth={2.5} />
        {/* "Configured" matches the wording on the settings card, so the two
            never describe the same state with different words. */}
        {configured ? 'LLM Key Configured' : 'LLM Key Not Set'}
      </StatusPill>
    </Link>
  );
}
