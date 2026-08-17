'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Database, Eye, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SiIntakeCardProps {
  phaseId: number;
  inputRole: 'external' | 'internal';
  logicalName: string;
  systemRepresented: string;
  sampleFileName: string;
  isReady: boolean;
  readyStatus: string;
  activeVersion: number | null;
  onSuccess: () => void;
}

export function SiIntakeCard({
  phaseId, inputRole, logicalName, systemRepresented, sampleFileName,
  isReady, readyStatus, activeVersion, onSuccess
}: SiIntakeCardProps) {
  const [ingesting, setIngesting] = useState(false);

  const handleIngest = async () => {
    setIngesting(true);
    try {
      const res = await fetch(
        `/api/phases/${phaseId}/inputs/${inputRole}/ingest`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // confirm_viewed must be explicitly true — prevents auto-ingest
          body: JSON.stringify({ confirm_viewed: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message ?? 'Ingestion failed.');
      } else {
        toast.success(`${logicalName} (Synthetic System Input) ingested from ${systemRepresented}. Version active.`);
        onSuccess();
      }
    } catch {
      toast.error('Ingestion failed. Please try again.');
    } finally {
      setIngesting(false);
    }
  };

  return (
    <Card
      className="bg-[var(--color-surface)] border-[var(--color-border)]"
      data-testid={`si-intake-${inputRole}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{logicalName}</CardTitle>
          <div className="flex items-center gap-2">
            {/* CORRECT label per FRD: "Simulated Connector" — prohibited: system link labels */}
            <Badge className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Simulated Connector
            </Badge>
            {isReady ? (
              <Badge className="text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                Ready ✓
              </Badge>
            ) : (
              <Badge className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Not Ready
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* System represented — CORRECT label */}
        <div className="flex items-center gap-2 text-xs">
          <Database size={12} className="text-violet-400" />
          <span className="text-[var(--color-text-muted)]">System Represented:</span>
          <span className="text-violet-400">{systemRepresented}</span>
        </div>

        {/* Simulated Intake notice */}
        <div className="rounded-md bg-violet-500/5 border border-violet-500/20 px-3 py-2 text-xs text-violet-400">
          {/* CORRECT: state no live connection */}
          Simulated Connector — No live connection to {systemRepresented}. This POC uses a Preloaded Synthetic Sample.
        </div>

        {/* Status */}
        <div className="text-xs text-[var(--color-text-muted)]">
          Status: <span className="text-[var(--color-text-primary)]">{readyStatus}</span>
          {activeVersion && <span className="ml-2">· Version {activeVersion} active</span>}
        </div>

        {/* Synthetic disclaimer */}
        <div className="rounded-md bg-violet-500/5 border border-violet-500/20 px-3 py-2 text-xs text-violet-400">
          Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.
        </div>

        {/* CORRECT label: "Preloaded Synthetic Sample" */}
        <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
          Preloaded Synthetic Sample
        </div>

        {/* View and Download controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => {
              window.open(`/samples/${sampleFileName}`, '_blank');
            }}
            data-testid={`view-sample-${inputRole}`}
          >
            <Eye size={12} className="mr-1" />
            View
          </Button>
          <a
            href={`/samples/${sampleFileName}`}
            download
            data-testid={`download-sample-${inputRole}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all border-border bg-background hover:bg-muted hover:text-foreground h-7 gap-1 px-2.5 text-[0.8rem] text-xs"
          >
            <Download size={12} className="mr-1" />
            Download
          </a>
        </div>

        {/* Ingest Sample — requires explicit user action (AlertDialog confirmation) */}
        {!isReady && (
          <AlertDialog>
            <AlertDialogTrigger
              className="w-full h-7 gap-1 rounded-lg px-2.5 text-[0.8rem] text-xs bg-primary text-primary-foreground hover:bg-primary/80 inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50"
              disabled={ingesting}
              data-testid={`ingest-sample-${inputRole}`}
            >
              {ingesting ? 'Ingesting...' : 'Ingest Sample'}
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ingest Synthetic Sample</AlertDialogTitle>
                <AlertDialogDescription>
                  You are about to ingest the Preloaded Synthetic Sample representing{' '}
                  <strong>{systemRepresented}</strong>. This is synthetic data for POC demonstration only.
                  No live connection to {systemRepresented} is being used.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleIngest}
                  data-testid={`confirm-ingest-${inputRole}`}
                >
                  Confirm Ingest Sample
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isReady && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle size={12} />
            <span>Synthetic System Input Ready — ingested from {systemRepresented}.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
