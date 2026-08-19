import { AppShell } from '@/components/layout/AppShell';
import { AuditLogTable } from '@/components/audit/AuditLogTable';

export default function AuditViewPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Audit View</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Immutable intake event log — all phases, all intake actions
          </p>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          Nine fields per intake event per FRD F02: phase, logical input, intake behavior, user action,
          system represented, status, source artifact, version, timestamp.
        </p>
        <AuditLogTable />
      </div>
    </AppShell>
  );
}
