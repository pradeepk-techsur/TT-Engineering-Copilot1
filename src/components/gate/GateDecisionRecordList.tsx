'use client';

import { Sparkles, User, Archive } from 'lucide-react';
import { StatusPillFor, StatusPill } from '@/components/ui/status-pill';
import { RiskScoreChip } from '@/components/risk/RiskScoreChip';
import { gateOutcomeStyle, styleFor } from '@/lib/status';
import { formatDateTime, isoOf } from '@/lib/format';
import type { GateDecisionRecord } from '@/shared/types/risk';

/**
 * The preserved record of each decision at this gate.
 *
 * Both halves are kept and both are shown: what the AI advised (outcome,
 * rationale, risk score, strengths, risks, next steps) and what the human
 * decided (outcome, rationale, role, timestamp, artifact versions). When the
 * two differ, the record says so and carries the human's reason.
 */
export function GateDecisionRecordList({ records }: { records: GateDecisionRecord[] }) {
  if (!records.length) {
    return (
      <p className="text-[12.5px] text-fg-muted" data-testid="gate-decision-records-empty">
        No decision has been recorded at this gate yet.
      </p>
    );
  }

  return (
    <ol className="space-y-2.5" data-testid="gate-decision-records">
      {records.map(record => {
        const human = styleFor(gateOutcomeStyle, record.decision);
        const ai = record.aiRecommendation
          ? styleFor(gateOutcomeStyle, record.aiRecommendation.recommendedOutcome)
          : null;

        return (
          <li
            key={record.decisionId}
            className="rounded-lg border border-line bg-raised/50 p-3"
            data-testid="gate-decision-record"
          >
            {/* AI half */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
                <Sparkles size={10} strokeWidth={2.5} className="text-accent-solid" />
                AI recommendation
              </span>
              {ai ? (
                <StatusPillFor status={ai} size="sm" />
              ) : (
                <span className="text-[11.5px] text-fg-faint">not recorded</span>
              )}
              {record.riskScore && (
                <RiskScoreChip
                  score={record.riskScore.score}
                  level={record.riskScore.level}
                  size="sm"
                />
              )}
            </div>
            {record.aiRecommendation?.rationale && (
              <p className="mt-1 text-[11.5px] leading-relaxed text-fg-muted">
                {record.aiRecommendation.rationale}
              </p>
            )}

            {/* Human half */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-line pt-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
                <User size={10} strokeWidth={2.5} />
                Human decision
              </span>
              <StatusPillFor status={human} size="sm" />
              <span className="text-[11.5px] text-fg-2">{record.reviewerRole}</span>
              {record.divergedFromAi && (
                <StatusPill tone="warn" size="sm" dot>
                  Differs from AI recommendation
                </StatusPill>
              )}
              <time
                className="ml-auto text-[10.5px] text-fg-muted tabular-nums"
                dateTime={isoOf(record.timestamp)}
              >
                {formatDateTime(record.timestamp)}
              </time>
            </div>

            {record.humanRationale && (
              <blockquote
                className="mt-2 border-l-2 border-warn-line pl-2.5 text-[12px] leading-relaxed text-fg-2"
                data-testid="human-rationale"
              >
                <span className="text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
                  Reviewer rationale
                </span>
                <br />
                {record.humanRationale}
              </blockquote>
            )}

            {record.comments && record.comments !== record.humanRationale && (
              <blockquote className="mt-2 border-l-2 border-line-strong pl-2.5 text-[12px] leading-relaxed text-fg-2 italic">
                {record.comments}
              </blockquote>
            )}

            {/* What was on the table when the decision was taken. */}
            {(record.aiRecommendation?.keyRisks?.length ||
              record.aiRecommendation?.nextSteps?.length ||
              record.artifactVersionsReviewed?.length) && (
              <details className="mt-2">
                <summary className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-fg-muted">
                  <Archive size={11} strokeWidth={2} />
                  Preserved advisory detail
                </summary>
                <dl className="mt-1.5 space-y-1.5 text-[11.5px]">
                  <Preserved
                    term="Key strengths"
                    items={record.aiRecommendation?.keyStrengths?.map(s => s.statement)}
                  />
                  <Preserved
                    term="Key risks"
                    items={record.aiRecommendation?.keyRisks?.map(
                      r => `${r.statement} (${r.level}, ${r.blocking ? 'blocking' : 'non-blocking'})`
                    )}
                  />
                  <Preserved
                    term="Next steps"
                    items={record.aiRecommendation?.nextSteps?.map(s => s.statement)}
                  />
                  <Preserved
                    term="Artifact versions reviewed"
                    items={record.artifactVersionsReviewed}
                  />
                </dl>
              </details>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Preserved({ term, items }: { term: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <dt className="text-[10px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
        {term}
      </dt>
      <dd>
        <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-fg-2">
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </dd>
    </div>
  );
}
