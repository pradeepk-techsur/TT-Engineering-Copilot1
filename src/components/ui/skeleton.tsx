import { cn } from '@/lib/utils';

/**
 * Loading placeholder. Preferred over a spinner or a "Loading…" string
 * because it holds the layout, so content doesn't jump in when data lands.
 */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-shimmer rounded-md bg-raised', className)}
      {...props}
    />
  );
}

/** N lines of fake text, last line short — reads as a paragraph. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={{ width: i === lines - 1 ? '55%' : '100%' }}
        />
      ))}
    </div>
  );
}

/** Placeholder rows that match the app's table metrics. */
export function SkeletonRows({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('divide-y divide-line', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-3 w-14 shrink-0" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-[18px] w-20 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
