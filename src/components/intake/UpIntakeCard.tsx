'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { Upload, CheckCircle2, AlertCircle, Loader2, FileUp } from 'lucide-react';
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

      const endpoint = isReady
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
            <StatusPill tone="info" size="sm">User-Provided File</StatusPill>
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

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-[1.5px] border-dashed px-4 py-7 text-center transition-colors',
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
              'flex size-9 items-center justify-center rounded-lg border border-line bg-surface',
              isDragActive ? 'text-accent-solid' : 'text-fg-muted'
            )}
          >
            {uploading ? (
              <Loader2 size={16} strokeWidth={2} className="animate-spin" />
            ) : isDragActive ? (
              <FileUp size={16} strokeWidth={2} />
            ) : (
              <Upload size={16} strokeWidth={2} />
            )}
          </span>
          <span className="text-[12.5px] font-medium text-fg">
            {uploading ? 'Uploading…' : isDragActive ? 'Drop file here' : (
              isReady
                ? `Upload Revised Version of ${logicalName}`
                : `Upload ${logicalName}`
            )}
          </span>
          {/* CRITICAL: correct label per FRD — Upload Revised Version, never replacement */}
          {!uploading && !isDragActive && (
            <span className="text-[11.5px] text-fg-muted">
              Drag a file here, or click to browse · {format}
            </span>
          )}
        </div>

        {isReady && (
          <div className="flex items-start gap-2 text-[12.5px] text-pass">
            <CheckCircle2 size={13} strokeWidth={2} className="mt-px shrink-0" />
            <span>{logicalName} received and validated.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
