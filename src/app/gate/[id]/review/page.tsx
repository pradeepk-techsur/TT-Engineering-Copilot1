import { Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { GateReviewWorkspace } from '@/components/gate/GateReviewWorkspace';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ButtonLink } from '@/components/ui/button-link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GateReviewPage({ params }: Props) {
  const { id } = await params;
  const gateId = parseInt(id);

  if (isNaN(gateId) || gateId < 0 || gateId > 9) {
    return (
      <AppShell>
        <EmptyState
          icon={Search}
          title="Invalid gate number"
          description="This project has gates G0 through G9."
          action={<ButtonLink href="/lifecycle">View lifecycle</ButtonLink>}
        />
      </AppShell>
    );
  }

  return (
    <AppShell phaseId={gateId} gateId={gateId}>
      <PageHeader
        title={`Gate ${gateId} Review Workspace`}
        subtitle="Human gate decision required. The AI recommendation is advisory."
      />
      {/* Gate Review Workspace built dynamically from ProjectState */}
      <GateReviewWorkspace gateId={gateId} />
    </AppShell>
  );
}
