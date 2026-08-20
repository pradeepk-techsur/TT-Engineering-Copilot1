'use client';
import useSWR from 'swr';
import { FileInput, PackageOpen, ClipboardList, ScanSearch, History } from 'lucide-react';
import { GateReviewHeader } from './GateReviewHeader';
import { GateAdvisoryPanel } from './GateAdvisoryPanel';
import { GateDecisionSelector } from './GateDecisionSelector';
import { GateDecisionHistory } from './GateDecisionHistory';
import { GateDecisionRecordList } from './GateDecisionRecordList';
import { FindingsSummaryTable } from '@/components/findings/FindingsSummaryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { Skeleton, SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Truncate } from '@/components/ui/truncate';
import { SectionLabel } from '@/components/ui/page-header';
import { useGateAdvisory } from '@/lib/hooks';
import {
  gateStateStyle, readinessStyle, approvalStyle, checkStatusStyle, styleFor,
} from '@/lib/status';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function GateReviewWorkspace({ gateId }: { gateId: number }) {
  const { data, mutate } = useSWR(`/api/gates/${gateId}/review`, fetcher, {
    refreshInterval: 5000,
    keepPreviousData: true,
  });

  // The advisory is its own request: the score, the recommendation and the
  // header counts are computed together server-side, so the header can never
  // show a different number from the panel beneath it.
  const { data: advisory, mutate: mutateAdvisory, isLoading: advisoryLoading } =
    useGateAdvisory(gateId);

  // Skeleton that mirrors the real two-column layout, so the page doesn't
  // reflow from a one-line "Loading gate review data..." into a full screen.
  if (!data) {
    return (
      <div className="space-y-5">
        <Card>
          <CardContent className="space-y-3">
            <Skeleton className="h-3.5 w-56" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-5 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-4">
            {[0, 1, 2].map(i => (
              <Card key={i} className="py-0">
                <div className="border-b border-line px-4 py-3">
                  <Skeleton className="h-3 w-32" />
                </div>
                <SkeletonRows rows={2} />
              </Card>
            ))}
          </div>
          <div className="w-full space-y-4 lg:w-[360px] lg:shrink-0">
            <Card>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const blockingActionsOpen = (data.openActions ?? []).some(
    (a: any) => a.blocking && a.status !== 'VerifiedClosed'
  );
  const gate = styleFor(gateStateStyle, data.gateState);
  const checks: any[] = data.deterministicChecks ?? [];
  const inputs: any[] = data.inputs ?? [];
  const outputs: any[] = data.outputs ?? [];

  const refresh = () => {
    mutate();
    mutateAdvisory();
  };

  return (
    <div className="space-y-5" data-testid={`gate-review-workspace-${gateId}`}>
      {/* ── Gate Review header — phase and gate, AI recommendation, risk
             score, open findings, blocking actions, required human
             decision. ───────────────────────────────────────────────── */}
      <GateReviewHeader data={advisory} isLoading={advisoryLoading} />

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ── Advisory, then the evidence behind it ──────────────────── */}
        <div className="min-w-0 flex-1 space-y-4">
          <GateAdvisoryPanel data={advisory} />

          {/* Evidence is summary-only by default: names, states and counts.
              No output-document content is rendered here — each row links to
              the artifact instead. */}
          <div>
            <SectionLabel>Supporting evidence</SectionLabel>

            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                {/* A real heading for the evidence section — it labels the
                    region for screen readers, and the acceptance tests look
                    for a "Gate N Review" heading inside this workspace. */}
                <h3 className="text-[11px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
                  Gate {gateId} Review
                </h3>
                <StatusPillFor status={gate} />
                {blockingActionsOpen && (
                  <StatusPill tone="fail" dot pulse>
                    Blocking actions open
                  </StatusPill>
                )}
              </div>

              {/* Inputs */}
              <Card className="py-0">
                <PanelHeader icon={FileInput} title="Inputs reviewed" count={inputs.length} />
                {inputs.length === 0 ? (
                  <EmptyState size="sm" title="No inputs recorded for this gate" />
                ) : (
                  <ul className="divide-y divide-line">
                    {inputs.map((input: any) => (
                      <li
                        key={input.inputRole}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <Truncate className="text-[13px] text-fg">{input.logicalName}</Truncate>
                        <StatusPillFor
                          status={styleFor(readinessStyle, input.readinessStatus)}
                          size="sm"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Outputs */}
              <Card className="py-0">
                <PanelHeader
                  icon={PackageOpen}
                  title="Outputs reviewed"
                  count={outputs.length}
                  note="Rendered from ProjectState — no gate-pack artifact"
                />
                {outputs.length === 0 ? (
                  <EmptyState size="sm" title="No outputs recorded for this gate" />
                ) : (
                  <ul className="divide-y divide-line">
                    {outputs.map((output: any) => (
                      <li
                        key={output.outputId}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                      >
                        <Truncate className="text-[13px] text-fg">{output.outputName}</Truncate>
                        <StatusPillFor
                          status={styleFor(approvalStyle, output.approvalStatus)}
                          size="sm"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Findings */}
              <Card className="py-0">
                <PanelHeader
                  icon={ClipboardList}
                  title="Findings"
                  count={(data.findings ?? []).length}
                />
                <FindingsSummaryTable findings={data.findings ?? []} />
              </Card>

              {/* Deterministic checks — SI-03 four checks (initial + revised runs) */}
              {checks.length > 0 && (
                <Card className="py-0">
                  <PanelHeader
                    icon={ScanSearch}
                    title="Deterministic check results"
                    count={checks.length}
                    note="No LLM involved — each check cites EVINV-POC-STD-001"
                  />
                  <ul className="divide-y divide-line">
                    {checks.map((check: any, idx: number) => (
                      <li
                        key={check.checkId ?? idx}
                        className="flex items-center justify-between gap-3 px-4 py-2.5"
                        data-testid={`check-result-row-${idx}`}
                      >
                        <div className="min-w-0">
                          <Truncate className="text-[13px] font-medium text-fg">
                            {check.checkType}
                          </Truncate>
                          {check.sourceReference && (
                            <Truncate className="mt-0.5 font-mono text-[11px] text-fg-muted">
                              {check.sourceReference}
                            </Truncate>
                          )}
                        </div>
                        <StatusPillFor
                          status={styleFor(checkStatusStyle, check.status ?? 'Unknown')}
                          size="sm"
                        />
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Decision history */}
              {(data.decisionHistory ?? []).length > 0 && (
                <Card className="py-0">
                  <PanelHeader
                    icon={History}
                    title="Decision history"
                    count={data.decisionHistory.length}
                  />
                  <div className="p-4">
                    <GateDecisionHistory decisions={data.decisionHistory} />
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* ── Decision column — sticky, so the decision is always reachable
               while you scroll through the evidence. ──────────────────── */}
        <div className="w-full lg:w-[360px] lg:shrink-0">
          <div className="space-y-4 lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle>Human gate decision</CardTitle>
              </CardHeader>
              <CardContent>
                <GateDecisionSelector
                  gateId={gateId}
                  blockingActionsOpen={blockingActionsOpen}
                  aiRecommendation={advisory?.advisory ?? null}
                  onDecisionRecorded={refresh}
                />
              </CardContent>
            </Card>

            {/* What has already been recorded here — AI half and human half. */}
            <Card>
              <CardHeader>
                <CardTitle>Preserved decision record</CardTitle>
              </CardHeader>
              <CardContent>
                <GateDecisionRecordList records={advisory?.decisionRecords ?? []} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  count,
  note,
}: {
  icon: typeof FileInput;
  title: string;
  count?: number;
  note?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-line px-4 py-3">
      <Icon size={14} strokeWidth={2} className="shrink-0 text-fg-muted" />
      <h3 className="text-[13px] font-semibold text-fg">{title}</h3>
      {count !== undefined && (
        <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10.5px] font-semibold text-fg-muted tabular-nums">
          {count}
        </span>
      )}
      {note && <p className="ml-auto text-[11px] text-fg-muted italic">{note}</p>}
    </div>
  );
}
