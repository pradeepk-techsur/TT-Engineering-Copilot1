'use client';

import { Sparkles, ClipboardList, ShieldBan, UserCheck } from 'lucide-react';
import { RiskScoreIndicator } from '@/components/risk/RiskScoreIndicator';
import { StatusPillFor } from '@/components/ui/status-pill';
import { Skeleton } from '@/components/ui/skeleton';
import { gateOutcomeStyle, styleFor } from '@/lib/status';
import { cn } from '@/lib/utils';
import type { GateAdvisoryResponse } from '@/shared/types/risk';

/**
 * The first thing on the Gate Review screen: phase and gate, the advisory
 * recommendation, the Overall Risk Score, the two counts that matter, and a
 * plain statement that a human still has to decide.
 *
 * One strip, five facts. Everything else on the screen is detail behind it.
 */
export function GateReviewHeader({
  data,
  isLoading,
}: {
  data: GateAdvisoryResponse | undefined;
  isLoading: boolean;
}) {
  if (!data) {
    return (
      <div className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-sm">
        <Skeleton className="h-3.5 w-56" />
        <div className="mt-3 flex flex-wrap gap-4">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-8 w-32" />
          ))}
        </div>
        {isLoading && <span className="sr-only">Loading gate review summary…</span>}
      </div>
    );
  }

  const { header, riskScore, advisory } = data;
  const outcome = styleFor(gateOutcomeStyle, advisory.recommendedOutcome);

  return (
    <div
      className="rounded-xl border border-line bg-surface px-4 py-3.5 shadow-sm"
      data-testid="gate-review-header"
    >
      {/* Phase and gate */}
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h2 className="text-[15px] leading-tight font-semibold tracking-[-0.01em] text-fg">
          Gate {header.gateNumber}: {header.phaseName.replace(/^Phase \d+ — /, '')}
        </h2>
      </div>

      {/* The five header facts */}
      <dl className="mt-3 flex flex-wrap items-start gap-x-6 gap-y-3">
        <Fact icon={Sparkles} label="AI recommendation" accent>
          <div className="flex items-center gap-2">
            {advisory.recommendationAvailable ? (
              <>
                <StatusPillFor status={outcome} size="sm" />
                <span
                  className="text-[10.5px] font-medium text-fg-muted"
                  data-testid="header-advisory-note"
                >
                  Advisory only
                </span>
              </>
            ) : (
              <span
                className="text-[12px] font-medium text-fg-muted"
                data-testid="header-advisory-note"
              >
                Not yet — this gate is locked
              </span>
            )}
          </div>
        </Fact>

        <Fact icon={undefined} label="Overall risk score">
          <RiskScoreIndicator
            risk={riskScore}
            label={`Gate ${header.gateNumber} — Overall Risk Score`}
            size="sm"
            testId="gate-risk-score"
          />
        </Fact>

        <Fact icon={ClipboardList} label="Open findings">
          <span
            className="text-[15px] leading-none font-semibold text-fg tabular-nums"
            data-testid="header-open-findings"
          >
            {header.openFindings}
          </span>
        </Fact>

        <Fact icon={ShieldBan} label="Blocking actions">
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'text-[15px] leading-none font-semibold tabular-nums',
                header.blockingActionsDueNow > 0 ? 'text-fail' : 'text-fg'
              )}
              data-testid="header-blocking-actions"
            >
              {header.blockingActions}
            </span>
            {/* A blocking action due at a later gate is tracked work, not a
                blocker here. Saying so stops the count reading as a Fail. */}
            {header.blockingActions > 0 && header.blockingActionsDueNow === 0 && (
              <span className="text-[10.5px] text-fg-muted">due at a later gate</span>
            )}
          </div>
        </Fact>

        <Fact icon={UserCheck} label="Required human decision">
          <span
            className="text-[12px] leading-snug font-medium text-fg"
            data-testid="header-required-decision"
          >
            Pass · Conditional Pass · Fail
          </span>
        </Fact>
      </dl>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  children,
  accent,
}: {
  icon?: typeof Sparkles;
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
        {Icon && (
          <Icon
            size={11}
            strokeWidth={2.5}
            className={cn('shrink-0', accent ? 'text-accent-solid' : 'text-fg-faint')}
          />
        )}
        {label}
      </dt>
      <dd className="mt-1.5 flex items-center">{children}</dd>
    </div>
  );
}
