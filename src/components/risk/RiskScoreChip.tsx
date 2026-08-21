import { ShieldAlert } from 'lucide-react';
import { StatusPill } from '@/components/ui/status-pill';
import { riskLevelTone } from '@/lib/riskDisplay';
import type { RiskLevel } from '@/shared/types/risk';

/**
 * The compact risk display. Number and level word together — "Risk: 68 / 100,
 * High". Never colour alone: the level is always spelled out.
 *
 * Built on StatusPill rather than composing its own chip, so it inherits the
 * emphasis rules with everything else. That matters here more than most places:
 * a Low score is a settled state and reads quiet, while Medium and above are
 * tinted because they are the ones asking for a reviewer's attention. Rendering
 * its own tinted pill made every Low score shout as loudly as a Critical one.
 */
export function RiskScoreChip({
  score,
  level,
  cap = 100,
  assessed = true,
  size = 'md',
  showIcon = false,
  className,
}: {
  score: number;
  level: RiskLevel;
  cap?: number;
  assessed?: boolean;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}) {
  if (!assessed) {
    return (
      <StatusPill tone="neutral" size={size} dot={false} className={className}>
        Risk: not assessed
      </StatusPill>
    );
  }

  return (
    <StatusPill
      tone={riskLevelTone[level]}
      size={size}
      // The icon stands in for the dot when asked for, so the pill never shows
      // both markers.
      dot={showIcon ? false : undefined}
      className={className}
    >
      {showIcon && (
        <ShieldAlert size={size === 'sm' ? 10 : 12} strokeWidth={2.5} className="shrink-0" />
      )}
      <span className="tabular-nums">
        Risk: {score} / {cap},
      </span>
      <span className="font-semibold">{level}</span>
    </StatusPill>
  );
}
