import Link from 'next/link';
import { fetchJson } from '@/lib/serverFetch';
import { ArrowRight, GitBranch } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/card';
import { PageHeader, SectionLabel } from '@/components/ui/page-header';
import { StatusPillFor } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { Hint } from '@/components/ui/hint';
import { LifecycleSummaryBanner } from '@/components/lifecycle/LifecycleSummaryBanner';
import { TechReviewBadge } from '@/components/lifecycle/TechReviewBadge';
import { LifecycleRiskCell } from '@/components/risk/LifecycleRiskCell';
import { phaseStateStyle, gateStateStyle, styleFor, BEHAVIOR_GLOSSARY } from '@/lib/status';
import { cn } from '@/lib/utils';

async function getLifecycleData() {
  // Resolves against the origin this request arrived on, and returns null
  // rather than throwing — an unreachable API degrades the page, not a 500.
  return fetchJson<any>('/api/lifecycle');
}

export default async function LifecycleViewPage() {
  const data = await getLifecycleData();
  const phases: any[] = data?.phases ?? [];
  const currentPhaseId: number | undefined =
    typeof data?.currentPhase === 'number' ? data.currentPhase : undefined;

  return (
    <AppShell>
      <PageHeader
        title="Product Lifecycle View"
        subtitle="Ten phases, each closed by a human gate decision."
      />

      <div className="space-y-5">
        <LifecycleSummaryBanner />

        <div>
          <SectionLabel>Phases &amp; gates</SectionLabel>

          {/* One card, ten dense rows. This was ten separate cards, each
              ~100px tall for ~40px of content — four screens of scrolling
              to read a ten-item list. */}
          <Card className="py-0">
            {phases.length === 0 ? (
              <EmptyState
                icon={GitBranch}
                title="No phases to show"
                description="The lifecycle service returned no phases. Check that the app's API is reachable."
              />
            ) : (
              <ol className="divide-y divide-line">
                {phases.map((phase: any) => {
                  const state = styleFor(phaseStateStyle, phase.phaseState);
                  const gate = styleFor(gateStateStyle, phase.gateState);
                  const isCurrent = phase.phaseId === currentPhaseId;

                  return (
                    <li
                      key={phase.phaseId}
                      data-testid={`phase-${phase.phaseId}`}
                      className={cn(
                        'group relative flex items-center gap-4 px-4 py-3 transition-colors hover:bg-hover',
                        isCurrent && 'bg-hover'
                      )}
                    >
                      {isCurrent && (
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 w-[2.5px] bg-accent-solid"
                        />
                      )}

                      {/* Phase marker. Plain even when current — the accent
                          rule down the left edge and the "Current" caption
                          already mark the row twice. */}
                      <span
                        className={cn(
                          'flex size-8 shrink-0 items-center justify-center rounded-lg border text-[12.5px] font-semibold tabular-nums',
                          isCurrent
                            ? 'border-line-strong bg-raised text-fg'
                            : 'border-line bg-raised text-fg-muted'
                        )}
                      >
                        {phase.phaseId}
                      </span>

                      {/* Identity */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/phase/${phase.phaseId}`}
                            className="rounded text-[13.5px] font-semibold text-fg transition-colors hover:text-accent-solid"
                          >
                            {phase.phaseName}
                          </Link>
                          {phase.technicalReview && (
                            <TechReviewBadge review={phase.technicalReview} />
                          )}
                          {isCurrent && (
                            <span className="text-[9.5px] font-bold tracking-[0.08em] text-accent-solid uppercase">
                              Current
                            </span>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] text-fg-muted">
                          {/* No dot: the gate word is already plain
                              ("Decided" / "Open" / "Locked"), and the state
                              pill at the end of the row carries the tone. Two
                              green dots per row taught nothing. */}
                          <span>
                            Gate {phase.phaseId} · {gate.label}
                          </span>
                          {/* "Ext: UP / Int: SI" was raw jargon with nothing
                              to click. Now each code explains itself. */}
                          <span>
                            External&nbsp;
                            <Hint label={phase.externalIntakeBehavior}>
                              {BEHAVIOR_GLOSSARY[phase.externalIntakeBehavior] ??
                                phase.externalIntakeBehavior}
                            </Hint>
                          </span>
                          <span>
                            Internal&nbsp;
                            <Hint label={phase.internalIntakeBehavior}>
                              {BEHAVIOR_GLOSSARY[phase.internalIntakeBehavior] ??
                                phase.internalIntakeBehavior}
                            </Hint>
                          </span>
                          {/* One compact risk indicator per active or completed
                              phase. Selecting it opens what contributes to it. */}
                          <LifecycleRiskCell
                            phaseId={phase.phaseId}
                            phaseState={phase.phaseState}
                          />
                        </div>
                      </div>

                      {/* State + gate entry */}
                      <div className="flex shrink-0 items-center gap-3">
                        <StatusPillFor status={state} />
                        <Link
                          href={`/gate/${phase.phaseId}/review`}
                          aria-label={`Go to Gate ${phase.phaseId} Review`}
                          className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-medium text-fg-muted transition-colors hover:bg-active hover:text-accent-solid"
                        >
                          Gate review
                          <ArrowRight
                            size={12}
                            strokeWidth={2}
                            className="transition-transform group-hover:translate-x-0.5"
                          />
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
