import { cn } from '@/lib/utils';

/**
 * Truncated text that stays readable on hover.
 *
 * Tables across the app clipped real data to "Customer Opportunity Pac…" and
 * "mock-art…" with no way to see the rest. Anything truncated must carry its
 * full value, so the data is never actually lost.
 */
export function Truncate({
  children,
  className,
  as: Tag = 'span',
  title,
}: {
  children: string | null | undefined;
  className?: string;
  as?: 'span' | 'div' | 'p';
  title?: string;
}) {
  const text = children ?? '—';
  return (
    <Tag className={cn('block truncate', className)} title={title ?? text}>
      {text}
    </Tag>
  );
}

/** Monospace identifier (ids, artifact refs, paths) with full value on hover. */
export function MonoId({
  children,
  className,
}: {
  children: string | null | undefined;
  className?: string;
}) {
  const text = children ?? '—';
  return (
    <span
      className={cn('block truncate font-mono text-[11.5px] text-fg-2', className)}
      title={text}
    >
      {text}
    </span>
  );
}
