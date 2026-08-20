'use client';
import { useRouter } from 'next/navigation';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLifecycle } from '@/lib/hooks';
import { phaseStateStyle, styleFor, toneText } from '@/lib/status';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

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

const DONE = ['GatePassed', 'GateConditional'];
const ACTIVE = ['Running', 'AwaitingGate', 'AwaitingInputs'];

type Kind = 'passed' | 'conditional' | 'failed' | 'active' | 'todo';

function kindOf(state: string): Kind {
  if (state === 'GatePassed') return 'passed';
  if (state === 'GateConditional') return 'conditional';
  if (state === 'GateFailed' || state === 'Cancelled') return 'failed';
  if (ACTIVE.includes(state) || state === 'Paused') return 'active';
  return 'todo';
}

/** Marker styling per kind. The dot alone must communicate the outcome. */
const MARKER: Record<Kind, string> = {
  passed:      'border-pass bg-pass text-[color:var(--tt-canvas)]',
  conditional: 'border-warn bg-warn text-[color:var(--tt-canvas)]',
  failed:      'border-fail bg-fail text-[color:var(--tt-canvas)]',
  active:      'border-accent-solid bg-accent-soft text-accent-solid',
  todo:        'border-line-strong bg-surface text-fg-faint',
};

const TRACK_DONE = 'bg-pass/40';
const TRACK_TODO = 'bg-line';

export function PhaseStepper({ currentPhaseId }: { currentPhaseId?: number }) {
  const router = useRouter();
  const { data, isLoading } = useLifecycle();

  // While the first fetch is in flight, show a quiet placeholder rail rather
  // than 10 "Not Started" markers — that used to render as confidently wrong
  // information for a second before snapping to the real states.
  if (isLoading && !data) {
    return (
      <div className="flex items-center gap-0" data-testid="phase-stepper-loading">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={cn('h-px flex-1', i === 0 ? 'bg-transparent' : TRACK_TODO)} />
              <span className="size-[18px] shrink-0 animate-shimmer rounded-full border border-line bg-raised" />
              <span className={cn('h-px flex-1', i === 9 ? 'bg-transparent' : TRACK_TODO)} />
            </div>
            <span className="h-2.5 w-8 animate-shimmer rounded bg-raised" />
          </div>
        ))}
      </div>
    );
  }

  const phases: { phaseId: number; phaseState: string }[] =
    data?.phases ?? Array.from({ length: 10 }, (_, i) => ({ phaseId: i, phaseState: 'Pending' }));

  // Fall back to the project's own current phase so the rail still shows
  // "you are here" on pages that don't pass a phase (overview, audit, settings).
  const activeId: number | undefined =
    currentPhaseId ?? (typeof data?.currentPhase === 'number' ? data.currentPhase : undefined);

  return (
    <TooltipProvider delay={200}>
      <ol
        aria-label="Phase journey"
        className="flex items-center gap-0"
        data-testid="phase-stepper"
      >
        {phases.map((p, i) => {
          const isCurrent = p.phaseId === activeId;
          const kind = kindOf(p.phaseState);
          const status = styleFor(phaseStateStyle, p.phaseState);
          const prevDone = i > 0 && DONE.includes(phases[i - 1]?.phaseState);
          const selfDone = DONE.includes(p.phaseState);

          return (
            <li key={p.phaseId} className="flex min-w-0 flex-1 flex-col items-center">
              <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => router.push(`/phase/${p.phaseId}`)}
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`${FULL[p.phaseId]} — ${status.label}`}
                    className="group flex w-full min-w-0 cursor-pointer flex-col items-center gap-1 rounded-md pt-0.5 pb-1 outline-none"
                  >
                    {/* Track + marker. The line is drawn either side of the dot
                        so the rail reads as one continuous journey. */}
                    <span className="flex w-full items-center">
                      <span
                        className={cn(
                          'h-px flex-1 transition-colors',
                          i === 0 ? 'bg-transparent' : prevDone ? TRACK_DONE : TRACK_TODO
                        )}
                      />
                      <span
                        className={cn(
                          'flex size-[18px] shrink-0 items-center justify-center rounded-full border transition-all',
                          MARKER[kind],
                          isCurrent && 'ring-2 ring-accent-solid/35 ring-offset-1 ring-offset-surface',
                          'group-hover:scale-110'
                        )}
                      >
                        {kind === 'passed' && <Check size={11} strokeWidth={3} />}
                        {kind === 'conditional' && <Minus size={11} strokeWidth={3} />}
                        {kind === 'failed' && <X size={11} strokeWidth={3} />}
                        {kind === 'active' && (
                          <span className="size-1.5 animate-pulse rounded-full bg-accent-solid" />
                        )}
                        {kind === 'todo' && (
                          <span className="text-[9.5px] leading-none font-semibold tabular-nums">
                            {p.phaseId}
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          'h-px flex-1 transition-colors',
                          i === 9 ? 'bg-transparent' : selfDone ? TRACK_DONE : TRACK_TODO
                        )}
                      />
                    </span>

                    <span
                      className={cn(
                        'max-w-full truncate text-[10.5px] leading-none font-medium tracking-tight transition-colors',
                        isCurrent
                          ? 'text-fg'
                          : kind === 'todo'
                            ? 'text-fg-faint group-hover:text-fg-muted'
                            : cn(toneText[status.tone], 'group-hover:opacity-80')
                      )}
                    >
                      {SHORT[p.phaseId] ?? `P${p.phaseId}`}
                    </span>
                  </button>
                }
              />
              <TooltipContent side="bottom" className="text-center">
                <p className="font-medium">{FULL[p.phaseId]}</p>
                <p className={cn('mt-0.5', toneText[status.tone])}>
                  {status.label}
                  {isCurrent && <span className="text-fg-muted"> · current</span>}
                </p>
                <p className="mt-1 text-[11px] text-fg-faint">Click to open phase</p>
              </TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ol>
    </TooltipProvider>
  );
}
