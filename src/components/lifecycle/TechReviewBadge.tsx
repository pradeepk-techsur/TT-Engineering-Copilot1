'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const GLOSSARY: Record<string, string> = {
  'Kickoff':        'Kickoff Review — project initiation checklist review at Phase 0. Covers planning, resources, milestones, and documentation.',
  'SLR':            'System Level Review — architecture, requirements completeness, power, thermal, and interface review at Phase 1.',
  'Schematic/PDR':  'Schematic Review / Preliminary Design Review — circuit topology, component selection, and early DFM/DFA review at Phase 3.',
  'PCB Layout/CDR': 'PCB Layout Review / Critical Design Review — final layout DRC, clearance, trace widths, DFM audit, and design freeze at Phase 4.',
};

export function TechReviewBadge({ review }: { review: string }) {
  const tooltip = GLOSSARY[review];

  const badge = (
    <Badge className="text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border border-[var(--color-text-muted)]/20 cursor-help">
      {review}
    </Badge>
  );

  if (!tooltip) return badge;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[280px]">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
