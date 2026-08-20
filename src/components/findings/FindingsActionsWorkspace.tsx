'use client';
import useSWR from 'swr';
import { AlertTriangle, ClipboardCheck, ListTodo } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { Callout } from '@/components/ui/callout';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonRows } from '@/components/ui/skeleton';
import { ActionDetailCard } from './ActionDetailCard';
import { FindingsSummaryTable } from './FindingsSummaryTable';
import { count } from '@/lib/format';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function FindingsActionsWorkspace({ phaseId }: { phaseId?: number }) {
  const findingsUrl = phaseId ? `/api/findings?phaseId=${phaseId}` : '/api/findings';
  const { data: findingsData } = useSWR(findingsUrl, fetcher, {
    refreshInterval: 5000, keepPreviousData: true,
  });
  const { data: actionsData } = useSWR('/api/actions', fetcher, {
    refreshInterval: 5000, keepPreviousData: true,
  });

  const blockingOpen = (actionsData?.actions ?? []).filter(
    (a: any) => a.blocking && a.status !== 'VerifiedClosed'
  );
  const allActions = actionsData?.actions ?? [];
  const allFindings = findingsData?.findings ?? [];

  const loading = !findingsData || !actionsData;

  return (
    <div className="space-y-5" data-testid="findings-actions-workspace">
      {/* Blocking actions banner — prominent when any blocking actions open */}
      {blockingOpen.length > 0 && (
        <div data-testid="blocking-actions-banner">
          <Callout
            tone="fail"
            icon={AlertTriangle}
            title={`${count(blockingOpen.length, 'Blocking Action')} Open`}
          >
            <p>Gate Pass is blocked until these actions are verified closed.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {blockingOpen.map((a: any) => (
                <StatusPill key={a.actionId} tone="fail" size="sm">
                  <span className="font-mono">{a.actionId}</span>
                  <span className="opacity-70">· due G{a.dueGate}</span>
                </StatusPill>
              ))}
            </div>
          </Callout>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Findings */}
        <section className="min-w-0">
          <div className="mb-2.5 flex items-center gap-2">
            <ClipboardCheck size={14} strokeWidth={2} className="text-fg-muted" />
            <h2 className="text-[13px] font-semibold text-fg">Findings</h2>
            <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10.5px] font-semibold text-fg-muted tabular-nums">
              {allFindings.length}
            </span>
          </div>
          <Card className="py-0">
            {loading && !findingsData ? (
              <SkeletonRows rows={3} />
            ) : (
              <FindingsSummaryTable findings={allFindings} />
            )}
          </Card>
        </section>

        {/* Actions */}
        <section className="min-w-0">
          <div className="mb-2.5 flex items-center gap-2">
            <ListTodo size={14} strokeWidth={2} className="text-fg-muted" />
            <h2 className="text-[13px] font-semibold text-fg">Actions</h2>
            <span className="rounded-full bg-raised px-1.5 py-0.5 text-[10.5px] font-semibold text-fg-muted tabular-nums">
              {allActions.length}
            </span>
            {blockingOpen.length > 0 && (
              <StatusPill tone="fail" size="sm" dot className="ml-auto">
                {blockingOpen.length} blocking open
              </StatusPill>
            )}
          </div>

          {loading && !actionsData ? (
            <Card className="py-0">
              <SkeletonRows rows={3} />
            </Card>
          ) : allActions.length === 0 ? (
            <Card>
              <EmptyState
                size="sm"
                icon={ListTodo}
                title="No actions raised"
                description="Corrective actions appear here when a gate is recorded as Conditional Pass or Fail."
              />
            </Card>
          ) : (
            <div className="space-y-2.5">
              {allActions.map((action: any) => (
                <ActionDetailCard key={action.actionId} action={action} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
