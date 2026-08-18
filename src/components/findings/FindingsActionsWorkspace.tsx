'use client';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActionDetailCard } from './ActionDetailCard';
import { FindingsSummaryTable } from './FindingsSummaryTable';
import { AlertTriangle } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function FindingsActionsWorkspace({ phaseId }: { phaseId?: number }) {
  const findingsUrl = phaseId ? `/api/findings?phaseId=${phaseId}` : '/api/findings';
  const { data: findingsData } = useSWR(findingsUrl, fetcher, { refreshInterval: 5000 });
  const { data: actionsData } = useSWR('/api/actions', fetcher, { refreshInterval: 5000 });

  const blockingOpen = (actionsData?.actions ?? []).filter(
    (a: any) => a.blocking && a.status !== 'VerifiedClosed'
  );
  const allActions = actionsData?.actions ?? [];
  const allFindings = findingsData?.findings ?? [];

  return (
    <div className="space-y-6" data-testid="findings-actions-workspace">
      {/* Blocking actions banner — prominent when any blocking actions open */}
      {blockingOpen.length > 0 && (
        <div
          className="rounded-md bg-red-500/10 border border-red-500/20 px-4 py-3 flex items-start gap-3"
          data-testid="blocking-actions-banner"
        >
          <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">
              {blockingOpen.length} Blocking Action{blockingOpen.length > 1 ? 's' : ''} Open
            </p>
            <p className="text-xs text-red-400/80 mt-0.5">
              Gate Pass is blocked until these actions are verified closed.
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {blockingOpen.map((a: any) => (
                <Badge key={a.actionId} className="text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                  {a.actionId} — Due Gate {a.dueGate}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Findings */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-sm">Findings ({allFindings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <FindingsSummaryTable findings={allFindings} />
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardHeader>
            <CardTitle className="text-sm">
              Actions ({allActions.length})
              {blockingOpen.length > 0 && (
                <Badge className="ml-2 text-xs bg-red-500/10 text-red-400 border border-red-500/20">
                  {blockingOpen.length} blocking open
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allActions.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No actions raised.</p>
            ) : (
              allActions.map((action: any) => (
                <ActionDetailCard key={action.actionId} action={action} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
