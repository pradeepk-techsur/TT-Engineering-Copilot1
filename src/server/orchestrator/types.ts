export type GateOutcome = 'Pass' | 'Conditional Pass' | 'Fail';

export type PhaseState =
  | 'Pending' | 'AwaitingInputs' | 'Running'
  | 'AwaitingGate' | 'GatePassed' | 'GateConditional'
  | 'GateFailed' | 'Cancelled' | 'Paused';

export type GateState = 'Locked' | 'Open' | 'Decided';

export interface GateDecisionPayload {
  gateNumber: number;
  decision: GateOutcome;
  reviewerRole: string;
  comments?: string;
  openConditions?: unknown[];
  /**
   * Required when the human decision differs from the AI recommendation.
   * Enforced server-side, not only in the form — an override with no stated
   * reason is the one thing an audit trail cannot reconstruct later.
   */
  humanRationale?: string;
  /** Artifact versions the reviewer had in front of them. */
  artifactVersionsReviewed?: string[];
}

export interface OrchestratorState {
  projectId: string;
  currentPhase: number;
  currentGate: number;
  phaseStates: Record<number, { phaseState: PhaseState; gateState: GateState }>;
  projectStatus: 'Active' | 'Blocked' | 'Cancelled' | 'Closed';
}

// Known AI actor identifiers — gate-decide endpoint rejects these
export const AI_ACTOR_BLOCKLIST = new Set([
  'ai', 'AI', 'claude', 'Claude', 'system', 'System',
  'assistant', 'Assistant', 'copilot', 'Copilot',
  'automated', 'Automated', 'bot', 'Bot',
]);
