import { cn } from '@/lib/utils';
import { toneClass, toneDot, type StatusStyle, type Tone } from '@/lib/status';

interface StatusPillProps extends React.ComponentProps<'span'> {
  tone?: Tone;
  /** Show a leading dot. Helps colour-blind users read state by position. */
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
  dot = false,
  pulse = false,
  size = 'md',
  className,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
        size === 'sm' ? 'h-[18px] px-1.5 text-[10.5px]' : 'h-[22px] px-2.5 text-[11.5px]',
        toneClass[tone],
        className
      )}
      {...props}
    >
      {dot && (
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
  size = 'md',
  className,
}: {
  status: StatusStyle;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <StatusPill
      tone={status.tone}
      dot={dot}
      pulse={status.pulse}
      size={size}
      className={className}
    >
      {status.label}
    </StatusPill>
  );
}
