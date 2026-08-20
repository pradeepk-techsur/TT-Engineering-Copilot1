'use client';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const GLOSSARY: Record<string, string> = {
  'Kickoff':        'Kickoff Review — project initiation checklist at Phase 0',
  'SLR':            'System Level Review — architecture and requirements completeness at Phase 1',
  'Schematic/PDR':  'Schematic Review / Preliminary Design Review — circuit and DFM/DFA review at Phase 3',
  'PCB Layout/CDR': 'PCB Layout Review / Critical Design Review — final layout DRC, clearance audit, design freeze at Phase 4',
};

export function TechReviewBadge({ review }: { review: string }) {
  const tip = GLOSSARY[review];
  const badge = (
    <Badge className="text-xs bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)] border border-[var(--color-text-muted)]/20 cursor-help">
      {review}
    </Badge>
  );
  if (!tip) return badge;
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[280px]">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
