'use client';

import { useLifecycleRisk } from '@/lib/hooks';
import { RiskScoreIndicator } from './RiskScoreIndicator';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * The compact risk indicator on a Product Lifecycle View row.
 *
 * All ten scores come from one request, so ten rows do not fire ten fetches.
 * A phase that has not started shows nothing — the spec puts an indicator
 * beside active and completed phases, and a score on a phase nobody has
 * touched invites the wrong conclusion.
 */
export function LifecycleRiskCell({
  phaseId,
  phaseState,
}: {
  phaseId: number;
  phaseState: string;
}) {
  const { data, isLoading } = useLifecycleRisk();
  const started = phaseState !== 'Pending';

  if (!started) {
    return (
      <span className="text-[11px] text-fg-faint" data-testid={`phase-risk-none-${phaseId}`}>
        Not started
      </span>
    );
  }

  const risk = data?.byPhase?.[phaseId];
  if (!risk) {
    return isLoading ? <Skeleton className="h-[18px] w-[124px] rounded-full" /> : null;
  }

  return (
    <RiskScoreIndicator
      risk={risk}
      label={`Phase ${phaseId} — Overall Risk Score`}
      size="sm"
      testId={`phase-risk-${phaseId}`}
    />
  );
}
