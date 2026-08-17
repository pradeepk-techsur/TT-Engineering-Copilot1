export type IntakeBehavior = 'UP' | 'SI';
export type InputRole = 'external' | 'internal';

export type PhaseExecutionStatus =
  | 'Waiting for User Input'
  | 'Waiting for Synthetic Sample Ingestion'
  | 'Ready to Run'
  | 'Processing'
  | 'Awaiting Human Decision'
  | 'Complete';

export type InputReadyStatus =
  | 'Awaiting User Input'
  | 'Validation In Progress'
  | 'User Input Ready'
  | 'Waiting for Synthetic Sample Ingestion'
  | 'Ingesting'
  | 'Synthetic System Input Ready'
  | 'Revised Sample Available; Ingest Required';

export interface ValidationIssue {
  code: string;
  message: string;
  field?: string;
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface IntakeEvent {
  event_id: string;
  event_type: 'USER_FILE_UPLOAD' | 'SIMULATED_INTAKE';
  phase_id: number;
  logical_input: string;
  intake_behavior: IntakeBehavior;
  user_action: 'file_uploaded' | 'sample_ingested' | 'revised_version_uploaded' | 'revised_sample_ingested';
  system_represented: string | null;
  status: 'User Input Ready' | 'Synthetic System Input Ready';
  source_artifact_id: string;
  normalized_artifact_id: string;
  version: number;
  validation_result: ValidationResult;
  timestamp: string;
  operator_id: string;
}

export interface InputReadinessState {
  phaseId: number;
  inputRole: InputRole;
  logicalName: string;
  intakeBehavior: IntakeBehavior;
  systemRepresented: string | null;
  format: string;
  sizeGuidance: string;
  activeArtifactId: string | null;
  activeVersion: number | null;
  validationStatus: 'Pass' | 'Fail' | 'Pending';
  validationIssues: ValidationIssue[];
  requiredUserAction: string;
  isReady: boolean;
  readyStatus: InputReadyStatus;
}

export const PROHIBITED_LABELS = [
  'Connected to ',
  'Retrieved from ',
  'Live ',
  'Real-time ',
  'replacement input',
] as const;
