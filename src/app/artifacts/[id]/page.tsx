import { AppShell } from '@/components/layout/AppShell';
import { ArtifactViewer } from '@/components/artifacts/ArtifactViewer';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ArtifactViewerPage({ params }: Props) {
  const { id } = await params;
  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Artifact Viewer</h1>
        <p className="text-sm text-[var(--color-text-muted)]">Version history and provenance</p>
        <ArtifactViewer artifactId={id} />
      </div>
    </AppShell>
  );
}
