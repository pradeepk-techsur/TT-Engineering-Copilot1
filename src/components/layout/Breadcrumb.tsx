'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PHASE_CONFIG_MAP, TECHNICAL_REVIEW_PHASES } from '@/shared/constants/phaseConfig';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Full expansion for technical review acronyms
const TECH_REVIEW_GLOSSARY: Record<string, string> = {
  'Kickoff':        'Kickoff Review — project initiation checklist review at Phase 0',
  'SLR':            'System Level Review — architecture and requirements completeness check at Phase 1',
  'Schematic/PDR':  'Schematic Review / Preliminary Design Review — circuit and architecture review at Phase 3',
  'PCB Layout/CDR': 'PCB Layout Review / Critical Design Review — final layout audit and design freeze at Phase 4',
};

interface BreadcrumbProps {
  phaseId?: number;
  gateId?: number;
}

export function Breadcrumb({ phaseId, gateId }: BreadcrumbProps) {
  // No EV-INV-800 prefix — product identity is in the top bar and stepper
  const segments: { label: string; href?: string; tooltip?: string }[] = [];

  if (phaseId !== undefined) {
    const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
    const phaseName = config?.phaseName ?? `Phase ${phaseId}`;

    segments.push({
      label: `Phase ${phaseId}: ${phaseName}`,
      href: `/phase/${phaseId}`,
    });

    // Technical review segment — ONLY for phases 0, 1, 3, 4
    if (TECHNICAL_REVIEW_PHASES.has(phaseId) && config) {
      const review = (config as any).technicalReview as string | undefined;
      if (review) {
        segments.push({
          label: review,
          tooltip: TECH_REVIEW_GLOSSARY[review],
        });
      }
    }

    if (gateId !== undefined) {
      segments.push({
        label: `Gate ${gateId}`,
        href: `/gate/${gateId}/review`,
      });
    }
  }

  if (!segments.length) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-[var(--color-border)]" />}

            {seg.tooltip ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help border-b border-dashed border-[var(--color-text-muted)]/40 text-[var(--color-text-muted)]">
                    {seg.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[260px]">
                  {seg.tooltip}
                </TooltipContent>
              </Tooltip>
            ) : seg.href ? (
              <Link
                href={seg.href}
                className="hover:text-[var(--color-text-primary)] transition-colors"
              >
                {seg.label}
              </Link>
            ) : (
              <span>{seg.label}</span>
            )}
          </span>
        ))}
      </nav>
    </TooltipProvider>
  );
}
