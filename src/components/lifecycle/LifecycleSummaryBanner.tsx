'use client';
import { useLifecycle } from '@/lib/hooks';
import { PhaseStepper } from './PhaseStepper';
import { StatusPill } from '@/components/ui/status-pill';
import { Skeleton } from '@/components/ui/skeleton';

const CLEARED = ['GatePassed', 'GateConditional'];

/**
 * The programme at a glance, at the top of the Product Lifecycle View.
 *
 * This used to be a grid of ten G0–G9 outcome tiles, each tinted by its state.
 * The ten-row list directly beneath it already carries every one of those
 * outcomes — with the phase name, the gate state, the risk score and a link —
 * so the grid was twenty extra elements and ten extra colour fields restating
 * the thing you were about to read. Two facts and the journey rail instead.
 *
 * The rail is the phase stepper, which used to sit in the app chrome on all
 * ten screens. Here it has a job: this is the page about the lifecycle.
 */
export function LifecycleSummaryBanner() {
  const { data, isLoading } = useLifecycle();

  // Previously returned null until data arrived, so the banner popped into
  // existence and shoved the page down. Reserve the space instead.
  if (isLoading && !data) {
    return (
      <div className="rounded-xl border border-line bg-surface px-4 py-3">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-3.5 h-8 w-full rounded-lg" />
      </div>
    );
  }

  if (!data?.phases) return null;

  const phases: { phaseId: number; phaseState: string }[] = data.phases;
  const cleared = phases.filter(p => CLEARED.includes(p.phaseState)).length;
  const currentPhase =
    typeof data.currentPhase === 'number' ? data.currentPhase : undefined;
  const projectClosed = data.projectStatus === 'Closed';

  return (
    <div
      className="rounded-xl border border-line bg-surface px-4 pt-3 pb-4 shadow-sm"
      data-testid="lifecycle-summary-banner"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <p className="text-[10.5px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
          Gate outcomes
        </p>
        <div className="flex items-center gap-2.5 text-[11.5px] text-fg-muted tabular-nums">
          <span>
            <span className="font-semibold text-fg">{cleared}</span> of {phases.length} gates
            cleared
          </span>
          {currentPhase !== undefined && !projectClosed && (
            <>
              <span aria-hidden className="text-fg-faint">
                ·
              </span>
              <span>Gate {currentPhase} current</span>
            </>
          )}
          {projectClosed && (
            <StatusPill tone="neutral" size="sm">
              Project closed
            </StatusPill>
          )}
        </div>
      </div>

      <div className="mt-3">
        <PhaseStepper currentPhaseId={currentPhase} />
      </div>
    </div>
  );
}
