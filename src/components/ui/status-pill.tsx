import { cn } from '@/lib/utils';
import {
  defaultEmphasis, toneClass, toneClassQuiet, toneDot,
  type Emphasis, type StatusStyle, type Tone,
} from '@/lib/status';

interface StatusPillProps extends React.ComponentProps<'span'> {
  tone?: Tone;
  /**
   * How loudly to render. Defaults per tone (see `defaultEmphasis`): warn and
   * fail are tinted, everything else is a neutral chip with a coloured dot.
   * Pass explicitly to break the tie when two pills of the same tone sit side
   * by side and only one of them is the point.
   */
  emphasis?: Emphasis;
  /**
   * Show a leading dot. Helps colour-blind users read state by position, and
   * carries the tone on a quiet pill — so a quiet pill turns it on itself
   * unless asked not to.
   */
  dot?: boolean;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

/**
 * The only way status should be rendered. Tone comes from lib/status —
 * components pass a StatusStyle rather than choosing colours themselves.
 */
export function StatusPill({
  tone = 'neutral',
  emphasis,
  dot,
  pulse = false,
  size = 'md',
  className,
  children,
  ...props
}: StatusPillProps) {
  const level = emphasis ?? defaultEmphasis[tone];
  const quiet = level === 'quiet';
  // On a quiet pill the dot is the only thing carrying the tone, so it is on
  // by default. `dot={false}` still wins — some chips are pure labels.
  const showDot = dot ?? (quiet && tone !== 'neutral');

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-[22px] px-2.5 text-[11.5px]',
        quiet ? toneClassQuiet[tone] : toneClass[tone],
        className
      )}
      {...props}
    >
      {showDot && (
        <span className="relative flex size-1.5 shrink-0">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex size-full animate-ping rounded-full opacity-70',
                toneDot[tone]
              )}
            />
          )}
          <span className={cn('relative inline-flex size-1.5 rounded-full', toneDot[tone])} />
        </span>
      )}
      {children}
    </span>
  );
}

/** Convenience wrapper for the common `styleFor(map, value)` shape. */
export function StatusPillFor({
  status,
  dot = true,
  emphasis,
  size = 'md',
  className,
}: {
  status: StatusStyle;
  dot?: boolean;
  emphasis?: Emphasis;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <StatusPill
      tone={status.tone}
      emphasis={emphasis}
      dot={dot}
      pulse={status.pulse}
      size={size}
      className={className}
    >
      {status.label}
    </StatusPill>
  );
}
