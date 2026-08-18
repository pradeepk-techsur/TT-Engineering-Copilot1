import { Badge } from '@/components/ui/badge';

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
  return (
    <div
      className={`rounded-md border p-3 space-y-2 ${action.blocking && isOpen ? 'border-red-500/30 bg-red-500/5' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}
      data-testid={`action-card-${action.actionId}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium">{action.actionId}</span>
        <div className="flex gap-1.5">
          {action.blocking && isOpen && (
            <Badge className="text-xs bg-red-500/10 text-red-400 border border-red-500/20">Blocking</Badge>
          )}
          <Badge className={`text-xs border ${action.status === 'VerifiedClosed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
            {action.status}
          </Badge>
        </div>
      </div>
      <p className="text-xs text-[var(--color-text-primary)]">{action.description}</p>
      <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
        <div>Owner: <span className="text-[var(--color-text-primary)]">{action.ownerRole}</span></div>
        <div>Due: <span className="text-[var(--color-text-primary)]">Gate {action.dueGate}</span></div>
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">
        Closure evidence required: <span className="text-[var(--color-text-primary)]">{action.requiredClosureEvidence}</span>
      </div>
    </div>
  );
}
