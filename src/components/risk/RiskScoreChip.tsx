import { ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toneClass, toneDot } from '@/lib/status';
import { riskLevelTone } from '@/lib/riskDisplay';
import type { RiskLevel } from '@/shared/types/risk';

/**
 * The compact risk display. Number and level word together, in one pill —
 * "Risk: 68 / 100, High". Never colour alone: the level is always spelled out,
 * and the dot is decorative.
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
          toneClass.neutral,
          className
        )}
      >
        Risk: not assessed
      </span>
    );
  }

  const tone = riskLevelTone[level];

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-[22px] px-2.5 text-[11.5px]',
        toneClass[tone],
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
