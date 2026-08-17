import { AppShell } from '@/components/layout/AppShell';
import { InputReadinessPanel } from '@/components/intake/InputReadinessPanel';
import { VersionHistoryTable } from '@/components/intake/VersionHistoryTable';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function IntakePanelPage({ params }: Props) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  if (!config) return null;

  return (
    <AppShell phaseId={phaseId} gateId={phaseId}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Input Intake and Validation</h1>
          <Link
            href={`/phase/${phaseId}`}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            ← Back to Phase Workspace
          </Link>
        </div>

        <p className="text-sm text-[var(--color-text-muted)]">
          Phase {phaseId}: {config.phaseName}
        </p>

        {/* Input Readiness Panel */}
        <InputReadinessPanel phaseId={phaseId} />

        {/* Version History */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardHeader>
              <CardTitle className="text-sm">External Input — Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <VersionHistoryTable phaseId={phaseId} inputRole="external" />
            </CardContent>
          </Card>
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardHeader>
              <CardTitle className="text-sm">Internal Input — Version History</CardTitle>
            </CardHeader>
            <CardContent>
              <VersionHistoryTable phaseId={phaseId} inputRole="internal" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
