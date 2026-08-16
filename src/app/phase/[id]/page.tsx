import { AppShell } from '@/components/layout/AppShell';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PhaseWorkspacePage({ params }: Props) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  const phaseName = config?.phaseName ?? `Phase ${phaseId}`;

  return (
    <AppShell phaseId={phaseId}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Phase {phaseId}: {phaseName}
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Phase Workspace — available in a later build phase.
        </p>
      </div>
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
