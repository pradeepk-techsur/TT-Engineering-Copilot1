'use client';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { PHASE_CONFIG_MAP, TECHNICAL_REVIEW_PHASES } from '@/shared/constants/phaseConfig';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  phaseId?: number;
  gateId?: number;
}

export function Breadcrumb({ phaseId, gateId }: BreadcrumbProps) {
  const segments: { label: string; href?: string }[] = [
    { label: 'EV-INV-800', href: '/' },
  ];

  if (phaseId !== undefined) {
    const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
    const phaseName = config?.phaseName ?? `Phase ${phaseId}`;
    segments.push({
      label: `Phase ${phaseId}: ${phaseName}`,
      href: `/phase/${phaseId}`,
    });

    // Technical review segment — ONLY for phases 0, 1, 3, 4
    if (TECHNICAL_REVIEW_PHASES.has(phaseId) && config) {
      const review = (config as any).technicalReview;
      if (review) {
        segments.push({ label: review });
      }
    }
    // No technical review segment for phases 2, 5, 6, 7, 8, 9

    if (gateId !== undefined) {
      segments.push({
        label: `Gate ${gateId}: ${phaseName}`,
        href: `/gate/${gateId}/review`,
      });
    }
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm">
      {segments.map((seg, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-[var(--color-text-muted)]" />}
          {seg.href ? (
            <Link
              href={seg.href}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              {seg.label}
            </Link>
          ) : (
            <span className="text-[var(--color-text-primary)]">{seg.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
