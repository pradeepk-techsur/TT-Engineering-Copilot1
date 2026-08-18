import { AppShell } from '@/components/layout/AppShell';
import { TechnicalChecklistWorkspace } from '@/components/checklist/TechnicalChecklistWorkspace';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TechnicalChecklistPage({ params }: Props) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  return (
    <AppShell phaseId={phaseId}>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Technical Checklist Workspace</h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Phase {phaseId}: {config?.phaseName ?? `Phase ${phaseId}`}
        </p>
        <TechnicalChecklistWorkspace phaseId={phaseId} />
      </div>
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
