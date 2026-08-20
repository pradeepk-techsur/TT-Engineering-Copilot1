import { ArrowRight, FileInput, ListChecks, ShieldCheck, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { InputReadinessPanel } from '@/components/intake/InputReadinessPanel';
import { OutputsPanel } from '@/components/phase/OutputsPanel';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader, SectionLabel } from '@/components/ui/page-header';
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
        subtitle="Inputs, execution, and the outputs that go to the gate."
        meta={
          <>
            {/* The Overall Risk Score for this phase. Compact here — select it
                for the findings, actions, checks and evidence behind it. */}
            <RiskScoreLive
              phaseId={phaseId}
              label={`Phase ${phaseId} — Overall Risk Score`}
              testId="phase-risk-score"
            />
            {config.technicalReview && <TechReviewBadge review={config.technicalReview} />}
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

      {/* Two sections, each a labelled group rather than a titled card.
          Wrapping the intake panel in a Card put three levels of border
          around every input — outer card, then the run bar and each intake
          card, then the dropzone or sample box inside those. Boxes inside
          boxes inside boxes is most of why this screen read as busy. */}
      <div className="space-y-6">
        <section>
          <SectionLabel>Input readiness</SectionLabel>
          <InputReadinessPanel phaseId={phaseId} />
        </section>

        <section>
          <SectionLabel>Outputs for human approval</SectionLabel>
          <Card>
            <CardContent>
              <OutputsPanel phaseId={phaseId} />
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
