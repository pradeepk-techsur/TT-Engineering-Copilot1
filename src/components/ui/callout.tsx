import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toneClass, toneText, type Tone } from '@/lib/status';

/**
 * Inline notice. Used for the "this needs you" prompt on the overview, the
 * simulated-connector disclosure on intake cards, and blocking-action
 * warnings at a gate.
 */
export function Callout({
  tone = 'info',
  icon: Icon,
  title,
  children,
  action,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  tone?: Tone;
  icon?: LucideIcon;
  title?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3',
        toneClass[tone],
        className
      )}
      {...props}
    >
      {Icon && (
        <Icon
          size={15}
          strokeWidth={2}
          className={cn('mt-px shrink-0', toneText[tone])}
        />
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <p className="text-[13px] leading-snug font-semibold text-fg">{title}</p>
        )}
        {children && (
          <div
            className={cn(
              'text-[12.5px] leading-relaxed text-fg-2',
              title && 'mt-1'
            )}
          >
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}
