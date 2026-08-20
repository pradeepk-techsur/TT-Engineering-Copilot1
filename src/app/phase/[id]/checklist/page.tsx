import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { TechnicalChecklistWorkspace } from '@/components/checklist/TechnicalChecklistWorkspace';
import { PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';
import { PageHeader } from '@/components/ui/page-header';
import { ButtonLink } from '@/components/ui/button-link';

export const dynamicParams = false;

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TechnicalChecklistPage({ params }: Props) {
  const { id } = await params;
  const phaseId = parseInt(id, 10);
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];

  return (
    <AppShell phaseId={phaseId}>
      <PageHeader
        title="Technical Checklist Workspace"
        subtitle={`Phase ${phaseId}: ${config?.phaseName ?? `Phase ${phaseId}`} — each item needs named evidence before the review can close.`}
        actions={
          <ButtonLink size="sm" href={`/phase/${phaseId}`}>
            <ArrowLeft size={14} strokeWidth={2} />
            Phase workspace
          </ButtonLink>
        }
      />
      <TechnicalChecklistWorkspace phaseId={phaseId} />
    </AppShell>
  );
}

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
}
