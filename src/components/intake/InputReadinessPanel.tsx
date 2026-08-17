'use client';
import useSWR from 'swr';
import { UpIntakeCard } from './UpIntakeCard';
import { SiIntakeCard } from './SiIntakeCard';
import { PhaseExecutionStatusBadge } from './PhaseExecutionStatusBadge';
import { Button } from '@/components/ui/button';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface InputReadinessPanelProps {
  phaseId: number;
}

export function InputReadinessPanel({ phaseId }: InputReadinessPanelProps) {
  const { data: readiness, mutate: mutateReadiness } = useSWR(
    `/api/phases/${phaseId}/inputs`, fetcher, { refreshInterval: 3000 }
  );
  const { data: execStatus, mutate: mutateStatus } = useSWR(
    `/api/phases/${phaseId}/execution-status`, fetcher, { refreshInterval: 3000 }
  );

  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  const refresh = () => {
    mutateReadiness();
    mutateStatus();
  };

  if (!config || !readiness) {
    return <div className="text-sm text-[var(--color-text-muted)]">Loading inputs...</div>;
  }

  const externalConfig = config.externalIntake;
  const internalConfig = config.internalIntake;
  const bothReady = execStatus?.bothReady === true;
  const status: string = execStatus?.status ?? 'Waiting for User Input';

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
      {/* Phase Execution Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-muted)]">Phase Execution:</span>
          <PhaseExecutionStatusBadge status={status} />
        </div>

        {/* Run Phase button — DISABLED until both inputs ready */}
        <Button
          size="sm"
          disabled={!bothReady || status === 'Processing' || status === 'Complete'}
          data-testid="run-phase-button"
          onClick={() => {/* Phase execution triggered by phase agent — not implemented in this plan */}}
        >
          Run Phase
        </Button>
      </div>

      {/* External Input Card */}
      <div>
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          External-Source Input
        </p>
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
          />
        )}
      </div>

      {/* Internal Input Card */}
      <div>
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide mb-2">
          Internal-Artifact Input
        </p>
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
          />
        )}
      </div>
    </div>
  );
}
