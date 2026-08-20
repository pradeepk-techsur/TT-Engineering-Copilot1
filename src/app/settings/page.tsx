import { AppShell } from '@/components/layout/AppShell';
import { LlmKeyConfigCard } from '@/components/settings/LlmKeyConfigCard';
import { PageHeader, SectionLabel } from '@/components/ui/page-header';

export const metadata = {
  title: 'Settings — TT Engineering Copilot',
};

export default function SettingsPage() {
  return (
    <AppShell>
      {/* Narrow reading column — a single settings card stranded in a
          1400px-wide canvas looked like a rendering fault. */}
      <div className="max-w-2xl">
        <PageHeader
          title="Settings"
          subtitle="The Anthropic API key is required for all AI agent phases (Phase 0–9). It is stored encrypted and is never visible after saving."
        />

        <section>
          <SectionLabel>AI configuration</SectionLabel>
          <LlmKeyConfigCard />
        </section>
      </div>
    </AppShell>
  );
}
