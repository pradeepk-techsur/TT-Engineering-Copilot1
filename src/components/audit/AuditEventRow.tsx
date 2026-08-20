import { StatusPill, StatusPillFor } from '@/components/ui/status-pill';
import { TR, TD } from '@/components/ui/data-table';
import { Truncate, MonoId } from '@/components/ui/truncate';
import { behaviorStyle, readinessStyle, gateOutcomeStyle, styleFor } from '@/lib/status';
import { formatDateTime, isoOf } from '@/lib/format';

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

/** Both halves of a gate decision, preserved in the log. */
interface GateDecisionData {
  aiRecommendation: string | null;
  aiRationale: string | null;
  riskScore: number | null;
  riskLevel: string | null;
  decision: string;
  humanRationale: string;
  divergedFromAi: boolean;
  keyStrengths: string[];
  keyRisks: string[];
  nextSteps: string[];
}

interface AuditEvent {
  auditId: string;
  eventType: string;
  phaseId: number;
  description: string;
  actor: string;
  timestamp: string;
  intakeEvent: IntakeEventData | null;
  gateDecision?: GateDecisionData | null;
}

/** `file_uploaded` → `File uploaded` — raw event keys aren't user copy. */
function humanAction(action: string): string {
  if (!action) return '—';
  const spaced = action.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function AuditEventRow({ event }: { event: AuditEvent }) {
  const ie = event.intakeEvent;

  if (!ie) {
    // Non-intake audit event (gate decision, phase state change, etc.)
    const gd = event.gateDecision;
    return (
      <TR interactive data-testid={`audit-event-${event.auditId}`}>
        <TD className="font-mono text-[11.5px] whitespace-nowrap text-fg-muted">
          P{event.phaseId ?? '—'}
        </TD>
        <TD colSpan={7} className="text-[12.5px] text-fg">
          {event.description}
          {/* A gate decision keeps the AI recommendation next to the human
              decision, and the reason whenever the two differ. */}
          {gd && (
            <div
              className="mt-1.5 flex flex-wrap items-center gap-1.5"
              data-testid="audit-gate-decision"
            >
              {gd.aiRecommendation && (
                <StatusPill tone="neutral" size="sm" dot={false}>
                  AI: {gd.aiRecommendation}
                </StatusPill>
              )}
              <StatusPillFor status={styleFor(gateOutcomeStyle, gd.decision)} size="sm" />
              {typeof gd.riskScore === 'number' && gd.riskLevel && (
                <StatusPill tone="neutral" size="sm" dot={false}>
                  Risk {gd.riskScore}/100, {gd.riskLevel}
                </StatusPill>
              )}
              {gd.divergedFromAi && (
                <StatusPill tone="warn" size="sm" dot>
                  Human overrode
                </StatusPill>
              )}
              {gd.humanRationale && (
                <span className="text-[11.5px] text-fg-muted italic">
                  “{gd.humanRationale}”
                </span>
              )}
            </div>
          )}
        </TD>
        <TD className="whitespace-nowrap text-[11.5px] text-fg-muted">
          <time dateTime={isoOf(event.timestamp)}>{formatDateTime(event.timestamp)}</time>
        </TD>
      </TR>
    );
  }

  // IntakeEvent — display all 9 FRD F02 fields
  return (
    <TR interactive data-testid={`audit-event-${event.auditId}`}>
      <TD className="font-mono text-[11.5px] whitespace-nowrap text-fg-muted">
        P{ie.phase_id}
      </TD>
      <TD className="max-w-[200px]">
        <Truncate className="text-[12.5px] font-medium text-fg">{ie.logical_input}</Truncate>
      </TD>
      <TD>
        <StatusPillFor
          status={styleFor(behaviorStyle, ie.intake_behavior)}
          size="sm"
          dot={false}
        />
      </TD>
      <TD className="whitespace-nowrap text-[12.5px]">{humanAction(ie.user_action)}</TD>
      <TD className="max-w-[160px]">
        {ie.system_represented ? (
          <Truncate className="text-[12.5px] text-fg-muted">{ie.system_represented}</Truncate>
        ) : (
          <span className="text-fg-faint">—</span>
        )}
      </TD>
      <TD>
        <StatusPillFor status={styleFor(readinessStyle, ie.status)} size="sm" />
      </TD>
      {/* Was hard-sliced to 8 chars + "…" with the value unrecoverable.
          Now it truncates by width and keeps the full id on hover. */}
      <TD className="max-w-[110px]">
        <MonoId>{ie.source_artifact_id}</MonoId>
      </TD>
      <TD className="font-mono text-[11.5px] whitespace-nowrap">v{ie.version}</TD>
      <TD className="whitespace-nowrap text-[11.5px] text-fg-muted">
        <time dateTime={isoOf(ie.timestamp)}>{formatDateTime(ie.timestamp)}</time>
      </TD>
    </TR>
  );
}
