import Link from 'next/link';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type Variants = VariantProps<typeof buttonVariants>;

/**
 * A link that looks like a button.
 *
 * Don't reach for `<Button render={<Link/>}>`: Base UI's Button assumes a
 * native <button> element and warns (correctly) that rendering an anchor
 * strips button semantics. A navigation control should be an <a> anyway —
 * it needs middle-click, cmd-click and "open in new tab" to work.
 */
export function ButtonLink({
  href,
  variant = 'outline',
  size = 'default',
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, 'href'> &
  Variants & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Same treatment for a plain external / download anchor. */
export function ButtonAnchor({
  variant = 'outline',
  size = 'default',
  className,
  children,
  ...props
}: React.ComponentProps<'a'> & Variants) {
  return (
    <a className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {children}
    </a>
  );
}
