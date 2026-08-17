import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface AIRecommendationPanelProps {
  recommendation: {
    recommendedOutcome: 'Pass' | 'Conditional Pass' | 'Fail';
    rationale: string;
    findingsCited?: string[];
    checksCited?: string[];
    advisoryLabel: string;
  } | null;
}

const OUTCOME_STYLES = {
  'Pass': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Conditional Pass': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Fail': 'bg-red-500/10 text-red-400 border-red-500/20',
};

export function AIRecommendationPanel({ recommendation }: AIRecommendationPanelProps) {
  if (!recommendation) {
    return (
      <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
        <CardContent className="pt-4">
          <p className="text-sm text-[var(--color-text-muted)]">AI recommendation not yet generated. Execute phase first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)]" data-testid="ai-recommendation-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">AI Recommended Outcome</CardTitle>
          {/* Advisory label — ALWAYS VISIBLE, CANNOT BE SUPPRESSED */}
          <Badge
            className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20"
            data-testid="advisory-label"
          >
            <Info size={10} className="mr-1" />
            {recommendation.advisoryLabel}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">Recommended:</span>
          <Badge className={`text-xs border ${OUTCOME_STYLES[recommendation.recommendedOutcome]}`}>
            {recommendation.recommendedOutcome}
          </Badge>
        </div>
        <p className="text-sm text-[var(--color-text-primary)]">{recommendation.rationale}</p>
        {(recommendation.findingsCited?.length ?? 0) > 0 && (
          <div className="text-xs text-[var(--color-text-muted)]">
            Findings cited: {recommendation.findingsCited?.join(', ')}
          </div>
        )}
        {(recommendation.checksCited?.length ?? 0) > 0 && (
          <div className="text-xs text-[var(--color-text-muted)]">
            Checks cited: {recommendation.checksCited?.join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
