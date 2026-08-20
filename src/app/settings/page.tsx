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
          subtitle="Credentials this POC needs to run its AI agent phases."
        />

        <section>
          <SectionLabel>AI configuration</SectionLabel>
          <LlmKeyConfigCard />
        </section>
      </div>
    </AppShell>
  );
}
