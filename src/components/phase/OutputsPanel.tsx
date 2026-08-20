'use client';
import useSWR from 'swr';
import { Download, FileText, Loader2, TriangleAlert } from 'lucide-react';
import { StatusPillFor } from '@/components/ui/status-pill';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Callout } from '@/components/ui/callout';
import { Truncate } from '@/components/ui/truncate';
import { approvalStyle, styleFor } from '@/lib/status';

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
  const { data, error } = useSWR<OutputsApiResponse>(
    `/api/phases/${phaseId}/outputs`,
    fetcher,
    { refreshInterval: 3000, keepPreviousData: true }
  );

  if (!data && error) {
    return (
      <div data-testid="outputs-panel">
        <Callout
          tone="fail"
          icon={TriangleAlert}
          data-testid="outputs-error"
          title="Could not load outputs"
        >
          The outputs service did not respond. It will retry automatically.
        </Callout>
      </div>
    );
  }

  if (!data) {
    return (
      <div data-testid="outputs-panel">
        {/* Skeleton rather than a "Loading outputs…" line, so the card keeps
            its height and nothing jumps when data lands. */}
        <div data-testid="outputs-loading" className="-mx-4">
          <SkeletonRows rows={2} />
        </div>
      </div>
    );
  }

  const { outputs } = data;

  return (
    <div data-testid="outputs-panel">
      {outputs.length === 0 ? (
        // NOTE: the testid must sit on a *visible* wrapper — e2e asserts visibility
        <div data-testid="outputs-pending">
          <EmptyState
            size="sm"
            icon={FileText}
            title="Pending phase execution"
            description="Run the phase to generate its artifacts for approval."
          />
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {outputs.map((output) => {
            const status = styleFor(approvalStyle, output.approvalStatus);
            return (
              <li
                key={output.outputId}
                data-testid="output-row"
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-raised text-fg-muted">
                  <FileText size={13} strokeWidth={2} />
                </span>

                <div className="min-w-0 flex-1">
                  <Truncate className="text-[13px] font-medium text-fg">
                    {output.outputName}
                  </Truncate>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-fg-muted">
                    <span className="font-mono uppercase">{output.artifactType}</span>
                    {output.versionRef && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="font-mono">{output.versionRef}</span>
                      </>
                    )}
                  </div>
                </div>

                <StatusPillFor status={status} size="sm" />

                {output.artifactId ? (
                  <a
                    href={`/api/artifacts/${output.artifactId}/download`}
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line-strong px-2.5 py-1.5 text-[12px] font-medium text-fg-2 transition-colors hover:border-accent-line hover:bg-hover hover:text-accent-solid"
                  >
                    <Download size={13} strokeWidth={2} />
                    Download
                  </a>
                ) : (
                  <span className="flex shrink-0 items-center gap-1.5 text-[11.5px] text-fg-muted">
                    <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                    Generating
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
