import { History, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { InputReadinessPanel } from '@/components/intake/InputReadinessPanel';
import { VersionHistoryTable } from '@/components/intake/VersionHistoryTable';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, SectionLabel } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button-link';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IntakePanelPage({ params }: Props) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  // Was `return null` — a blank white screen with no explanation.
  if (!config) {
    return (
      <AppShell>
        <EmptyState
          icon={Search}
          title="Phase not found"
          description="This project runs Phase 0 through Phase 9."
          action={<ButtonLink href="/lifecycle">View lifecycle</ButtonLink>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell phaseId={phaseId} gateId={phaseId}>
      <PageHeader
        title="Input Intake and Validation"
        subtitle="Every input is versioned. Both must be ready before the phase can run."
        actions={
          // Label kept verbatim — the acceptance tests click this exact string,
          // and the arrow is part of it, so no icon is added here.
          <ButtonLink size="sm" href={`/phase/${phaseId}`}>
            ← Back to Phase Workspace
          </ButtonLink>
        }
      />

      <div className="space-y-6">
        <InputReadinessPanel phaseId={phaseId} />

        <div id="version-history">
          <SectionLabel>Version History</SectionLabel>
          <p className="mb-3 text-[12.5px] text-fg-muted">
            Every upload or ingest action creates a new version. Prior versions are
            preserved for comparison and never overwritten.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="py-0">
              <CardHeader className="border-b border-line py-3">
                <CardTitle className="flex items-center gap-2">
                  <History size={14} strokeWidth={2} className="text-fg-muted" />
                  External Input — Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <VersionHistoryTable phaseId={phaseId} inputRole="external" />
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardHeader className="border-b border-line py-3">
                <CardTitle className="flex items-center gap-2">
                  <History size={14} strokeWidth={2} className="text-fg-muted" />
                  Internal Input — Version History
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <VersionHistoryTable phaseId={phaseId} inputRole="internal" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
