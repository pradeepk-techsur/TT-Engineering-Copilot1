'use client';
import { cn } from '@/lib/utils';
import { useLifecycle } from '@/lib/hooks';
import { gateOutcomeShort, styleFor, toneClass, toneDot } from '@/lib/status';
import { StatusPill } from '@/components/ui/status-pill';
import { Skeleton } from '@/components/ui/skeleton';

export function LifecycleSummaryBanner() {
  const { data, isLoading } = useLifecycle();

  // Previously returned null until data arrived, so the banner popped into
  // existence and shoved the page down. Reserve the space instead.
  if (isLoading && !data) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3">
        <Skeleton className="h-3 w-16" />
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-6 flex-1 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.phases) return null;

  const projectClosed = data.projectStatus === 'Closed';

  return (
    <div
      className="rounded-xl border border-line bg-surface px-4 py-3 shadow-sm"
      data-testid="lifecycle-summary-banner"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10.5px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
          Gate outcomes
        </p>
        {projectClosed && (
          <StatusPill tone="neutral" dot>
            Project closed
          </StatusPill>
        )}
      </div>

      {/* Each gate is a labelled tile rather than a "G0" + pill pair, so the
          row scans as one strip instead of twenty separate elements. */}
      <div className="mt-2.5 grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {data.phases.map((phase: { phaseId: number; phaseState: string }, i: number) => {
          const outcome = styleFor(gateOutcomeShort, phase.phaseState);
          return (
            <div
              key={i}
              title={`Gate ${i} — ${outcome.label}`}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5',
                toneClass[outcome.tone]
              )}
            >
              <span className="font-mono text-[10px] leading-none opacity-70 tabular-nums">
                G{i}
              </span>
              <span className="flex items-center gap-1 text-[11px] leading-none font-semibold">
                <span
                  aria-hidden
                  className={cn('size-1 rounded-full', toneDot[outcome.tone])}
                />
                {outcome.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
