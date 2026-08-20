'use client';

import { usePhaseRisk } from '@/lib/hooks';
import { RiskScoreIndicator } from './RiskScoreIndicator';
import { Skeleton } from '@/components/ui/skeleton';
import type { RiskScore } from '@/shared/types/risk';

/**
 * The risk score for one phase, fetched client-side.
 *
 * Used in headers that are server-rendered but need a live number — the phase
 * workspace and the gate review. Reserves its own width while loading so the
 * header does not jump when the score lands.
 */
export function RiskScoreLive({
  phaseId,
  label,
  size = 'md',
  testId,
}: {
  phaseId: number;
  label: string;
  size?: 'sm' | 'md';
  testId?: string;
}) {
  const { data, isLoading } = usePhaseRisk(phaseId);

  if (isLoading && !data) {
    return <Skeleton className="h-[22px] w-[152px] rounded-full" />;
  }
  if (!data || (data as { error_code?: string }).error_code) return null;


  return (
    <RiskScoreIndicator
      risk={data as RiskScore}
      label={label}
      size={size}
      testId={testId}
    />
  );
}
