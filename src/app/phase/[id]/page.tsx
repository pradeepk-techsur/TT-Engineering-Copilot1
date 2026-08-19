import { AppShell } from '@/components/layout/AppShell';
import { InputReadinessPanel } from '@/components/intake/InputReadinessPanel';
import { OutputsPanel } from '@/components/phase/OutputsPanel';
import { PhaseExecutionProgress } from '@/components/execution/PhaseExecutionProgress';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PhaseWorkspacePage({ params }: Props) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  if (!config || phaseId < 0 || phaseId > 9) {
    return (
      <AppShell>
        <p className="text-sm text-[var(--color-text-muted)]">Phase not found.</p>
      </AppShell>
    );
  }

  return (
    <AppShell phaseId={phaseId} gateId={phaseId}>
      <div className="space-y-6">
        {/* Phase header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Phase {phaseId}: {config.phaseName}</h1>
            {config.technicalReview && (
              <p className="text-sm text-blue-400 mt-1">Technical Review: {config.technicalReview}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/phase/${phaseId}/intake`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all h-7 gap-1 px-2.5 text-[0.8rem] bg-background hover:bg-muted hover:text-foreground"
            >
              Open Intake Detail
            </Link>
            {config.technicalReview && (
              <Link
                href={`/phase/${phaseId}/checklist`}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all h-7 gap-1 px-2.5 text-[0.8rem] bg-background hover:bg-muted hover:text-foreground"
              >
                Open Checklist
              </Link>
            )}
            <Link
              href={`/gate/${phaseId}/review`}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-border bg-clip-padding text-sm font-medium whitespace-nowrap transition-all h-7 gap-1 px-2.5 text-[0.8rem] bg-background hover:bg-muted hover:text-foreground"
            >
              Open Gate Review
            </Link>
          </div>
        </div>

        {/* Phase execution progress — polls every 2s */}
        <PhaseExecutionProgress phaseId={phaseId} />

        {/* Input Readiness Panel — both inputs */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-base">Input Readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <InputReadinessPanel phaseId={phaseId} />
          </CardContent>
        </Card>

        {/* Outputs panel — live from /api/phases/{phaseId}/outputs via SWR for all phases 0–9. */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-base">Outputs for Human Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <OutputsPanel phaseId={phaseId} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
