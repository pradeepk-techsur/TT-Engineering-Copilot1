'use client';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PhaseOutput {
  outputId: string;
  projectId: string;
  phaseId: number;
  outputName: string;
  artifactType: string;        // 'XLSX' | 'DOCX' | 'PDF'
  sizeGuidance: string;
  artifactId: string | null;
  versionRef: string;
  approvalStatus: string;      // 'Pending' | 'AwaitingReview' | 'Approved'
  reviewRequired: boolean;
  approvedBy: string | null;
  approvedAt: string | null;
}

interface OutputsApiResponse {
  phaseId: number;
  phaseState: string | undefined;
  gateState: string | undefined;
  aiRecommendation: object | undefined;
  outputs: PhaseOutput[];
}

interface OutputsPanelProps {
  phaseId: number;
}

export function OutputsPanel({ phaseId }: OutputsPanelProps) {
  const { data } = useSWR<OutputsApiResponse>(
    `/api/phases/${phaseId}/outputs`,
    fetcher,
    { refreshInterval: 3000 }
  );

  if (!data) {
    return (
      <div data-testid="outputs-panel">
        <div data-testid="outputs-loading" className="text-sm text-[var(--color-text-muted)] py-2">
          Loading outputs…
        </div>
      </div>
    );
  }

  const { outputs } = data;

  return (
    <div data-testid="outputs-panel" className="space-y-0">
      {outputs.length === 0 ? (
        <div className="flex items-center justify-between text-sm py-2">
          <span data-testid="outputs-pending" className="text-[var(--color-text-muted)]">
            Pending phase execution
          </span>
        </div>
      ) : (
        outputs.map((output) => (
          <div
            key={output.outputId}
            data-testid="output-row"
            className="flex items-center justify-between text-sm py-2 border-b border-[var(--color-border)]/50 last:border-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate">{output.outputName}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-[var(--color-border)] text-[var(--color-text-muted)] shrink-0">
                {output.artifactType}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-xs text-[var(--color-text-muted)]">{output.approvalStatus}</span>
              {output.artifactId ? (
                <a
                  href={`/api/artifacts/${output.artifactId}/download`}
                  className="text-xs underline text-blue-400 hover:text-blue-300"
                >
                  Download
                </a>
              ) : (
                <span className="text-xs text-[var(--color-text-muted)]">Processing…</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
