import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /** Say what the user can do about it, not just that there's nothing here. */
  description?: string;
  action?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * Empty lists used to render as a bare muted sentence, which reads as a bug.
 * An empty state should explain the state and offer the next step.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        size === 'sm' ? 'gap-2 px-5 py-8' : 'gap-3 px-6 py-14',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex items-center justify-center rounded-xl border border-line bg-raised text-fg-faint',
            size === 'sm' ? 'size-8' : 'size-11'
          )}
        >
          <Icon size={size === 'sm' ? 15 : 19} strokeWidth={2} />
        </div>
      )}
      <div className="space-y-1">
        <p
          className={cn(
            'font-medium text-fg',
            size === 'sm' ? 'text-[12.5px]' : 'text-[13.5px]'
          )}
        >
          {title}
        </p>
        {description && (
          <p className="mx-auto max-w-sm text-[12.5px] leading-relaxed text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
