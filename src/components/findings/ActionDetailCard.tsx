import { ShieldAlert, User, Target, FileCheck2 } from 'lucide-react';
import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { findingStatusStyle, styleFor } from '@/lib/status';
import { cn } from '@/lib/utils';

interface Action {
  actionId: string;
  description: string;
  ownerRole: string;
  blocking: boolean;
  dueGate: number;
  status: string;
  requiredClosureEvidence: string;
  sourcePhase: number;
}

export function ActionDetailCard({ action }: { action: Action }) {
  const isOpen = action.status !== 'VerifiedClosed' && action.status !== 'Waived';
  const blocking = action.blocking && isOpen;
  const status = styleFor(findingStatusStyle, action.status);

  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 shadow-sm transition-colors',
        blocking
          ? 'border-fail-line bg-fail-soft'
          : 'border-line bg-surface hover:border-line-strong'
      )}
      data-testid={`action-card-${action.actionId}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-[12px] font-semibold text-fg">{action.actionId}</span>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {blocking && (
            <StatusPill tone="fail" size="sm" className="gap-1">
              <ShieldAlert size={10} strokeWidth={2.5} />
              Blocking
            </StatusPill>
          )}
          <StatusPillFor status={status} size="sm" />
        </div>
      </div>

      <p className="mt-2 text-[12.5px] leading-relaxed text-fg-2">{action.description}</p>

      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2.5 text-[11.5px]">
        <div className="flex items-center gap-1.5">
          <User size={11} strokeWidth={2} className="shrink-0 text-fg-faint" />
          <dt className="text-fg-muted">Owner</dt>
          <dd className="min-w-0 truncate text-fg">{action.ownerRole}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Target size={11} strokeWidth={2} className="shrink-0 text-fg-faint" />
          <dt className="text-fg-muted">Due</dt>
          <dd className="text-fg">Gate {action.dueGate}</dd>
        </div>
      </dl>

      <p className="mt-2 flex items-start gap-1.5 text-[11.5px]">
        <FileCheck2 size={11} strokeWidth={2} className="mt-0.5 shrink-0 text-fg-faint" />
        <span className="text-fg-muted">
          Closure evidence required:{' '}
          <span className="text-fg-2">{action.requiredClosureEvidence}</span>
        </span>
      </p>
    </div>
  );
}
