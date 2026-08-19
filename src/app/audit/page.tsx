import { AppShell } from '@/components/layout/AppShell';
import { AuditTabs } from '@/components/audit/AuditTabs';

export default function AuditViewPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Audit &amp; Findings</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Intake events, gate decisions, findings, and actions across all lifecycle phases
          </p>
        </div>
        <AuditTabs />
      </div>
    </AppShell>
  );
}
