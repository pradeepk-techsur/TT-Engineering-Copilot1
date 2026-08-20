'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PHASE_CONFIG_MAP, TECHNICAL_REVIEW_PHASES } from '@/shared/constants/phaseConfig';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const GLOSSARY: Record<string, string> = {
  'Kickoff':        'Kickoff Review — project initiation checklist at Phase 0',
  'SLR':            'System Level Review — architecture and requirements completeness at Phase 1',
  'Schematic/PDR':  'Schematic Review / Preliminary Design Review — circuit and DFM/DFA review at Phase 3',
  'PCB Layout/CDR': 'PCB Layout Review / Critical Design Review — final layout DRC, clearance audit, design freeze at Phase 4',
};

export function Breadcrumb({ phaseId, gateId }: { phaseId?: number; gateId?: number }) {
  // Breadcrumb starts with phase — NOT product name (product is in top bar + stepper)
  const segments: { label: string; href?: string; tip?: string }[] = [];

  if (phaseId !== undefined) {
    const cfg = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
    const name = cfg?.phaseName ?? `Phase ${phaseId}`;
    segments.push({ label: `Phase ${phaseId}: ${name}`, href: `/phase/${phaseId}` });

    if (TECHNICAL_REVIEW_PHASES.has(phaseId) && cfg) {
      const review = (cfg as any).technicalReview as string | undefined;
      if (review) segments.push({ label: review, tip: GLOSSARY[review] });
    }

    if (gateId !== undefined) {
      segments.push({ label: `Gate ${gateId}`, href: `/gate/${gateId}/review` });
    }
  }

  if (!segments.length) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-[var(--color-border)]" />}
            {s.tip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help border-b border-dashed border-[var(--color-text-muted)]/40">
                    {s.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[260px]">
                  {s.tip}
                </TooltipContent>
              </Tooltip>
            ) : s.href ? (
              <Link href={s.href} className="hover:text-[var(--color-text-primary)] transition-colors">
                {s.label}
              </Link>
            ) : (
              <span>{s.label}</span>
            )}
          </span>
        ))}
      </nav>
    </TooltipProvider>
  );
}
