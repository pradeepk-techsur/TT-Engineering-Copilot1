'use client';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const SHORT: Record<number, string> = {
  0:'Bid', 1:'Proposal', 2:'Reqs', 3:'PDR',
  4:'CDR', 5:'V&V', 6:'MRL', 7:'Transfer', 8:'Sustain', 9:'EOL',
};
const FULL: Record<number, string> = {
  0:'Phase 0 — Commercial Assessment (Bid/No-Bid)',
  1:'Phase 1 — Business Case & Proposal',
  2:'Phase 2 — Requirements Definition',
  3:'Phase 3 — Preliminary Design Review (PDR)',
  4:'Phase 4 — Critical Design Review (CDR) & Design Freeze',
  5:'Phase 5 — Verification & Validation (V&V)',
  6:'Phase 6 — Manufacturing Readiness (MRL/PPAP)',
  7:'Phase 7 — Transfer & Lessons Learned',
  8:'Phase 8 — Production Sustaining',
  9:'Phase 9 — End of Life (EOL)',
};

function PhaseIcon({ state, current }: { state: string; current: boolean }) {
  if (['GatePassed','GateConditional'].includes(state))
    return <CheckCircle2 size={13} className="text-[var(--color-pass)]" />;
  if (state === 'GateFailed')
    return <AlertCircle size={13} className="text-[var(--color-fail)]" />;
  if (current || ['Running','AwaitingGate','AwaitingInputs'].includes(state))
    return <Clock size={13} className="text-[var(--color-awaiting)]" />;
  return <Circle size={13} className="text-[var(--color-text-muted)]" />;
}

export function PhaseStepper({ currentPhaseId }: { currentPhaseId?: number }) {
  const router = useRouter();
  const { data } = useSWR('/api/lifecycle', fetcher, {
    refreshInterval: 6000,
    revalidateOnFocus: false,
  });

  const phases: any[] = data?.phases
    ?? Array.from({ length: 10 }, (_, i) => ({ phaseId: i, phaseState: 'Pending' }));

  return (
    <TooltipProvider delayDuration={200}>
      <nav
        aria-label="Phase journey"
        className="flex items-center gap-0 overflow-x-auto"
        data-testid="phase-stepper"
      >
        {phases.map((p: any, i: number) => {
          const current = p.phaseId === currentPhaseId;
          const done = ['GatePassed', 'GateConditional'].includes(p.phaseState);
          return (
            <div key={i} className="flex items-center flex-shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => router.push(`/phase/${p.phaseId}`)}
                    className={cn(
                      'flex flex-col items-center gap-0.5 px-2 py-1 rounded-md transition-colors min-w-[48px]',
                      current
                        ? 'bg-white/10 ring-1 ring-[var(--color-awaiting)]/40'
                        : 'hover:bg-white/5'
                    )}
                    aria-current={current ? 'step' : undefined}
                  >
                    <PhaseIcon state={p.phaseState} current={current} />
                    <span className={cn(
                      'text-[10px] font-medium whitespace-nowrap',
                      done
                        ? 'text-[var(--color-pass)]'
                        : current
                          ? 'text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-muted)]'
                    )}>
                      {SHORT[p.phaseId] ?? `P${p.phaseId}`}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs max-w-[220px] text-center">
                  <p className="font-medium">{FULL[p.phaseId]}</p>
                  <p className="opacity-70 mt-0.5">{p.phaseState}</p>
                </TooltipContent>
              </Tooltip>
              {i < 9 && (
                <div className={cn(
                  'h-px w-2 flex-shrink-0',
                  done ? 'bg-[var(--color-pass)]/30' : 'bg-[var(--color-border)]'
                )} />
              )}
            </div>
          );
        })}
      </nav>
    </TooltipProvider>
  );
}
