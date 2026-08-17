import { db } from '@/db';
import { projectState, phaseStates, gateDecisions, auditHistory } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { GateDecisionPayload, GateOutcome, OrchestratorState, AI_ACTOR_BLOCKLIST, PhaseState, GateState } from './types';

export class GatedStateMachine {
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /** Retrieve current orchestrator state from DB */
  async getState(): Promise<OrchestratorState> {
    const [project] = await db.select().from(projectState)
      .where(eq(projectState.projectId, this.projectId));
    if (!project) throw new Error(`Project ${this.projectId} not found`);

    const phases = await db.select().from(phaseStates)
      .where(eq(phaseStates.projectId, this.projectId));

    const phaseStateMap: Record<number, { phaseState: PhaseState; gateState: GateState }> = {};
    for (const p of phases) {
      phaseStateMap[p.phaseId as number] = {
        phaseState: p.phaseState as PhaseState,
        gateState: p.gateState as GateState,
      };
    }

    return {
      projectId: this.projectId,
      currentPhase: project.currentPhase as number,
      currentGate: project.currentGate as number,
      phaseStates: phaseStateMap,
      projectStatus: project.projectStatus as 'Active' | 'Blocked' | 'Cancelled' | 'Closed',
    };
  }

  /**
   * Record a human gate decision. ENFORCES:
   * 1. reviewerRole must NOT be in AI_ACTOR_BLOCKLIST
   * 2. decision must be exactly 'Pass' | 'Conditional Pass' | 'Fail'
   * 3. Gate must be in 'AwaitingGate' state
   */
  async recordGateDecision(payload: GateDecisionPayload): Promise<void> {
    // ENFORCEMENT: reject AI actor
    if (AI_ACTOR_BLOCKLIST.has(payload.reviewerRole)) {
      throw new Error(
        `GATE_AI_PROHIBITED: Reviewer role "${payload.reviewerRole}" is in the AI actor blocklist. ` +
        `Gate decisions require a human reviewer.`
      );
    }

    // ENFORCEMENT: reject invalid gate outcome
    const validOutcomes: GateOutcome[] = ['Pass', 'Conditional Pass', 'Fail'];
    if (!validOutcomes.includes(payload.decision)) {
      throw new Error(
        `INVALID_GATE_OUTCOME: "${payload.decision}" is not a valid gate outcome. ` +
        `Must be one of: Pass, Conditional Pass, Fail`
      );
    }

    // ENFORCEMENT: check gate is open (phase is AwaitingGate)
    const [phase] = await db.select().from(phaseStates)
      .where(and(
        eq(phaseStates.projectId, this.projectId),
        eq(phaseStates.phaseId, payload.gateNumber as unknown as number),
      ));

    if (!phase || phase.phaseState !== 'AwaitingGate') {
      throw new Error(
        `GATE_NOT_OPEN: Gate ${payload.gateNumber} is not in AwaitingGate state. ` +
        `Current state: ${phase?.phaseState ?? 'not found'}`
      );
    }

    // Record gate decision (immutable)
    await db.insert(gateDecisions).values({
      gateNumber: payload.gateNumber as unknown as number,
      phaseName: `Phase ${payload.gateNumber}`,
      aiRecommendation: {},
      humanDisposition: payload.comments ?? '',
      reviewerRole: payload.reviewerRole,
      decision: payload.decision,
      comments: payload.comments,
      artifactVersionsReviewed: [],
      openConditions: payload.openConditions ?? [],
      isFinal: true,
    });

    // Update phase state based on outcome
    const newPhaseState = payload.decision === 'Pass' ? 'GatePassed'
      : payload.decision === 'Conditional Pass' ? 'GateConditional'
      : 'GateFailed';

    await db.update(phaseStates)
      .set({ phaseState: newPhaseState, gateState: 'Decided' })
      .where(and(
        eq(phaseStates.projectId, this.projectId),
        eq(phaseStates.phaseId, payload.gateNumber as unknown as number),
      ));

    // Advance to next phase if Pass or Conditional Pass
    if (payload.decision !== 'Fail' && payload.gateNumber < 9) {
      const nextPhase = payload.gateNumber + 1;
      await db.update(projectState)
        .set({
          currentPhase: nextPhase as unknown as number,
          currentGate: nextPhase as unknown as number,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(projectState.projectId, this.projectId));

      await db.update(phaseStates)
        .set({ phaseState: 'AwaitingInputs', gateState: 'Locked' })
        .where(and(
          eq(phaseStates.projectId, this.projectId),
          eq(phaseStates.phaseId, nextPhase as unknown as number),
        ));
    } else if (payload.decision !== 'Fail' && payload.gateNumber === 9) {
      // Gate 9 Pass — project closed
      await db.update(projectState)
        .set({ projectStatus: 'Closed', updatedAt: new Date().toISOString() })
        .where(eq(projectState.projectId, this.projectId));
    }

    // Append to audit_history
    await db.insert(auditHistory).values({
      eventType: 'GateDecision',
      phaseId: payload.gateNumber as unknown as number,
      description: `Gate ${payload.gateNumber} decided: ${payload.decision} by ${payload.reviewerRole}`,
      actor: payload.reviewerRole,
      relatedIds: [],
      payload: { gateNumber: payload.gateNumber, decision: payload.decision },
    });
  }

  async pause(projectId?: string): Promise<void> {
    const id = projectId ?? this.projectId;
    const state = await this.getState();
    if (!['Running', 'AwaitingGate'].includes(
      state.phaseStates[state.currentPhase]?.phaseState ?? ''
    )) return;

    await db.update(phaseStates)
      .set({ phaseState: 'Paused' })
      .where(and(
        eq(phaseStates.projectId, id),
        eq(phaseStates.phaseId, state.currentPhase as unknown as number),
      ));
    await this._audit('PhaseStateChange', state.currentPhase, 'Phase paused', 'system', {});
  }

  async resume(projectId?: string): Promise<void> {
    const id = projectId ?? this.projectId;
    const state = await this.getState();
    const current = state.phaseStates[state.currentPhase];
    if (current?.phaseState !== 'Paused') return;

    await db.update(phaseStates)
      .set({ phaseState: 'AwaitingInputs' })
      .where(and(
        eq(phaseStates.projectId, id),
        eq(phaseStates.phaseId, state.currentPhase as unknown as number),
      ));
    await this._audit('PhaseStateChange', state.currentPhase, 'Phase resumed', 'system', {});
  }

  async cancel(projectId?: string): Promise<void> {
    const id = projectId ?? this.projectId;
    const state = await this.getState();
    await db.update(phaseStates)
      .set({ phaseState: 'Cancelled' })
      .where(and(
        eq(phaseStates.projectId, id),
        eq(phaseStates.phaseId, state.currentPhase as unknown as number),
      ));
    await db.update(projectState)
      .set({ projectStatus: 'Cancelled', updatedAt: new Date().toISOString() })
      .where(eq(projectState.projectId, id));
    await this._audit('Cancellation', state.currentPhase, 'Phase cancelled', 'system', {});
  }

  async retry(projectId?: string): Promise<void> {
    const id = projectId ?? this.projectId;
    const state = await this.getState();
    const current = state.phaseStates[state.currentPhase];
    if (!['GateFailed', 'Cancelled'].includes(current?.phaseState ?? '')) return;

    await db.update(phaseStates)
      .set({ phaseState: 'AwaitingInputs', gateState: 'Locked' })
      .where(and(
        eq(phaseStates.projectId, id),
        eq(phaseStates.phaseId, state.currentPhase as unknown as number),
      ));
    await this._audit('PhaseStateChange', state.currentPhase, 'Phase retried', 'system', {});
  }

  /** Run to a target gate, stopping before it to require human decision */
  async runToGate(targetGate: number): Promise<void> {
    const state = await this.getState();
    if (targetGate < state.currentGate || targetGate > 9) {
      throw new Error(`INVALID_TARGET_GATE: ${targetGate}`);
    }
    // Records the run-to-gate intent in audit history
    // Actual execution is async — the runner reads this to stop at the target
    await this._audit('PhaseStateChange', state.currentPhase,
      `Run-to-gate ${targetGate} initiated`, 'system', { targetGate });
  }

  private async _audit(
    eventType: string, phaseId: number,
    description: string, actor: string, payload: Record<string, unknown>
  ): Promise<void> {
    await db.insert(auditHistory).values({
      eventType: eventType as string,
      phaseId: phaseId as unknown as number,
      description,
      actor,
      relatedIds: [],
      payload,
    });
  }
}
