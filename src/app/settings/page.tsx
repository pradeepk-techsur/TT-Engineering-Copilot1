import { AppShell } from '@/components/layout/AppShell';
import { LlmKeyConfigCard } from '@/components/settings/LlmKeyConfigCard';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Settings — TT Engineering Copilot',
};

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-[var(--color-text-muted)]" />
          <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h1>
        </div>

        <p className="text-sm text-[var(--color-text-muted)] max-w-xl">
          Configure application settings. The Anthropic API key is required for all
          AI agent phases (Phase 0–9). It is stored encrypted and is never visible
          after saving.
        </p>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-[var(--color-text-primary)]">AI Configuration</h2>
          <LlmKeyConfigCard />
        </section>
      </div>
    </AppShell>
  );
}
