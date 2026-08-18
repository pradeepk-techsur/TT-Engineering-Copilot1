'use client';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { KeyRound } from 'lucide-react';
import Link from 'next/link';

export function LlmKeyStatusBadge() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/settings/llm-key')
      .then(r => r.json())
      .then((d: { configured: boolean }) => setConfigured(d.configured))
      .catch(() => setConfigured(false));
  }, []);

  if (configured === null) return null;

  return (
    <Link href="/settings" title="Configure LLM API Key">
      <Badge
        className={`text-xs cursor-pointer border gap-1 ${
          configured
            ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 animate-pulse'
        }`}
        data-testid="llm-key-status-badge"
      >
        <KeyRound size={10} />
        {configured ? 'LLM Key: Configured' : 'LLM Key: Not Set'}
      </Badge>
    </Link>
  );
}
