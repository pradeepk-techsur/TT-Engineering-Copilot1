'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { riskLevelStyle } from '@/lib/riskDisplay';
import type { KeyRisk } from '@/shared/types/risk';

/**
 * A Key Risk, opened.
 *
 * The panel shows one line per risk. Selecting it shows the whole thing: the
 * full finding, what evidence supports it, which requirement or rule applies,
 * the recommended action, who owns it, and the phase or gate it is due at.
 */
export function KeyRiskDetail({
  risk,
  index,
  trigger,
}: {
  risk: KeyRisk;
  index: number;
  trigger: React.ReactNode;
}) {
  const level = riskLevelStyle[risk.level];
  const d = risk.detail;

  return (
    <Dialog>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-lg"
        data-testid={`key-risk-detail-${index}`}
      >
        <DialogHeader>
          <DialogTitle>{d.findingId ? `${d.findingId} — key risk` : 'Key risk'}</DialogTitle>
          <DialogDescription>{risk.statement}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <StatusPillFor status={level} size="sm" />
          <StatusPill tone={risk.blocking ? 'fail' : 'neutral'} size="sm" dot>
            {risk.blocking ? 'Blocking' : 'Non-blocking'}
          </StatusPill>
        </div>

        <dl className="space-y-2.5">
          <Row term="Full finding" value={d.fullFinding} />
          <Row term="Supporting evidence" value={d.supportingEvidence} />
          <Row term="Applicable requirement or rule" value={d.applicableRule} />
          <Row term="Recommended action" value={d.recommendedAction} />
          <Row term="Owner role" value={d.ownerRole} />
          <Row
            term="Due phase or gate"
            value={
              typeof d.dueGate === 'number'
                ? `Phase ${d.duePhase ?? d.dueGate} · Gate ${d.dueGate}`
                : undefined
            }
          />
          <Row term="Tracked as" value={d.actionId} mono />
        </dl>

        {d.href && (
          <Link
            href={d.href}
            className="inline-flex w-fit items-center gap-1 rounded-md text-[12px] font-medium text-accent-solid hover:underline"
          >
            Open the full record
            <ArrowUpRight size={11} strokeWidth={2.5} />
          </Link>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({
  term,
  value,
  mono,
}: {
  term: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
        {term}
      </dt>
      <dd
        className={
          mono
            ? 'mt-0.5 font-mono text-[12px] text-fg-2'
            : 'mt-0.5 text-[12.5px] leading-relaxed text-fg-2'
        }
      >
        {value}
      </dd>
    </div>
  );
}
