'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { Button } from '@/components/ui/button';
import { ButtonAnchor } from '@/components/ui/button-link';
import { Callout } from '@/components/ui/callout';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Database, Eye, Download, CheckCircle2, Loader2, PlugZap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { readinessStyle, styleFor } from '@/lib/status';

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
  allowRevise?: boolean;
}

export function SiIntakeCard({
  phaseId, inputRole, logicalName, systemRepresented, sampleFileName,
  isReady, readyStatus, activeVersion, onSuccess, allowRevise
}: SiIntakeCardProps) {
  const [ingesting, setIngesting] = useState(false);
  const [ingestingRevised, setIngestingRevised] = useState(false);

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
        toast.error('Sample was not ingested', {
          description: data.message ?? 'The server rejected the ingest. Please try again.',
        });
      } else {
        toast.success(`${logicalName} ingested`, {
          description: `Synthetic System Input from ${systemRepresented}. Version active.`,
        });
        onSuccess();
      }
    } catch {
      toast.error('Sample was not ingested', {
        description: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setIngesting(false);
    }
  };

  const handleIngestRevised = async () => {
    setIngestingRevised(true);
    try {
      const res = await fetch(
        `/api/phases/${phaseId}/inputs/${inputRole}/ingest-revised`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confirm_viewed: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error('Revised sample was not ingested', {
          description: data.message ?? 'The server rejected the ingest. Please try again.',
        });
      } else {
        toast.success(`${logicalName} — revised sample ingested`, {
          description: 'A new input version is now active.',
        });
        onSuccess();
      }
    } catch {
      toast.error('Revised sample was not ingested', {
        description: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setIngestingRevised(false);
    }
  };

  const status = styleFor(readinessStyle, readyStatus);

  return (
    <Card data-testid={`si-intake-${inputRole}`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle>{logicalName}</CardTitle>
            {/* CORRECT label per FRD: "Simulated Connector" — prohibited: system link labels */}
            <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-fg-muted">
              <Database size={11} strokeWidth={2} className="shrink-0 text-synthetic" />
              System Represented:
              <span className="text-synthetic">{systemRepresented}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusPill tone="synthetic" size="sm">Simulated Connector</StatusPill>
            <StatusPillFor status={status} size="sm" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Simulated Intake notice — must state there is no live connection */}
        <Callout tone="synthetic" icon={PlugZap}>
          Simulated Connector — No live connection to {systemRepresented}. This POC uses a Preloaded Synthetic Sample.
        </Callout>

        {activeVersion && (
          <p className="text-[11.5px] text-fg-muted">
            Version <span className="font-mono text-fg-2">{activeVersion}</span> active
          </p>
        )}

        {/* CORRECT label: "Preloaded Synthetic Sample" */}
        <div className="rounded-lg border border-line bg-raised/60 p-3">
          <p className="text-[10.5px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
            Preloaded Synthetic Sample
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open(`/samples/${sampleFileName}`, '_blank');
              }}
              data-testid={`view-sample-${inputRole}`}
            >
              <Eye size={13} strokeWidth={2} />
              View
            </Button>
            <ButtonAnchor
              size="sm"
              href={`/samples/${sampleFileName}`}
              download
              data-testid={`download-sample-${inputRole}`}
            >
              <Download size={13} strokeWidth={2} />
              Download
            </ButtonAnchor>

            {/* Ingest Sample — requires explicit user action (AlertDialog confirmation).
                Was a full-bleed near-white slab; now it's the section's primary
                action, sized like one. */}
            {!isReady && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button size="sm" disabled={ingesting} className="ml-auto" data-testid={`ingest-sample-${inputRole}`}>
                      {ingesting ? (
                        <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                      ) : (
                        <Database size={13} strokeWidth={2} />
                      )}
                      {ingesting ? 'Ingesting…' : 'Ingest sample'}
                    </Button>
                  }
                />
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
          </div>
        </div>

        {isReady && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-[12.5px] text-pass">
              <CheckCircle2 size={13} strokeWidth={2} className="mt-px shrink-0" />
              <span>Synthetic System Input Ready — ingested from {systemRepresented}.</span>
            </div>
            {allowRevise && (
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={ingestingRevised}
                      data-testid={`ingest-revised-sample-${inputRole}`}
                    >
                      {ingestingRevised ? (
                        <Loader2 size={13} strokeWidth={2} className="animate-spin" />
                      ) : (
                        <RefreshCw size={13} strokeWidth={2} />
                      )}
                      {ingestingRevised ? 'Ingesting…' : 'Ingest revised sample'}
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ingest Revised Synthetic Sample</AlertDialogTitle>
                    <AlertDialogDescription>
                      You are about to ingest a revised version of the Preloaded Synthetic Sample representing{' '}
                      <strong>{systemRepresented}</strong>. This will create a new input version and invalidate affected results.
                      No live connection to {systemRepresented} is being used.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleIngestRevised}
                      data-testid={`confirm-ingest-revised-${inputRole}`}
                    >
                      Confirm Ingest Revised Sample
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
