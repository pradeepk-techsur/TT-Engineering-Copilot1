import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Rendered on the right — primary action for the screen. */
  actions?: React.ReactNode;
  /** Rendered under the subtitle — status pills, counts, meta. */
  meta?: React.ReactNode;
  className?: string;
}

/**
 * Every page opens the same way. Before this, titles ranged from
 * `text-2xl font-bold` to `text-lg font-semibold` with subtitles sometimes
 * above and sometimes below, and actions were hand-rolled anchor tags
 * carrying 12 copied utility classes.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  meta,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-5',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[19px] leading-tight font-semibold tracking-[-0.02em] text-fg">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-fg-muted">
            {subtitle}
          </p>
        )}
        {meta && <div className="mt-2.5 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  );
}

/** Small uppercase label that opens a group of cards within a page. */
export function SectionLabel({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={cn('mb-2.5 flex items-center justify-between gap-3', className)}>
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}
