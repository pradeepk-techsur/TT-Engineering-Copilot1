import { ArrowRight, FileInput, ListChecks, ShieldCheck, PackageOpen, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { InputReadinessPanel } from '@/components/intake/InputReadinessPanel';
import { OutputsPanel } from '@/components/phase/OutputsPanel';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button-link';
import { EmptyState } from '@/components/ui/empty-state';
import { TechReviewBadge } from '@/components/lifecycle/TechReviewBadge';
import { RiskScoreLive } from '@/components/risk/RiskScoreLive';

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
        <EmptyState
          icon={Search}
          title="Phase not found"
          description="This project runs Phase 0 through Phase 9. Pick a phase from the rail on the left."
          action={<ButtonLink href="/lifecycle">View lifecycle</ButtonLink>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell phaseId={phaseId} gateId={phaseId}>
      <PageHeader
        title={`Phase ${phaseId}: ${config.phaseName}`}
        subtitle="Bring both inputs to ready, run the phase, then take the outputs to the gate."
        meta={
          <>
            {/* The Overall Risk Score for this phase. Compact here — select it
                for the findings, actions, checks and evidence behind it. */}
            <RiskScoreLive
              phaseId={phaseId}
              label={`Phase ${phaseId} — Overall Risk Score`}
              testId="phase-risk-score"
            />
            {config.technicalReview && (
              <>
                <span className="text-[11.5px] text-fg-muted">Technical review</span>
                <TechReviewBadge review={config.technicalReview} />
              </>
            )}
          </>
        }
        actions={
          <>
            <ButtonLink size="sm" href={`/phase/${phaseId}/intake`}>
              <FileInput size={14} strokeWidth={2} />
              Open Intake Detail
            </ButtonLink>
            {config.technicalReview && (
              <ButtonLink size="sm" href={`/phase/${phaseId}/checklist`}>
                <ListChecks size={14} strokeWidth={2} />
                Open Checklist
              </ButtonLink>
            )}
            <ButtonLink variant="default" size="sm" href={`/gate/${phaseId}/review`}>
              <ShieldCheck size={14} strokeWidth={2} />
              Open Gate Review
              <ArrowRight size={13} strokeWidth={2} />
            </ButtonLink>
          </>
        }
      />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Input readiness</CardTitle>
            <CardDescription>
              A phase can only run once both its external-source and
              internal-artifact inputs are ready.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InputReadinessPanel phaseId={phaseId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackageOpen size={15} strokeWidth={2} className="text-fg-muted" />
              Outputs for human approval
            </CardTitle>
            <CardDescription>
              Artifacts produced by this phase. Every one carries the synthetic-POC
              disclaimer and needs a human decision at the gate.
            </CardDescription>
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
