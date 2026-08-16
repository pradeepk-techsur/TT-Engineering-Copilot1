// OrchestratorCommand — discriminated union for all lifecycle commands
// This module defines the command shapes dispatched to GatedStateMachine

import type { GateDecisionPayload } from './types';

export type OrchestratorCommand =
  | { type: 'gate-decide'; payload: GateDecisionPayload }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'cancel' }
  | { type: 'retry' }
  | { type: 'run-to-gate'; targetGate: number };
