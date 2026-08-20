import { AppShell } from '@/components/layout/AppShell';
import { AuditTabs } from '@/components/audit/AuditTabs';
import { PageHeader } from '@/components/ui/page-header';

export default function AuditPage() {
  return (
    <AppShell>
      <PageHeader
        title="Audit &amp; Findings"
        subtitle="Intake events, gate decisions, findings and actions across all lifecycle phases."
      />
      <AuditTabs />
    </AppShell>
  );
}
