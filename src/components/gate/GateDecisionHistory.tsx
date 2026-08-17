import { Badge } from '@/components/ui/badge';

interface GateDecision {
  decisionId: string; decision: string; reviewerRole: string;
  timestamp: string; comments?: string; aiRecommendation?: { recommendedOutcome: string };
}

export function GateDecisionHistory({ decisions }: { decisions: GateDecision[] }) {
  if (!decisions.length) return null;
  return (
    <div className="space-y-2" data-testid="gate-decision-history">
      <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Decision History</p>
      {decisions.map(d => (
        <div key={d.decisionId} className="rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] p-3 text-xs space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={`text-xs border ${d.decision === 'Pass' ? 'bg-green-500/10 text-green-400 border-green-500/20' : d.decision === 'Conditional Pass' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{d.decision}</Badge>
            <span className="text-[var(--color-text-muted)]">{d.reviewerRole}</span>
            <span className="text-[var(--color-text-muted)]">· {new Date(d.timestamp).toLocaleString()}</span>
          </div>
          {d.aiRecommendation && (
            <div className="text-[var(--color-text-muted)]">AI recommended: {d.aiRecommendation.recommendedOutcome}</div>
          )}
          {d.comments && <div className="text-[var(--color-text-primary)]">"{d.comments}"</div>}
        </div>
      ))}
    </div>
  );
}
