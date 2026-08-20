'use client';
import React, { useState } from 'react';
import {
  Play, TriangleAlert, Info, Loader2, Globe, FolderClosed,
  CheckCircle2, CircleDashed, PlayCircle,
} from 'lucide-react';
import { UpIntakeCard } from './UpIntakeCard';
import { SiIntakeCard } from './SiIntakeCard';
import { PhaseExecutionStatusBadge } from './PhaseExecutionStatusBadge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/ui/callout';
import { Skeleton } from '@/components/ui/skeleton';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { executionStatusStyle, styleFor, toneText } from '@/lib/status';
import { cn } from '@/lib/utils';
import { usePhaseInputs, usePhaseExecutionStatus } from '@/lib/hooks';

/** Plain-language explanation of each state, so the badge isn't the only cue. */
const EXPLAIN: Record<string, string> = {
  'Waiting for User Input': 'Upload the required input file to unblock this phase.',
  'Waiting for Synthetic Sample Ingestion':
    'Ingest the preloaded synthetic sample to unblock this phase.',
  'Ready to Run': 'Both inputs are ready — you can run the phase now.',
  'Processing': 'Agents are working. Outputs appear on the phase workspace as they complete.',
  'Awaiting Human Decision': 'Execution finished. The gate now needs your decision.',
  'Complete': 'This phase is finished and its gate has been decided.',
};

interface InputReadinessPanelProps {
  phaseId: number;
}

export function InputReadinessPanel({ phaseId }: InputReadinessPanelProps) {
  const { data: readiness, mutate: mutateReadiness } = usePhaseInputs(phaseId);
  const { data: execStatus, mutate: mutateStatus } = usePhaseExecutionStatus(phaseId);

  const [isExecuting, setIsExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);

  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  const refresh = () => {
    mutateReadiness();
    mutateStatus();
  };

  const handleRunPhase = async () => {
    setIsExecuting(true);
    setExecuteError(null);
    try {
      const res = await fetch(`/api/phases/${phaseId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRevised }),
      });

      // Guard: parse JSON only when the response is actually JSON.
      // The preview proxy can return a plain-text/HTML error page (e.g. "Preview
      // unavailable") when the upstream times out — trying to .json() that causes
      // "Unexpected token P … is not valid JSON".
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        // Non-JSON response — proxy or server error
        setExecuteError('Server returned an unexpected response. Check that the app is running.');
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setExecuteError(data.message ?? data.error_code ?? 'Execution failed');
      } else {
        // 202 Accepted: execution started in background — SWR on /execution-status
        // will automatically reflect the Running → AwaitingGate transition.
        refresh();
      }
    } catch (err: any) {
      setExecuteError(err.message ?? 'Network error during execution');
    } finally {
      setIsExecuting(false);
      refresh();
    }
  };

  if (!config || !readiness) {
    return (
      // Heights are matched to the real cards on purpose. A skeleton that is
      // shorter than its content makes the page jump when data lands — and
      // anything the user was about to click moves out from under the cursor.
      <div className="space-y-4">
        <Skeleton className="h-[68px] rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-[286px] rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-[286px] rounded-xl" />
        </div>
      </div>
    );
  }

  const externalConfig = config.externalIntake;
  const internalConfig = config.internalIntake;
  const bothReady = execStatus?.bothReady === true;
  const status: string = execStatus?.status ?? 'Waiting for User Input';

  // isRevised: true when the internal input has been revised (version > 1)
  // The DFM flagship agent re-runs only affected checks and auto-closes A3-001 on revised run.
  const internalVersion: number = readiness?.internal?.activeVersion ?? 0;
  const isRevised = internalVersion > 1;

  const runDisabled =
    !bothReady || status === 'Processing' || status === 'Complete' || isExecuting;

  const execStyle = styleFor(executionStatusStyle, status);
  const isRunning = status === 'Processing';
  const StatusIcon = isRunning
    ? Loader2
    : status === 'Complete'
      ? CheckCircle2
      : status === 'Ready to Run'
        ? PlayCircle
        : CircleDashed;

  // Explain the disabled Run button rather than leaving a dead control — but
  // only when the explanation adds something. For Processing, Complete and
  // Awaiting Human Decision, EXPLAIN above already says exactly why the button
  // is inert, and the old copy ("Both inputs must be ready…") actively
  // contradicted it once execution had finished.
  const runBlockedReason =
    !isExecuting && !bothReady && status !== 'Awaiting Human Decision' && status !== 'Complete'
      ? 'Both inputs must be ready before the phase can run.'
      : null;

  // Helper to determine sample file name
  const sampleFileName = (role: 'external' | 'internal') => {
    const key = `${phaseId}-${role}`;
    const map: Record<string, string> = {
      '0-internal': 'phase0-int-capability-assessment.xlsx',
      '1-internal': 'phase1-int-cost-resource.xlsx',
      '2-internal': 'phase2-int-system-requirements.xlsx',
      '3-external': 'phase3-ext-design-rules.xlsx',
      '4-external': 'phase4-ext-dfm-standards-supplier.xlsx',
      '5-external': 'phase5-ext-test-methods-acceptance.xlsx',
      '6-internal': 'phase6-int-manufacturing-capability.xlsx',
      '7-internal': 'phase7-int-transfer-defects-yield.xlsx',
      '8-external': 'phase8-ext-supplier-lifecycle.xlsx',
      '8-internal': 'phase8-int-production-bom-yield.xlsx',
      '9-internal': 'phase9-int-final-product-archive.xlsx',
    };
    return map[key] ?? '';
  };

  return (
    <div className="space-y-4" data-testid="input-readiness-panel">
      {/* ── Run bar — the single place execution state is reported, so the
             status sits next to the control that changes it. ───────────── */}
      <div
        className="overflow-hidden rounded-xl border border-line bg-surface shadow-sm"
        data-testid={`phase-execution-${phaseId}`}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <StatusIcon
            className={cn('shrink-0', toneText[execStyle.tone], isRunning && 'animate-spin')}
            size={16}
            strokeWidth={2}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-semibold tracking-[0.08em] text-fg-muted uppercase">
              Phase execution
            </p>
            <p className="mt-0.5 text-[12.5px] text-fg-2">
              {EXPLAIN[status] ?? 'Waiting on the next step.'}
            </p>
          </div>

          <PhaseExecutionStatusBadge status={status} />

          <div className="flex items-center gap-3">
            {runBlockedReason && (
              <span className="hidden text-[11.5px] text-fg-muted lg:block">
                {runBlockedReason}
              </span>
            )}
            {/* Run Phase button — DISABLED until both inputs ready */}
            <Button
              size="sm"
              disabled={runDisabled}
              data-testid="run-phase-button"
              onClick={handleRunPhase}
            >
              {isExecuting ? (
                <Loader2 size={14} strokeWidth={2} className="animate-spin" />
              ) : (
                <Play size={13} strokeWidth={2.5} />
              )}
              {isExecuting ? 'Running…' : isRevised ? 'Run revised phase' : 'Run phase'}
            </Button>
          </div>
        </div>

        {/* Indeterminate: the agents don't report a percentage, so don't
            invent one — a moving sliver says "working" honestly. */}
        {isRunning && (
          <div className="h-[3px] w-full overflow-hidden bg-line" data-testid="execution-progress-bar">
            <div className="h-full w-1/4 animate-indeterminate rounded-full bg-accent-solid" />
          </div>
        )}
      </div>

      {executeError && (
        <Callout tone="fail" icon={TriangleAlert} title="Execution error" data-testid="execute-error">
          {executeError}
        </Callout>
      )}

      {phaseId === 4 && !isRevised && (
        <Callout tone="neutral" icon={Info} data-testid="revised-run-hint">
          To trigger a revised Phase 4 run after correcting design issues, upload a new version of the
          Released Detailed Design Baseline Package below. The button will change to &ldquo;Run revised
          phase&rdquo; and the agent will re-run only the affected deterministic checks against the
          corrected design.
        </Callout>
      )}

      {/* ── The two inputs ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <InputSection
          icon={Globe}
          label="External-source input"
          hint="Comes from outside the programme."
        >
          {externalConfig.behavior === 'UP' ? (
            <UpIntakeCard
              phaseId={phaseId}
              inputRole="external"
              logicalName={externalConfig.logicalName}
              format={externalConfig.format}
              sizeGuidance="1–2 pages (DOCX/PDF) or ≤10 rows (XLSX)"
              isReady={readiness.external?.isReady ?? false}
              readyStatus={readiness.external?.readyStatus ?? 'Awaiting User Input'}
              activeVersion={readiness.external?.activeVersion ?? null}
              validationIssues={readiness.external?.validationIssues ?? []}
              onSuccess={refresh}
            />
          ) : (
            <SiIntakeCard
              phaseId={phaseId}
              inputRole="external"
              logicalName={externalConfig.logicalName}
              systemRepresented={externalConfig.systemRepresented ?? ''}
              sampleFileName={sampleFileName('external')}
              isReady={readiness.external?.isReady ?? false}
              readyStatus={readiness.external?.readyStatus ?? 'Waiting for Synthetic Sample Ingestion'}
              activeVersion={readiness.external?.activeVersion ?? null}
              onSuccess={refresh}
              allowRevise={readiness.external?.isReady === true}
            />
          )}
        </InputSection>

        <InputSection
          icon={FolderClosed}
          label="Internal-artifact input"
          hint="Produced inside the programme."
        >
          {internalConfig.behavior === 'UP' ? (
            <UpIntakeCard
              phaseId={phaseId}
              inputRole="internal"
              logicalName={internalConfig.logicalName}
              format={internalConfig.format}
              sizeGuidance="≤10 rows (XLSX) or 1–2 pages"
              isReady={readiness.internal?.isReady ?? false}
              readyStatus={readiness.internal?.readyStatus ?? 'Awaiting User Input'}
              activeVersion={readiness.internal?.activeVersion ?? null}
              validationIssues={readiness.internal?.validationIssues ?? []}
              onSuccess={refresh}
            />
          ) : (
            <SiIntakeCard
              phaseId={phaseId}
              inputRole="internal"
              logicalName={internalConfig.logicalName}
              systemRepresented={internalConfig.systemRepresented ?? ''}
              sampleFileName={sampleFileName('internal')}
              isReady={readiness.internal?.isReady ?? false}
              readyStatus={readiness.internal?.readyStatus ?? 'Waiting for Synthetic Sample Ingestion'}
              activeVersion={readiness.internal?.activeVersion ?? null}
              onSuccess={refresh}
              allowRevise={readiness.internal?.isReady === true}
            />
          )}
        </InputSection>
      </div>
    </div>
  );
}

/** Labelled group so the two inputs read as a pair, not two loose cards. */
function InputSection({
  icon: Icon,
  label,
  hint,
  children,
}: {
  icon: typeof Globe;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <Icon size={13} strokeWidth={2} className="shrink-0 text-fg-faint" />
        <h3 className="text-[11px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
          {label}
        </h3>
        <p className="truncate text-[11.5px] text-fg-faint">— {hint}</p>
      </div>
      {children}
    </section>
  );
}
