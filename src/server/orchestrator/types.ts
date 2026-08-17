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
