'use client';
import useSWR from 'swr';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2 } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PhaseExecutionProgressProps {
  phaseId: number;
}

export function PhaseExecutionProgress({ phaseId }: PhaseExecutionProgressProps) {
  const { data } = useSWR(`/api/phases/${phaseId}/execution-status`, fetcher, {
    refreshInterval: 2000,  // Poll every 2s during execution
  });

  const status: string = data?.status ?? 'Waiting for User Input';
  const isRunning = status === 'Processing';
  const isComplete = status === 'Complete' || status === 'Awaiting Human Decision';
  const isReady = status === 'Ready to Run';

  if (!data) return null;

  return (
    <div className="space-y-2" data-testid={`phase-execution-progress-${phaseId}`}>
      <div className="flex items-center gap-2">
        {isRunning && <Loader2 size={14} className="animate-spin text-blue-400" />}
        {isComplete && <CheckCircle2 size={14} className="text-green-400" />}
        <span className="text-xs text-[var(--color-text-muted)]">
          Phase Execution:
        </span>
        <Badge className={`text-xs border ${
          isRunning ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
          isComplete ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          isReady ? 'bg-green-500/10 text-green-400 border-green-500/20' :
          'bg-slate-500/10 text-slate-400 border-slate-500/20'
        }`}>
          {status}
        </Badge>
      </div>

      {/* Animated progress bar during execution */}
      {isRunning && (
        <Progress
          value={null as unknown as number}
          className="h-1.5 bg-[var(--color-border)]"
          data-testid="execution-progress-bar"
        />
      )}
    </div>
  );
}
