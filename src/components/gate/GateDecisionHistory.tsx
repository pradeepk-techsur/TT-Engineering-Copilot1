import { Sparkles, User } from 'lucide-react';
import { StatusPillFor } from '@/components/ui/status-pill';
import { gateOutcomeStyle, styleFor } from '@/lib/status';
import { formatDateTime, isoOf } from '@/lib/format';

interface GateDecision {
  decisionId: string; decision: string; reviewerRole: string;
  timestamp: string; comments?: string; aiRecommendation?: { recommendedOutcome: string };
}

export function GateDecisionHistory({ decisions }: { decisions: GateDecision[] }) {
  if (!decisions.length) return null;

  return (
    <ol className="space-y-2.5" data-testid="gate-decision-history">
      {decisions.map(d => {
        const outcome = styleFor(gateOutcomeStyle, d.decision);
        const aiAgreed =
          d.aiRecommendation &&
          d.aiRecommendation.recommendedOutcome === d.decision;

        return (
          <li
            key={d.decisionId}
            className="rounded-lg border border-line bg-raised/50 p-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <StatusPillFor status={outcome} size="sm" />
              <span className="flex items-center gap-1.5 text-[12px] text-fg-2">
                <User size={11} strokeWidth={2} className="text-fg-faint" />
                {d.reviewerRole}
              </span>
              <time
                className="ml-auto text-[11px] text-fg-muted tabular-nums"
                dateTime={isoOf(d.timestamp)}
              >
                {formatDateTime(d.timestamp)}
              </time>
            </div>

            {d.aiRecommendation && (
              <p className="mt-2 flex items-center gap-1.5 text-[11.5px] text-fg-muted">
                <Sparkles size={11} strokeWidth={2} className="shrink-0" />
                AI recommended {d.aiRecommendation.recommendedOutcome}
                {/* Whether the human agreed with the AI is the interesting
                    part of an audit trail, so state it rather than implying it. */}
                <span className={aiAgreed ? 'text-fg-muted' : 'text-warn'}>
                  · {aiAgreed ? 'human agreed' : 'human overrode'}
                </span>
              </p>
            )}

            {d.comments && (
              <blockquote className="mt-2 border-l-2 border-line-strong pl-2.5 text-[12.5px] leading-relaxed text-fg-2 italic">
                {d.comments}
              </blockquote>
            )}
          </li>
        );
      })}
    </ol>
  );
}
