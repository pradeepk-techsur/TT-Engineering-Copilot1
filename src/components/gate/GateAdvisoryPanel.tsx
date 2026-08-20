'use client';

import Link from 'next/link';
import {
  Sparkles, Info, CheckCircle2, AlertTriangle, ListOrdered, ArrowUpRight, ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { Skeleton } from '@/components/ui/skeleton';
import { KeyRiskDetail } from './KeyRiskDetail';
import { riskLevelStyle } from '@/lib/riskDisplay';
import { cn } from '@/lib/utils';
import type { GateAdvisoryResponse } from '@/shared/types/risk';

const NO_STRENGTHS = 'No evidence-supported Key Strengths identified.';

/**
 * The reasoning behind the advisory, in the order a reviewer reads it: why the
 * score is what it is, why the recommendation is what it is, what is strong,
 * what is not, and what to do next.
 *
 * The recommended outcome and the score themselves are NOT repeated here — the
 * header strip states both, and the decision control restates the outcome
 * where it is acted on. This panel is the argument, not the verdict.
 *
 * Each section is capped at three items and every item links to the record it
 * came from. Nothing here is a decision — the decision control is elsewhere on
 * the screen, and it belongs to a human.
 */
export function GateAdvisoryPanel({
  data,
}: {
  data: GateAdvisoryResponse | undefined;
}) {
  if (!data) {
    return (
      <Card data-testid="gate-advisory-panel-loading">
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  const { advisory, riskScore } = data;

  return (
    // This panel must never be mistaken for a recorded decision. That used to
    // be done with an accent wash over the whole (very tall) card, which turned
    // the interaction colour into a background field and tinted every pill
    // sitting on it. A left accent rule says the same thing in 3px.
    <Card
      className="border-l-[3px] border-l-accent-solid"
      data-testid="gate-advisory-panel"
    >
      <CardContent className="space-y-4">
        {/* AI RECOMMENDATION — the recommended outcome itself is the first
            fact in the header strip above and sits again beside the decision
            control on the right, so what belongs here is the caveat that
            governs everything below it. */}
        <section>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <SectionLabel icon={Sparkles} accent>
              AI recommendation
            </SectionLabel>
            {!advisory.recommendationAvailable && (
              <StatusPill tone="neutral" dot data-testid="advisory-locked">
                No recommendation — gate locked
              </StatusPill>
            )}
            {/* Never suppressible. Quiet, because it is a standing caveat on
                everything below it rather than a state that just changed. */}
            <StatusPill tone="neutral" size="sm" className="gap-1.5" data-testid="advisory-label">
              <Info size={10} strokeWidth={2.5} />
              {advisory.advisoryLabel}
            </StatusPill>
          </div>
          {advisory.ruleOverrideApplied && (
            <p
              className="mt-1.5 flex items-start gap-1.5 text-[11px] leading-relaxed text-warn"
              data-testid="advisory-rule-override"
            >
              <ShieldCheck size={11} strokeWidth={2.5} className="mt-px shrink-0" />
              The model proposed an outcome the configured gate rules do not
              permit. It has been replaced by the rule outcome
              ({advisory.ruleOutcome}).
            </p>
          )}
        </section>

        {/* RISK — the score itself is the second fact in the header strip
            above; what this section adds is why it is that number. */}
        {riskScore.explanation && (
          <section className="border-t border-line pt-3">
            <SectionLabel>Risk</SectionLabel>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-fg-muted">
              {riskScore.explanation}
            </p>
          </section>
        )}

        {/* WHY */}
        <section className="border-t border-line pt-3">
          <SectionLabel>Why this recommendation</SectionLabel>
          <p
            className="mt-1.5 text-[12.5px] leading-relaxed text-fg-2"
            data-testid="advisory-rationale"
          >
            {advisory.rationale}
          </p>
        </section>

        {/* KEY STRENGTHS */}
        <section className="border-t border-line pt-3">
          <SectionLabel icon={CheckCircle2} tone="pass">
            Key strengths
          </SectionLabel>
          {advisory.keyStrengths.length === 0 ? (
            <p
              className="mt-1.5 text-[12.5px] text-fg-muted italic"
              data-testid="advisory-no-strengths"
            >
              {NO_STRENGTHS}
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1.5" data-testid="advisory-key-strengths">
              {advisory.keyStrengths.map((strength, i) => (
                <li key={`${strength.evidence.id}-${i}`} data-testid="advisory-strength-item">
                  <EvidenceRow
                    statement={strength.statement}
                    tone="pass"
                    evidenceLabel={strength.evidence.label}
                    detail={strength.evidence.detail}
                    href={strength.evidence.href}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* KEY RISKS */}
        <section className="border-t border-line pt-3">
          <SectionLabel icon={AlertTriangle} tone="warn">
            Key risks
          </SectionLabel>
          {advisory.keyRisks.length === 0 ? (
            <p className="mt-1.5 text-[12.5px] text-fg-muted italic">
              No unresolved risks bear on this gate.
            </p>
          ) : (
            <ul className="mt-1.5 space-y-1.5" data-testid="advisory-key-risks">
              {advisory.keyRisks.map((risk, i) => (
                <li key={`${risk.detail.findingId ?? i}`} data-testid="advisory-risk-item">
                  <KeyRiskDetail
                    risk={risk}
                    index={i}
                    trigger={
                      <button
                        type="button"
                        className={cn(
                          'group w-full cursor-pointer rounded-lg border border-line bg-surface/70 px-2.5 py-2 text-left',
                          'transition-colors hover:border-line-strong hover:bg-hover',
                          'focus-visible:ring-2 focus-visible:ring-accent-solid focus-visible:outline-none'
                        )}
                      >
                        <span className="block text-[12.5px] leading-snug font-medium text-fg">
                          {risk.statement}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-1.5">
                          <StatusPillFor status={riskLevelStyle[risk.level]} size="sm" />
                          <StatusPill
                            tone={risk.blocking ? 'fail' : 'neutral'}
                            size="sm"
                            dot={false}
                          >
                            {risk.blocking ? 'Blocking' : 'Non-blocking'}
                          </StatusPill>
                          {risk.detail.findingId && (
                            <span className="font-mono text-[10.5px] text-fg-muted">
                              {risk.detail.findingId}
                            </span>
                          )}
                          <span className="ml-auto text-[10.5px] text-accent-solid opacity-0 transition-opacity group-hover:opacity-100">
                            View details
                          </span>
                        </span>
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* NEXT STEPS */}
        <section className="border-t border-line pt-3">
          <SectionLabel icon={ListOrdered}>Next steps</SectionLabel>
          {advisory.nextSteps.length === 0 ? (
            <p className="mt-1.5 text-[12.5px] text-fg-muted italic">
              No outstanding next steps are supported by the current evidence.
            </p>
          ) : (
            <ol className="mt-1.5 space-y-1.5" data-testid="advisory-next-steps">
              {advisory.nextSteps.map((step, i) => (
                <li
                  key={`${step.source.id}-${i}`}
                  className="flex gap-2"
                  data-testid="advisory-next-step-item"
                >
                  <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded bg-raised text-[10px] font-semibold text-fg-muted tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <EvidenceRow
                      statement={step.statement}
                      evidenceLabel={step.source.label}
                      detail={step.source.detail}
                      href={step.source.href}
                      kind={step.sourceKind}
                      bare
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Provenance — how the prose was produced. */}
        <p
          className="border-t border-line pt-3 text-[10.5px] leading-relaxed text-fg-muted"
          data-testid="advisory-provenance"
        >
          The Overall Risk Score is calculated by the application from configured
          structured rules — never by the model.{' '}
          {advisory.generatedBy === 'LLM'
            ? 'The recommendation and summaries are model-written and checked against the configured gate rules and the recorded evidence.'
            : 'No LLM key is configured, so the recommendation and summaries were composed from the recorded findings, actions, checks and outputs.'}
        </p>
      </CardContent>
    </Card>
  );
}

function SectionLabel({
  children,
  icon: Icon,
  tone,
  accent,
}: {
  children: React.ReactNode;
  icon?: typeof Sparkles;
  tone?: 'pass' | 'warn';
  accent?: boolean;
}) {
  return (
    <h3 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
      {Icon && (
        <Icon
          size={11}
          strokeWidth={2.5}
          className={cn(
            'shrink-0',
            accent ? 'text-accent-solid'
              : tone === 'pass' ? 'text-pass'
              : tone === 'warn' ? 'text-warn'
              : 'text-fg-faint'
          )}
        />
      )}
      {children}
    </h3>
  );
}

/** A statement with the record that backs it, linked rather than inlined. */
function EvidenceRow({
  statement,
  evidenceLabel,
  detail,
  href,
  tone,
  kind,
  bare,
}: {
  statement: string;
  evidenceLabel: string;
  detail?: string;
  href?: string;
  tone?: 'pass';
  kind?: string;
  bare?: boolean;
}) {
  const inner = (
    <>
      <span
        className={cn(
          'block text-[12.5px] leading-snug',
          tone === 'pass' ? 'font-medium text-fg' : 'font-medium text-fg'
        )}
      >
        {statement}
      </span>
      <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] text-fg-muted">
        {kind && <span className="shrink-0 rounded bg-raised px-1 py-px">{kind}</span>}
        <span className="truncate">{evidenceLabel}</span>
        {detail && <span className="shrink-0 truncate">· {detail}</span>}
        {href && (
          <ArrowUpRight
            size={10}
            strokeWidth={2.5}
            className="shrink-0 text-accent-solid opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </>
  );

  if (!href) {
    return <div className={bare ? '' : 'rounded-lg border border-line bg-surface/70 px-2.5 py-2'}>{inner}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        'group block rounded-lg transition-colors',
        bare ? 'hover:bg-hover' : 'border border-line bg-surface/70 px-2.5 py-2 hover:border-line-strong hover:bg-hover'
      )}
    >
      {inner}
    </Link>
  );
}
