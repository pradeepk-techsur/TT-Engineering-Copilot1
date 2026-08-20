import { ClipboardCheck } from 'lucide-react';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { DataTable, THead, TH, TBody, TR, TD } from '@/components/ui/data-table';
import { severityStyle, findingStatusStyle, styleFor } from '@/lib/status';

interface Finding {
  findingId: string; severity: string; description: string;
  status: string; seeded: boolean;
}

export function FindingsSummaryTable({ findings }: { findings: Finding[] }) {
  if (!findings.length) {
    return (
      <div data-testid="findings-summary-table">
        <EmptyState
          size="sm"
          icon={ClipboardCheck}
          title="No findings for this phase"
          description="Nothing was raised against this phase's inputs or outputs."
        />
      </div>
    );
  }

  return (
    <DataTable minWidth={520} data-testid="findings-summary-table">
      <THead>
        <tr>
          <TH className="w-[88px]">ID</TH>
          <TH className="w-[110px]">Severity</TH>
          <TH>Description</TH>
          <TH className="w-[130px]">Status</TH>
        </tr>
      </THead>
      <TBody>
        {findings.map(f => (
          <TR key={f.findingId} interactive>
            <TD className="font-mono text-[11.5px] text-fg-muted">{f.findingId}</TD>
            <TD>
              <StatusPillFor status={styleFor(severityStyle, f.severity)} size="sm" />
            </TD>
            {/* Full text, wrapped — descriptions used to be clipped mid-word
                with no way to read the rest. */}
            <TD className="max-w-[420px] text-[12.5px] leading-relaxed whitespace-normal">
              {f.description}
              {f.seeded && (
                <StatusPill
                  tone="synthetic"
                  size="sm"
                  className="ml-2 align-middle"
                  data-testid="seeded-badge"
                  title="Seeded synthetic finding — part of the POC scenario"
                >
                  Seeded
                </StatusPill>
              )}
            </TD>
            <TD>
              <StatusPillFor status={styleFor(findingStatusStyle, f.status)} size="sm" />
            </TD>
          </TR>
        ))}
      </TBody>
    </DataTable>
  );
}
