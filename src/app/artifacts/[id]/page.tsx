import { AppShell } from '@/components/layout/AppShell';
import { ArtifactViewer } from '@/components/artifacts/ArtifactViewer';
import { PageHeader } from '@/components/ui/page-header';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArtifactViewerPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell>
      <div className="max-w-4xl">
        <PageHeader
          title="Artifact Viewer"
          subtitle="Version history and provenance for a generated artifact."
        />
        <ArtifactViewer artifactId={id} />
      </div>
    </AppShell>
  );
}
