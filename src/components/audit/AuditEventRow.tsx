import { Badge } from '@/components/ui/badge';

interface IntakeEventData {
  phase_id: number;
  logical_input: string;
  intake_behavior: string;
  user_action: string;
  system_represented: string | null;
  status: string;
  source_artifact_id: string;
  version: number;
  validation_result: { passed?: boolean; issues?: unknown[] };
  timestamp: string;
}

interface AuditEvent {
  auditId: string;
  eventType: string;
  phaseId: number;
  description: string;
  actor: string;
  timestamp: string;
  intakeEvent: IntakeEventData | null;
}

const BEHAVIOR_STYLES: Record<string, string> = {
  'UP': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'SI': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const STATUS_STYLES: Record<string, string> = {
  'User Input Ready':          'bg-green-500/10 text-green-400 border-green-500/20',
  'Synthetic System Input Ready': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

export function AuditEventRow({ event }: { event: AuditEvent }) {
  const ie = event.intakeEvent;

  if (!ie) {
    // Non-intake audit event (gate decision, phase state change, etc.)
    return (
      <tr className="border-b border-[var(--color-border)]/50 hover:bg-white/5">
        <td className="py-2 px-2 text-xs font-mono text-[var(--color-text-muted)]">
          Phase {event.phaseId ?? '—'}
        </td>
        <td className="py-2 px-2 text-xs" colSpan={7}>{event.description}</td>
        <td className="py-2 px-2 text-xs text-[var(--color-text-muted)]">
          {new Date(event.timestamp).toLocaleString()}
        </td>
      </tr>
    );
  }

  // IntakeEvent — display all 9 FRD F02 fields
  return (
    <tr className="border-b border-[var(--color-border)]/50 hover:bg-white/5" data-testid={`audit-event-${event.auditId}`}>
      <td className="py-2 px-2 text-xs font-mono">Phase {ie.phase_id}</td>
      <td className="py-2 px-2 text-xs max-w-[140px] truncate" title={ie.logical_input}>{ie.logical_input}</td>
      <td className="py-2 px-2">
        <Badge className={`text-xs border ${BEHAVIOR_STYLES[ie.intake_behavior] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
          {ie.intake_behavior}
        </Badge>
      </td>
      <td className="py-2 px-2 text-xs text-[var(--color-text-muted)]">
        {ie.user_action}
      </td>
      <td className="py-2 px-2 text-xs text-[var(--color-text-muted)] max-w-[120px] truncate">
        {ie.system_represented ?? '—'}
      </td>
      <td className="py-2 px-2">
        <Badge className={`text-xs border ${STATUS_STYLES[ie.status] ?? 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
          {ie.status}
        </Badge>
      </td>
      <td className="py-2 px-2 text-xs font-mono text-[var(--color-text-muted)] truncate max-w-[80px]">
        {String(ie.source_artifact_id).slice(0, 8)}…
      </td>
      <td className="py-2 px-2 text-xs font-mono">v{ie.version}</td>
      <td className="py-2 px-2 text-xs text-[var(--color-text-muted)]">
        {new Date(ie.timestamp).toLocaleString()}
      </td>
    </tr>
  );
}
