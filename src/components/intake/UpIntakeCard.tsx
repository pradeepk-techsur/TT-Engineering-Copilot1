'use client';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
        toast.error(`Validation failed: ${issues.map((i: { code: string }) => i.code).join(', ')}`);
      } else {
        toast.success(`${logicalName} received and validated. Version ${data.versionId ? 'active' : '1'} active.`);
        onSuccess();
      }
    } catch {
      setLocalErrors([{ code: 'UPLOAD_ERROR', message: 'Upload failed. Please try again.' }]);
    } finally {
      setUploading(false);
    }
  }, [phaseId, inputRole, isReady, logicalName, onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <Card className="bg-[var(--color-surface)] border-[var(--color-border)]" data-testid={`up-intake-${inputRole}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{logicalName}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
              User-Provided File
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
        {/* Status */}
        <div className="text-xs text-[var(--color-text-muted)]">
          Status: <span className="text-[var(--color-text-primary)]">{readyStatus}</span>
          {activeVersion && <span className="ml-2">· Version {activeVersion} active</span>}
        </div>

        {/* Format and size guidance */}
        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
          <div>Format: <span className="text-[var(--color-text-primary)]">{format}</span></div>
          <div>Size: <span className="text-[var(--color-text-primary)]">{sizeGuidance}</span></div>
        </div>

        {/* Validation errors */}
        {allErrors.length > 0 && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 space-y-1">
            {allErrors.map((issue, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                <span><code className="font-mono">{issue.code}</code>: {issue.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragActive
              ? 'border-blue-500/50 bg-blue-500/5'
              : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
            uploading && 'opacity-50 cursor-not-allowed'
          )}
          data-testid={`dropzone-${inputRole}`}
        >
          <input {...getInputProps()} data-testid={`file-input-${inputRole}`} />
          <Upload size={20} className="mx-auto mb-2 text-[var(--color-text-muted)]" />
          <p className="text-xs text-[var(--color-text-muted)]">
            {uploading ? 'Uploading...' : isDragActive ? 'Drop file here' : (
              isReady
                ? `Upload Revised Version of ${logicalName}`
                : `Upload ${logicalName}`
            )}
          </p>
          {/* CRITICAL: correct label per FRD — Upload Revised Version, never replacement */}
        </div>

        {isReady && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckCircle size={12} />
            <span>{logicalName} received and validated.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
