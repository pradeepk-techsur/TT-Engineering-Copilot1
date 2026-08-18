import { AppShell } from '@/components/layout/AppShell';
import { FindingsActionsWorkspace } from '@/components/findings/FindingsActionsWorkspace';

export default function FindingsActionsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Findings and Actions</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          All findings and actions across the EV-INV-800 lifecycle
        </p>
        <FindingsActionsWorkspace />
      </div>
    </AppShell>
  );
}
