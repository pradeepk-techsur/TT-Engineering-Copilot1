'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { Upload, AlertCircle, Loader2, FileUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { readinessStyle, styleFor } from '@/lib/status';

interface UpIntakeCardProps {
  phaseId: number;
  inputRole: 'external' | 'internal';
  logicalName: string;
  format: string;
  sizeGuidance: string;
  isReady: boolean;
  readyStatus: string;
  activeVersion: number | null;
  validationIssues: Array<{ code: string; message: string; field?: string }>;
  onSuccess: () => void;
}

export function UpIntakeCard({
  phaseId, inputRole, logicalName, format, sizeGuidance,
  isReady, readyStatus, activeVersion, validationIssues, onSuccess
}: UpIntakeCardProps) {
  // A version number is only written once an artifact has been stored, so this
  // is the one honest test for "there is something here to revise".
  const hasStoredVersion = activeVersion !== null && activeVersion >= 1;
  const [uploading, setUploading] = useState(false);
  const [localErrors, setLocalErrors] = useState<typeof validationIssues>([]);

  const allErrors = [...validationIssues, ...localErrors];

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setUploading(true);
    setLocalErrors([]);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = hasStoredVersion
        ? `/api/phases/${phaseId}/inputs/${inputRole}/upload-revised`
        : `/api/phases/${phaseId}/inputs/${inputRole}/upload`;

      const res = await fetch(endpoint, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        const issues = data.validationResult?.issues ?? [{ code: data.error_code, message: data.message }];
        setLocalErrors(issues);
        toast.error('File failed validation', {
          description: `${issues.map((i: { code: string }) => i.code).join(', ')} — see the details on the card.`,
        });
      } else {
        toast.success(`${logicalName} received`, {
          description: `Validated. Version ${data.versionId ? 'active' : '1'} active.`,
        });
        onSuccess();
      }
    } catch {
      setLocalErrors([{ code: 'UPLOAD_ERROR', message: 'Upload failed. Please try again.' }]);
      toast.error('Upload failed', {
        description: 'Could not reach the server. Check your connection and try again.',
      });
    } finally {
      setUploading(false);
    }
  }, [phaseId, inputRole, isReady, logicalName, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
  });

  const status = styleFor(readinessStyle, readyStatus);

  return (
    <Card data-testid={`up-intake-${inputRole}`}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle>{logicalName}</CardTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-fg-muted">
              <span>
                Format <span className="font-mono text-fg-2">{format}</span>
              </span>
              <span aria-hidden className="text-fg-faint">·</span>
              <span>
                Size <span className="text-fg-2">{sizeGuidance}</span>
              </span>
              {activeVersion && (
                <>
                  <span aria-hidden className="text-fg-faint">·</span>
                  <span>
                    Version <span className="font-mono text-fg-2">{activeVersion}</span> active
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <StatusPill tone="neutral" size="sm">User-Provided File</StatusPill>
            <StatusPillFor status={status} size="sm" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Validation errors */}
        {allErrors.length > 0 && (
          <div className="space-y-1.5 rounded-lg border border-fail-line bg-fail-soft p-3">
            {allErrors.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-[12px] text-fail">
                <AlertCircle size={12} strokeWidth={2} className="mt-0.5 shrink-0" />
                <span>
                  <code className="font-mono font-semibold">{issue.code}</code>
                  {': '}
                  {issue.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone.
            Its size tracks how much it matters. While the input is still
            awaited, uploading it IS the job, so the target is a tall panel.
            Once the input is in, a revision is a rare afterthought — but the
            zone stayed the same 150px empty box, which made "upload a revised
            version" the largest thing on a finished phase's screen and pushed
            the outputs and the gate below the fold. Settled inputs get one
            slim row instead. The control is never removed: it stays the same
            dropzone element, and the acceptance tests require it visible. */}
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer rounded-lg border-[1.5px] border-dashed transition-colors',
            isReady
              ? 'items-center gap-2.5 px-3 py-2 text-left'
              : 'flex-col items-center gap-2 px-4 py-7 text-center',
            isDragActive
              ? 'border-accent-solid bg-accent-soft'
              : 'border-line-strong bg-raised/40 hover:border-accent-line hover:bg-hover',
            uploading && 'cursor-not-allowed opacity-60'
          )}
          data-testid={`dropzone-${inputRole}`}
        >
          <input {...getInputProps()} data-testid={`file-input-${inputRole}`} />
          <span
            className={cn(
              'flex shrink-0 items-center justify-center rounded-lg border border-line bg-surface',
              isReady ? 'size-7' : 'size-9',
              isDragActive ? 'text-accent-solid' : 'text-fg-muted'
            )}
          >
            {uploading ? (
              <Loader2 size={isReady ? 13 : 16} strokeWidth={2} className="animate-spin" />
            ) : isDragActive ? (
              <FileUp size={isReady ? 13 : 16} strokeWidth={2} />
            ) : (
              <Upload size={isReady ? 13 : 16} strokeWidth={2} />
            )}
          </span>
          <span
            className={cn(
              'min-w-0 font-medium text-fg',
              isReady ? 'truncate text-[12px]' : 'text-[12.5px]'
            )}
          >
            {uploading ? 'Uploading…' : isDragActive ? 'Drop file here' : (
              /* "Revised" only once a version exists to revise. This followed
                 isReady, which is a status label — so a phase marked ready with
                 nothing stored invited the user to revise a file they had never
                 uploaded. */
              hasStoredVersion
                ? `Upload Revised Version of ${logicalName}`
                : `Upload ${logicalName}`
            )}
          </span>
          {/* CRITICAL: correct label per FRD — Upload Revised Version, never replacement */}
          {!uploading && !isDragActive && (
            <span
              className={cn(
                'shrink-0 text-[11.5px] text-fg-muted',
                isReady && 'ml-auto hidden sm:block'
              )}
            >
              Drag a file here, or click to browse
            </span>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
