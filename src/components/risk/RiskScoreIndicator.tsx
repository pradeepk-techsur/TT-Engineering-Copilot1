'use client';

import { RiskScoreChip } from './RiskScoreChip';
import { RiskScoreDetail } from './RiskScoreDetail';
import { cn } from '@/lib/utils';
import type { RiskScore } from '@/shared/types/risk';

/**
 * The compact risk score, selectable.
 *
 * Everywhere the score appears — phase header, gate header, lifecycle row — it
 * is this component: number plus level word, and selecting it opens the
 * contributing findings, open actions, failed checks and missing evidence.
 */
export function RiskScoreIndicator({
  risk,
  label,
  size = 'md',
  className,
  testId = 'risk-score-indicator',
}: {
  risk: RiskScore | null | undefined;
  /** Dialog title, e.g. "Gate 3 — Overall Risk Score". */
  label: string;
  size?: 'sm' | 'md';
  className?: string;
  testId?: string;
}) {
  if (!risk) return null;

  const chip = (
    <button
      type="button"
      data-testid={testId}
      aria-label={`${label}. ${risk.assessed ? `${risk.score} out of ${risk.configSnapshot?.cap ?? 100}, ${risk.level}` : 'Not assessed'}. Select to see what contributes to it.`}
      className={cn(
        'cursor-pointer rounded-full transition-opacity hover:opacity-80',
        'focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:ring-offset-1 focus-visible:outline-none',
        className
      )}
    >
      <RiskScoreChip
        score={risk.score}
        level={risk.level}
        cap={risk.configSnapshot?.cap ?? 100}
        assessed={risk.assessed}
        size={size}
      />
    </button>
  );

  return <RiskScoreDetail risk={risk} title={label} trigger={chip} />;
}
