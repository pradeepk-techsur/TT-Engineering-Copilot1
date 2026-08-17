import { AppShell } from '@/components/layout/AppShell';
import { GateReviewWorkspace } from '@/components/gate/GateReviewWorkspace';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GateReviewPage({ params }: Props) {
  const { id } = await params;
  const gateId = parseInt(id);

  if (isNaN(gateId) || gateId < 0 || gateId > 9) {
    return (
      <AppShell>
        <p className="text-sm text-[var(--color-text-muted)]">Invalid gate number.</p>
      </AppShell>
    );
  }

  return (
    <AppShell phaseId={gateId} gateId={gateId}>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Gate {gateId} Review Workspace</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            TT Electronics ENG 001 v4.1 — Human gate decision required
          </p>
        </div>
        {/* Gate Review Workspace built dynamically from ProjectState */}
        <GateReviewWorkspace gateId={gateId} />
      </div>
    </AppShell>
  );
}
