'use client';

import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PHASE_SHORT: Record<number, string> = {
  0: 'Bid', 1: 'Proposal', 2: 'Reqs', 3: 'PDR',
  4: 'CDR', 5: 'V&V', 6: 'MRL', 7: 'Transfer',
  8: 'Sustain', 9: 'EOL',
};

const PHASE_FULL: Record<number, string> = {
  0: 'Phase 0 — Commercial Assessment (Bid/No-Bid)',
  1: 'Phase 1 — Business Case & Proposal',
  2: 'Phase 2 — Requirements Definition',
  3: 'Phase 3 — Preliminary Design Review (PDR)',
  4: 'Phase 4 — Critical Design Review (CDR) & Design Freeze',
  5: 'Phase 5 — Verification & Validation (V&V)',
  6: 'Phase 6 — Manufacturing Readiness (MRL) / PPAP',
  7: 'Phase 7 — Transfer & Lessons Learned',
  8: 'Phase 8 — Production Sustaining',
  9: 'Phase 9 — End of Life (EOL)',
};

function phaseIcon(state: string, isCurrent: boolean) {
  if (['GatePassed', 'GateConditional'].includes(state))
    return <CheckCircle2 size={14} className="text-[var(--color-pass)] flex-shrink-0" />;
  if (state === 'GateFailed')
    return <AlertCircle size={14} className="text-[var(--color-fail)] flex-shrink-0" />;
  if (isCurrent || ['Running', 'AwaitingGate', 'AwaitingInputs'].includes(state))
    return <Clock size={14} className="text-[var(--color-awaiting)] flex-shrink-0" />;
  return <Circle size={14} className="text-[var(--color-text-muted)] flex-shrink-0" />;
}

interface PhaseStepperProps {
  currentPhaseId?: number;
}

export function PhaseStepper({ currentPhaseId }: PhaseStepperProps) {
  const router = useRouter();
  const { data } = useSWR('/api/lifecycle', fetcher, { refreshInterval: 5000 });
  const phases: any[] = data?.phases ?? [];

  if (!phases.length) {
    // Skeleton while loading
    return (
      <div className="flex items-center gap-1 h-8 animate-pulse">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-6 w-12 rounded bg-[var(--color-border)]" />
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Phase journey — Phase 0 through Phase 9"
        className="flex items-center overflow-x-auto scrollbar-hide"
        data-testid="phase-stepper"
      >
        {phases.map((phase: any) => {
          const isCurrent = phase.phaseId === currentPhaseId;
          const isDone = ['GatePassed', 'GateConditional'].includes(phase.phaseState);
          const isConditional = phase.phaseState === 'GateConditional';

          return (
            <div key={phase.phaseId} className="flex items-center flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(`/phase/${phase.phaseId}`)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors min-w-[52px]',
                      isCurrent
                        ? 'bg-white/10 ring-1 ring-[var(--color-awaiting)]/50'
                        : 'hover:bg-white/5',
                    )}
                    aria-current={isCurrent ? 'step' : undefined}
                  >
                    {phaseIcon(phase.phaseState, isCurrent)}
                    <span className={cn(
                      'text-[10px] whitespace-nowrap font-medium',
                      isDone && !isConditional ? 'text-[var(--color-pass)]' :
                      isConditional ? 'text-[var(--color-awaiting)]' :
                      isCurrent ? 'text-[var(--color-text-primary)]' :
                      'text-[var(--color-text-muted)]'
                    )}>
                      {PHASE_SHORT[phase.phaseId]}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[240px] text-center">
                  <p className="font-medium">{PHASE_FULL[phase.phaseId]}</p>
                  <p className="text-muted-foreground mt-0.5">Status: {phase.phaseState}</p>
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {phase.phaseId < 9 && (
                <div className={cn(
                  'h-px w-2 flex-shrink-0 mx-0.5',
                  isDone ? 'bg-[var(--color-pass)]/40' : 'bg-[var(--color-border)]'
                )} />
              )}
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
