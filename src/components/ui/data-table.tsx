import { cn } from '@/lib/utils';

/**
 * The app's tables were hand-rolled in five places with five different
 * paddings, header treatments and hover colours. These are the shared
 * metrics: uppercase micro-label header on a raised strip, 13px body,
 * hairline row rules, whole-row hover.
 *
 * Wrap in a <Card padding-free> or a bordered div; the table draws no
 * outer border of its own.
 */

export function DataTable({
  className,
  minWidth,
  ...props
}: React.ComponentProps<'table'> & { minWidth?: number }) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-left', className)}
        style={minWidth ? { minWidth } : undefined}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: React.ComponentProps<'thead'>) {
  return (
    <thead
      className={cn('border-b border-line bg-raised', className)}
      {...props}
    />
  );
}

export function TH({
  className,
  align = 'left',
  ...props
}: React.ComponentProps<'th'> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <th
      scope="col"
      className={cn(
        'px-4 py-2.5 text-[10.5px] font-semibold tracking-[0.07em] whitespace-nowrap text-fg-muted uppercase',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('', className)} {...props} />;
}

export function TR({
  className,
  interactive,
  ...props
}: React.ComponentProps<'tr'> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        'border-b border-line last:border-0',
        interactive && 'transition-colors hover:bg-hover',
        className
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  align = 'left',
  ...props
}: React.ComponentProps<'td'> & { align?: 'left' | 'right' | 'center' }) {
  return (
    <td
      className={cn(
        'px-4 py-2.5 align-middle text-[13px] text-fg-2',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      {...props}
    />
  );
}

/** Full-width cell for empty / loading states inside a table body. */
export function TEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4">
        {children}
      </td>
    </tr>
  );
}
