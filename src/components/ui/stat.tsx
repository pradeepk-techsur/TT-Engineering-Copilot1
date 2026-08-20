import { cn } from '@/lib/utils';
import { toneText, type Tone } from '@/lib/status';

/**
 * Single number with a label. Used for the at-a-glance counts on the
 * overview — the screen previously made you read a 10-row table to work out
 * how the programme was tracking.
 */
export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="text-[10.5px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 text-[22px] leading-none font-semibold tracking-[-0.02em] tabular-nums',
          tone === 'neutral' ? 'text-fg' : toneText[tone]
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 truncate text-[11.5px] text-fg-muted">{hint}</p>}
    </div>
  );
}
