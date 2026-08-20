'use client';
import { useRouter } from 'next/navigation';
import { Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLifecycle } from '@/lib/hooks';
import { phaseStateStyle, styleFor, toneText } from '@/lib/status';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';

/** Abbreviations for the rail — ten have to fit across. Full names in FULL. */
const SHORT: Record<number, string> = {
  0:'Initiation', 1:'Concept', 2:'Reqs', 3:'Prelim',
  4:'Detail', 5:'Validation', 6:'Prod Prep', 7:'Transfer', 8:'Manufacture', 9:'EOL',
};
const FULL: Record<number, string> = {
  0:'Phase 0 — Project Initiation',
  1:'Phase 1 — Concept & Proposal',
  2:'Phase 2 — Requirements Development',
  3:'Phase 3 — Preliminary Design',
  4:'Phase 4 — Detail Design',
  5:'Phase 5 — Design Validation',
  6:'Phase 6 — Production Preparation & Qualification',
  7:'Phase 7 — Transfer & Monitor',
  8:'Phase 8 — Manufacture',
  9:'Phase 9 — End-of-Life',
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

/**
 * Marker styling per kind. The glyph plus the tone communicate the outcome.
 *
 * These were solid fills, so ten phases rendered as ten saturated blobs and
 * the one marker that matters — where you actually are — had to compete with
 * nine others for attention. Outcomes are now tinted outlines; only the
 * current phase is filled, because only one of them is "you are here".
 */
const MARKER: Record<Kind, string> = {
  passed:      'border-pass-line bg-pass-soft text-pass',
  conditional: 'border-warn-line bg-warn-soft text-warn',
  failed:      'border-fail-line bg-fail-soft text-fail',
  active:      'border-accent-solid bg-accent-solid text-accent-fg',
  todo:        'border-line-strong bg-surface text-fg-faint',
};

const TRACK_DONE = 'bg-line-strong';
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
                          <span className="size-1.5 animate-pulse rounded-full bg-accent-fg" />
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
                        'max-w-full truncate text-[10.5px] leading-none tracking-tight transition-colors',
                        isCurrent
                          ? 'font-semibold text-fg'
                          : kind === 'todo'
                            ? 'font-medium text-fg-faint group-hover:text-fg-muted'
                            : 'font-medium text-fg-muted group-hover:text-fg'
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
