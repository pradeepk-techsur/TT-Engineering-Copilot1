import { db } from '@/db';
import { auditHistory } from '@/db/schema';
import { IntakeEvent } from './types';
import { randomUUID } from 'crypto';

export async function writeIntakeEvent(event: Omit<IntakeEvent, 'event_id'>): Promise<string> {
  const eventId = randomUUID();
  const fullEvent: IntakeEvent = { ...event, event_id: eventId };

  // Write to audit_history table (append-only)
  await db.insert(auditHistory).values({
    eventType: 'IntakeEvent',
    phaseId: event.phase_id as any,
    description: `${event.event_type}: ${event.logical_input} — ${event.user_action}`,
    actor: event.operator_id,
    relatedIds: [event.source_artifact_id, event.normalized_artifact_id],
    payload: fullEvent as Record<string, unknown>,
  });

  return eventId;
}

/** Scan text for prohibited labels — throw if found */
export function assertNoProhibitedLabels(text: string): void {
  const PROHIBITED = [
    'Connected to ',
    'Retrieved from ',
    'Live ',
    'Real-time ',
    'replacement input',
  ];
  for (const label of PROHIBITED) {
    if (text.includes(label)) {
      throw new Error(`PROHIBITED_LABEL_DETECTED: "${label}" found in generated content.`);
    }
  }
}
