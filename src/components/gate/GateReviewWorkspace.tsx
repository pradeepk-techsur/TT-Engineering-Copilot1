'use client';
import useSWR from 'swr';
import { AIRecommendationPanel } from './AIRecommendationPanel';
import { GateDecisionSelector } from './GateDecisionSelector';
import { GateDecisionHistory } from './GateDecisionHistory';
import { FindingsSummaryTable } from '@/components/findings/FindingsSummaryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function GateReviewWorkspace({ gateId }: { gateId: number }) {
  const { data, mutate } = useSWR(`/api/gates/${gateId}/review`, fetcher, { refreshInterval: 5000 });

  if (!data) return <div className="text-sm text-[var(--color-text-muted)]">Loading gate review data...</div>;

  const blockingActionsOpen = (data.openActions ?? []).some(
    (a: any) => a.blocking && a.status !== 'VerifiedClosed'
  );

  return (
    <div className="space-y-6" data-testid={`gate-review-workspace-${gateId}`}>
      {/* Gate identity */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold">Gate {gateId} Review</h2>
        <Badge className={`text-xs border ${data.gateState === 'Open' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
          {data.gateState}
        </Badge>
        {/* No gate-pack artifact link — Gate Review rendered from state only (GR-01) */}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left: inputs and outputs reviewed */}
        <div className="col-span-2 space-y-4">
          {/* Inputs reviewed */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardHeader><CardTitle className="text-sm">Inputs Reviewed</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(data.inputs ?? []).map((input: any) => (
                <div key={input.inputRole} className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)]/50 last:border-0">
                  <span>{input.logicalName}</span>
                  <Badge className={`text-xs border ${input.readinessStatus?.includes('Ready') ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                    {input.readinessStatus}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Outputs reviewed — from ProjectState, no separate gate-pack */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Outputs Reviewed</CardTitle>
                <span className="text-xs text-[var(--color-text-muted)] italic">Rendered from ProjectState — no gate-pack artifact</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {(data.outputs ?? []).map((output: any) => (
                <div key={output.outputId} className="flex items-center justify-between text-xs py-1 border-b border-[var(--color-border)]/50 last:border-0">
                  <span>{output.outputName}</span>
                  <Badge className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">{output.approvalStatus}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Findings */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardHeader><CardTitle className="text-sm">Findings</CardTitle></CardHeader>
            <CardContent>
              <FindingsSummaryTable findings={data.findings ?? []} />
            </CardContent>
          </Card>

          {/* Deterministic Check Results — SI-03 four checks (initial + revised runs) */}
          {(data.deterministicChecks ?? []).length > 0 && (
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
              <CardHeader><CardTitle className="text-sm">Deterministic Check Results</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-[var(--color-text-muted)] mb-2">
                  Results from deterministic tools (no LLM). Each check cites EVINV-POC-STD-001.
                </p>
                {(data.deterministicChecks as any[]).map((check: any, idx: number) => (
                  <div
                    key={check.checkId ?? idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-[var(--color-border)]/50 last:border-0"
                    data-testid={`check-result-row-${idx}`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium truncate">{check.checkType}</span>
                      {check.sourceReference && (
                        <span className="text-[var(--color-text-muted)] truncate">{check.sourceReference}</span>
                      )}
                    </div>
                    <Badge
                      className={`text-xs border ml-2 shrink-0 ${
                        check.status === 'Pass'
                          ? 'bg-green-500/10 text-green-400 border-green-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      {check.status ?? 'Unknown'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Gate decision history */}
          {(data.decisionHistory ?? []).length > 0 && (
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
              <CardContent className="pt-4">
                <GateDecisionHistory decisions={data.decisionHistory} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: AI recommendation + decision selector */}
        <div className="space-y-4">
          <AIRecommendationPanel recommendation={data.aiRecommendation} />
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardHeader><CardTitle className="text-sm">Human Gate Decision</CardTitle></CardHeader>
            <CardContent>
              <GateDecisionSelector
                gateId={gateId}
                blockingActionsOpen={blockingActionsOpen}
                onDecisionRecorded={() => mutate()}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
