// Stub types for intake handlers — full implementation in 02-01
// These types will be replaced by the 02-01 plan implementation

export interface IntakeEvent {
  eventType: string;
  phaseId: number;
  inputRole: string;
  actor: string;
  description: string;
  relatedIds: string[];
  payload: Record<string, unknown>;
}

export interface ValidationResult {
  passed: boolean;
  issues: Array<{ code: string; message: string }>;
}

export type PhaseExecutionStatus =
  | 'Waiting for User Input'
  | 'Inputs Ready'
  | 'INPUTS_NOT_READY';

export interface InputReadinessState {
  inputId: string;
  inputRole: 'external' | 'internal';
  readinessStatus: string;
  versionCount: number;
}
