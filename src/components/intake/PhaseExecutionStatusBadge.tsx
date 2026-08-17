import { Badge } from '@/components/ui/badge';

const STATUS_STYLES: Record<string, string> = {
  'Waiting for User Input':               'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Waiting for Synthetic Sample Ingestion': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'Ready to Run':                          'bg-green-500/10 text-green-400 border-green-500/20',
  'Processing':                            'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Awaiting Human Decision':               'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Complete':                              'bg-green-500/10 text-green-400 border-green-500/20',
};

export function PhaseExecutionStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={`text-xs border ${STATUS_STYLES[status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
      data-testid="phase-execution-status"
    >
      {status}
    </Badge>
  );
}
