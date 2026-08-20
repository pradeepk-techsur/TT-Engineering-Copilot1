'use client';

import Link from 'next/link';
import {
  ClipboardList, ListChecks, ScanSearch, FileWarning, ArrowUpRight, Calculator,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { RiskScoreChip } from './RiskScoreChip';
import { StatusPill } from '@/components/ui/status-pill';
import { cn } from '@/lib/utils';
import {
  RISK_DRILLDOWN_LABELS, RISK_DRILLDOWN_ORDER, RISK_CATEGORY_LABELS,
  type RiskDrillDownKey,
} from '@/lib/riskDisplay';
import type { RiskScore, RiskRef } from '@/shared/types/risk';

const SECTION_ICON: Record<RiskDrillDownKey, typeof ClipboardList> = {
  contributingFindings: ClipboardList,
  openActions: ListChecks,
  failedChecks: ScanSearch,
  missingEvidence: FileWarning,
};

/**
 * What sits behind the risk score.
 *
 * The primary screens show only "Risk: 68 / 100, High". Selecting it opens this:
 * the main contributing findings, open actions, failed checks and missing
 * evidence, each linking out to the real record. The weighting breakdown is
 * last and collapsed — auditable, but never in the way.
 */
export function RiskScoreDetail({
  risk,
  title,
  trigger,
}: {
  risk: RiskScore;
  title: string;
  trigger: React.ReactNode;
}) {
  const cap = risk.configSnapshot?.cap ?? 100;
  const sections = RISK_DRILLDOWN_ORDER.map(key => ({
    key,
    label: RISK_DRILLDOWN_LABELS[key],
    icon: SECTION_ICON[key],
    items: risk.drillDown?.[key] ?? [],
  }));
  const total = sections.reduce((n, s) => n + s.items.length, 0);

  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        data-testid="risk-score-detail"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            What contributes to this score. The score is calculated by the
            application from structured rules — it is advisory and never approves
            or rejects a gate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <RiskScoreChip
            score={risk.score}
            level={risk.level}
            cap={cap}
            assessed={risk.assessed}
            showIcon
          />
          {risk.capped && (
            <StatusPill tone="neutral" size="sm">
              Raw total {risk.rawScore}, capped at {cap}
            </StatusPill>
          )}
        </div>

        {risk.explanation && (
          <p className="text-[12.5px] leading-relaxed text-fg-2">{risk.explanation}</p>
        )}

        {total === 0 ? (
          <p className="rounded-lg border border-line bg-raised/50 px-3 py-2.5 text-[12.5px] text-fg-muted">
            {risk.assessed
              ? 'Nothing is contributing to this score — no unresolved findings, open actions, failed checks or missing evidence bear on this gate.'
              : 'This phase has not started, so there is nothing to score yet.'}
          </p>
        ) : (
          <div className="space-y-3">
            {sections.map(({ key, label, icon: Icon, items }) => (
              <section key={key} data-testid={`risk-section-${key}`}>
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] text-fg-muted uppercase">
                  <Icon size={12} strokeWidth={2} className="shrink-0" />
                  {label}
                  <span className="rounded-full bg-raised px-1.5 py-px text-[10px] tabular-nums">
                    {items.length}
                  </span>
                </h4>
                {items.length === 0 ? (
                  <p className="mt-1 text-[12px] text-fg-faint">None.</p>
                ) : (
                  <ul className="mt-1.5 space-y-1.5">
                    {items.map(item => (
                      <RefRow key={`${key}-${item.id}`} item={item} />
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}

        {/* Weighting last, and folded away: auditable without cluttering. */}
        {risk.contributions?.length > 0 && (
          <details className="rounded-lg border border-line bg-raised/40 px-3 py-2">
            <summary className="flex cursor-pointer items-center gap-1.5 text-[11.5px] font-medium text-fg-muted">
              <Calculator size={12} strokeWidth={2} />
              How this score is calculated
            </summary>
            <table className="mt-2 w-full text-[11.5px]">
              <thead>
                <tr className="text-left text-fg-muted">
                  <th className="pb-1 font-medium">Rule</th>
                  <th className="pb-1 text-right font-medium">Weight</th>
                  <th className="pb-1 text-right font-medium">Count</th>
                  <th className="pb-1 text-right font-medium">Points</th>
                </tr>
              </thead>
              <tbody className="text-fg-2">
                {risk.contributions.map(c => (
                  <tr key={`${c.category}-${c.label}`} className="border-t border-line">
                    <td className="py-1">
                      {RISK_CATEGORY_LABELS[c.category] ?? c.label}
                      {c.category === 'UnresolvedFinding' && (
                        <span className="text-fg-muted"> — {c.label.split(' ')[0]}</span>
                      )}
                    </td>
                    <td className="py-1 text-right tabular-nums">+{c.weight}</td>
                    <td className="py-1 text-right tabular-nums">×{c.count}</td>
                    <td className="py-1 text-right tabular-nums">{c.points}</td>
                  </tr>
                ))}
                <tr className="border-t border-line-strong font-semibold text-fg">
                  <td className="py-1" colSpan={3}>
                    Overall Risk Score{risk.capped ? ` (capped from ${risk.rawScore})` : ''}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {risk.score} / {cap}
                  </td>
                </tr>
              </tbody>
            </table>
            <p className="mt-2 text-[11px] leading-relaxed text-fg-muted">
              Bands: {risk.configSnapshot?.thresholds
                ?.map(t => `${t.level} ${t.min}–${t.max}`)
                .join(' · ')}
            </p>
          </details>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RefRow({ item }: { item: RiskRef }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[12.5px] leading-snug font-medium text-fg">{item.label}</span>
        {typeof item.points === 'number' && (
          <span className="shrink-0 rounded bg-raised px-1.5 py-px text-[10.5px] font-semibold text-fg-muted tabular-nums">
            +{item.points}
          </span>
        )}
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <span className="font-mono text-[10.5px] text-fg-muted">{item.id}</span>
        {item.detail && (
          <span className="truncate text-[11px] text-fg-muted">· {item.detail}</span>
        )}
      </div>
    </>
  );

  return (
    <li>
      {item.href ? (
        <Link
          href={item.href}
          className={cn(
            'group block rounded-lg border border-line bg-raised/40 px-2.5 py-2',
            'transition-colors hover:border-line-strong hover:bg-hover'
          )}
        >
          {body}
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-accent-solid opacity-0 transition-opacity group-hover:opacity-100">
            Open full record
            <ArrowUpRight size={10} strokeWidth={2.5} />
          </span>
        </Link>
      ) : (
        <div className="rounded-lg border border-line bg-raised/40 px-2.5 py-2">{body}</div>
      )}
    </li>
  );
}
