'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Explains an acronym or a term in place. This app is dense with jargon —
 * UP, SI, PDR, CDR, MRL, PPAP, DFM/DFA — and none of it was explained
 * outside a couple of one-off tooltips.
 */
export function Hint({
  label,
  children,
  side = 'top',
  className,
}: {
  /** The visible term. */
  label: React.ReactNode;
  /** The explanation. */
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <span
              tabIndex={0}
              role="note"
              className={cn(
                'cursor-help decoration-line-strong decoration-dotted underline-offset-[3px] hover:decoration-fg-muted underline',
                className
              )}
            >
              {label}
            </span>
          }
        />
        <TooltipContent side={side}>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Standalone ⓘ affordance, for when there's no word to underline. */
export function InfoHint({
  children,
  side = 'top',
  className,
}: {
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              aria-label="More information"
              className={cn(
                'inline-flex size-4 shrink-0 items-center justify-center rounded-full text-fg-faint transition-colors hover:text-fg-muted',
                className
              )}
            >
              <Info size={13} strokeWidth={2} />
            </button>
          }
        />
        <TooltipContent side={side}>{children}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
