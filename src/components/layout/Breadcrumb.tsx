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
    <TooltipProvider delay={150}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[12px] text-fg-muted">
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} strokeWidth={2} className="shrink-0 text-fg-faint" />}
            {s.tip ? (
              <Tooltip>
                {/* Base UI composes with `render`, not `asChild`. */}
                <TooltipTrigger
                  render={
                    <span
                      tabIndex={0}
                      role="note"
                      className="cursor-help decoration-line-strong decoration-dotted underline-offset-[3px] transition-colors hover:text-fg underline"
                    >
                      {s.label}
                    </span>
                  }
                />
                <TooltipContent side="bottom">{s.tip}</TooltipContent>
              </Tooltip>
            ) : s.href ? (
              <Link
                href={s.href}
                className="rounded transition-colors hover:text-fg"
              >
                {s.label}
              </Link>
            ) : (
              <span className="text-fg-2">{s.label}</span>
            )}
          </span>
        ))}
      </nav>
    </TooltipProvider>
  );
}
