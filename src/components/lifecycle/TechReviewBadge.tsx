'use client';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const GLOSSARY: Record<string, string> = {
  'Kickoff':        'Kickoff Review — project initiation checklist at Phase 0',
  'SLR':            'System Level Review — architecture and requirements completeness at Phase 1',
  'Schematic/PDR':  'Schematic Review / Preliminary Design Review — circuit and DFM/DFA review at Phase 3',
  'PCB Layout/CDR': 'PCB Layout Review / Critical Design Review — final layout DRC, clearance audit, design freeze at Phase 4',
};

export function TechReviewBadge({ review, className }: { review: string; className?: string }) {
  const tip = GLOSSARY[review];

  const badgeClass = cn(
    'inline-flex h-[22px] w-fit shrink-0 items-center rounded-full border border-line bg-raised px-2.5',
    'text-[11.5px] font-medium whitespace-nowrap text-fg-2',
    tip && 'cursor-help transition-colors hover:border-line-strong hover:text-fg',
    className
  );

  if (!tip) return <span className={badgeClass}>{review}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        {/* Base UI composes with `render`, not `asChild` — `asChild` here
            produced a <span> inside a <button> and broke hydration. */}
        <TooltipTrigger
          render={<span tabIndex={0} role="note" className={badgeClass}>{review}</span>}
        />
        <TooltipContent side="top">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
