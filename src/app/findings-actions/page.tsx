import { AppShell } from '@/components/layout/AppShell';

export default function FindingsActionsPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Findings &amp; Actions
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Available in Phase 4 — Lifecycle Phases 3–4 Agents.
        </p>
      </div>
    </AppShell>
  );
}
