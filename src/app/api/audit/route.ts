import { NextRequest, NextResponse } from 'next/server';
import { MOCK_AUDIT_EVENTS } from '@/lib/mockData';

export async function GET(req: NextRequest) {
  const eventType = req.nextUrl.searchParams.get('eventType');
  const phaseId = req.nextUrl.searchParams.get('phaseId');

  try {
    const { db } = await import('@/db');
    const { auditHistory } = await import('@/db/schema');
    const { eq, desc, and } = await import('drizzle-orm');

    let results;
    if (eventType && phaseId) {
      results = await db.select().from(auditHistory)
        .where(and(eq(auditHistory.eventType, eventType), eq(auditHistory.phaseId, parseInt(phaseId) as any)))
        .orderBy(desc(auditHistory.timestamp));
    } else if (eventType) {
      results = await db.select().from(auditHistory)
        .where(eq(auditHistory.eventType, eventType))
        .orderBy(desc(auditHistory.timestamp));
    } else if (phaseId) {
      results = await db.select().from(auditHistory)
        .where(eq(auditHistory.phaseId, parseInt(phaseId) as any))
        .orderBy(desc(auditHistory.timestamp));
    } else {
      results = await db.select().from(auditHistory).orderBy(desc(auditHistory.timestamp));
    }

    const events = results.map((r: any) => {
      const payload = r.payload as Record<string, unknown>;
      return {
        auditId: r.auditId, eventType: r.eventType, phaseId: r.phaseId,
        description: r.description, actor: r.actor, timestamp: r.timestamp,
        intakeEvent: r.eventType === 'IntakeEvent' ? {
          phase_id: payload.phase_id ?? r.phaseId,
          logical_input: payload.logical_input ?? '',
          intake_behavior: payload.intake_behavior ?? '',
          user_action: payload.user_action ?? '',
          system_represented: payload.system_represented ?? null,
          status: payload.status ?? '',
          source_artifact_id: payload.source_artifact_id ?? '',
          version: payload.version ?? 1,
          validation_result: payload.validation_result ?? {},
          timestamp: payload.timestamp ?? r.timestamp,
        } : null,
      };
    });
    return NextResponse.json({ total: events.length, events, filters: { eventType, phaseId } });
  } catch {
    // Fallback to mock audit data
    let events = MOCK_AUDIT_EVENTS;
    if (eventType) events = events.filter(e => e.eventType === eventType);
    if (phaseId) events = events.filter(e => e.phaseId === parseInt(phaseId));
    return NextResponse.json({ total: events.length, events, filters: { eventType, phaseId } });
  }
}
