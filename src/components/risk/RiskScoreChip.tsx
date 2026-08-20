import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultEmphasis, toneClass, toneClassQuiet, toneDot } from '@/lib/status';
import { riskLevelEmphasis, riskLevelTone } from '@/lib/riskDisplay';
import type { RiskLevel } from '@/shared/types/risk';

/**
 * The compact risk display. Number and level word together, in one pill —
 * "Risk: 68 / 100, High". Never colour alone: the level is always spelled out,
 * and the dot is decorative.
 *
 * Tinted only at High and Critical. Below that the score is context, not an
 * alarm, and it appears on screens that already have a state pill to read.
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
      <span
        className={cn(
          'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
          size === 'sm' ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-[22px] px-2.5 text-[11.5px]',
          toneClassQuiet.neutral,
          className
        )}
      >
        Risk: not assessed
      </span>
    );
  }

  const tone = riskLevelTone[level];
  const quiet = (riskLevelEmphasis[level] ?? defaultEmphasis[tone]) === 'quiet';

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-[22px] px-2.5 text-[11.5px]',
        quiet ? toneClassQuiet[tone] : toneClass[tone],
        className
      )}
    >
      {showIcon ? (
        <ShieldAlert size={size === 'sm' ? 10 : 12} strokeWidth={2.5} className="shrink-0" />
      ) : (
        <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', toneDot[tone])} />
      )}
      <span className="tabular-nums">
        Risk: {score} / {cap},
      </span>
      <span className="font-semibold">{level}</span>
    </span>
  );
}
