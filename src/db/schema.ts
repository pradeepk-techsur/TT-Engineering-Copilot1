import {
  pgTable,
  uuid,
  text,
  smallint,
  boolean,
  integer,
  bigint,
  jsonb,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Helper: timestamp with timezone (Drizzle v0.38 uses timestamp({ withTimezone: true }))
const timestamptz = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

// 1. project_state
export const projectState = pgTable('project_state', {
  stateId: uuid('state_id').primaryKey().defaultRandom(),
  stateVersion: integer('state_version').notNull().default(1),
  projectId: text('project_id').notNull().unique().default('EVINV-POC-001'),
  productName: text('product_name').notNull(),
  projectType: text('project_type').notNull().default('NPI A'),
  projectCategory: text('project_category').notNull().default('Category 1'),
  currentPhase: smallint('current_phase').notNull(),
  currentGate: smallint('current_gate').notNull(),
  currentTechnicalReview: text('current_technical_review'),
  projectStatus: text('project_status').notNull(),
  syntheticDataIndicator: boolean('synthetic_data_indicator').notNull().default(true),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  updatedAt: timestamptz('updated_at').notNull().defaultNow(),
});

// 2. phase_states
export const phaseStates = pgTable('phase_states', {
  phaseStateId: uuid('phase_state_id').primaryKey().defaultRandom(),
  projectId: text('project_id').notNull().references(() => projectState.projectId),
  phaseId: smallint('phase_id').notNull(),
  phaseState: text('phase_state').notNull(),
  gateState: text('gate_state').notNull(),
  aiRecommendation: jsonb('ai_recommendation'),
  compactPhaseSummary: jsonb('compact_phase_summary'),
  executionStartedAt: timestamptz('execution_started_at'),
  executionCompletedAt: timestamptz('execution_completed_at'),
}, (t) => ({
  uniqueProjectPhase: uniqueIndex('phase_states_project_phase_unique').on(t.projectId, t.phaseId),
  idxProject: index('idx_phase_states_project').on(t.projectId),
  idxPhase: index('idx_phase_states_phase').on(t.phaseId),
}));

// 3. phase_inputs
export const phaseInputs = pgTable('phase_inputs', {
  inputId: uuid('input_id').primaryKey().defaultRandom(),
  projectId: text('project_id').notNull().references(() => projectState.projectId),
  phaseId: smallint('phase_id').notNull(),
  inputRole: text('input_role').notNull(), // 'external' | 'internal'
  logicalName: text('logical_name').notNull(),
  intakeBehavior: text('intake_behavior').notNull(), // 'UP' | 'SI'
  systemRepresented: text('system_represented'),
  readinessStatus: text('readiness_status').notNull(),
  validationIssues: jsonb('validation_issues').notNull().default(sql`'[]'::jsonb`),
}, (t) => ({
  uniqueProjectPhaseRole: uniqueIndex('phase_inputs_unique').on(t.projectId, t.phaseId, t.inputRole),
  idxProjectPhase: index('idx_phase_inputs_project_phase').on(t.projectId, t.phaseId),
}));

// 4. input_versions — CRITICAL: partial unique index enforces single active version at DB level
export const inputVersions = pgTable('input_versions', {
  versionId: uuid('version_id').primaryKey().defaultRandom(),
  inputId: uuid('input_id').notNull().references(() => phaseInputs.inputId),
  versionNumber: integer('version_number').notNull(),
  artifactId: uuid('artifact_id'), // references artifact_registry — circular, set manually
  intakeBehavior: text('intake_behavior').notNull(),
  active: boolean('active').notNull().default(false),
  validationResult: jsonb('validation_result').notNull(),
  intakeTimestamp: timestamptz('intake_timestamp').notNull().defaultNow(),
  invalidatedBy: uuid('invalidated_by'),
  rerunTriggered: boolean('rerun_triggered').notNull().default(false),
  affectedScope: text('affected_scope').array().notNull().default(sql`'{}'::text[]`),
}, (t) => ({
  uniqueInputVersion: uniqueIndex('input_versions_input_version_unique').on(t.inputId, t.versionNumber),
  // PARTIAL unique index: only one active version per input at a time
  singleActiveVersion: uniqueIndex('idx_input_versions_single_active').on(t.inputId).where(sql`active = true`),
  idxInput: index('idx_input_versions_input').on(t.inputId),
  idxActive: index('idx_input_versions_active').on(t.inputId, t.active),
}));

// 5. artifact_registry
export const artifactRegistry = pgTable('artifact_registry', {
  artifactId: uuid('artifact_id').primaryKey().defaultRandom(),
  artifactName: text('artifact_name').notNull(),
  artifactType: text('artifact_type').notNull(), // 'XLSX'|'CSV'|'DOCX'|'PDF'
  source: text('source').notNull(), // 'UserUploaded'|'AgentGenerated'|'SyntheticSample'
  intakeBehavior: text('intake_behavior').notNull(),
  version: integer('version').notNull(),
  phaseId: smallint('phase_id').notNull(),
  gateId: smallint('gate_id').notNull(),
  inputVersionRefs: text('input_version_refs').array().notNull().default(sql`'{}'::text[]`),
  timestamp: timestamptz('timestamp').notNull().defaultNow(),
  generatedBy: text('generated_by').notNull(),
  disclaimerPresent: boolean('disclaimer_present').notNull().default(true),
  storageUri: text('storage_uri').notNull(),
  rowCount: integer('row_count'),
  pageCount: integer('page_count'),
  fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
}, (t) => ({
  idxPhase: index('idx_artifact_registry_phase').on(t.phaseId),
  idxType: index('idx_artifact_registry_type').on(t.artifactType),
}));

// 6. phase_outputs
export const phaseOutputs = pgTable('phase_outputs', {
  outputId: uuid('output_id').primaryKey().defaultRandom(),
  projectId: text('project_id').notNull().references(() => projectState.projectId),
  phaseId: smallint('phase_id').notNull(),
  outputName: text('output_name').notNull(),
  artifactType: text('artifact_type').notNull(),
  sizeGuidance: text('size_guidance').notNull(),
  artifactId: uuid('artifact_id').references(() => artifactRegistry.artifactId),
  versionRef: text('version_ref').notNull(),
  approvalStatus: text('approval_status').notNull(), // 'Pending'|'AwaitingReview'|'Approved'|'Rejected'|'ReviewRequired'
  reviewRequired: boolean('review_required').notNull().default(false),
  approvedBy: text('approved_by'),
  approvedAt: timestamptz('approved_at'),
}, (t) => ({
  idxProjectPhase: index('idx_phase_outputs_project_phase').on(t.projectId, t.phaseId),
}));

// 7. check_results
export const checkResults = pgTable('check_results', {
  checkId: uuid('check_id').primaryKey().defaultRandom(),
  checkType: text('check_type').notNull(),
  phaseId: smallint('phase_id').notNull(),
  inputVersionIds: text('input_version_ids').array().notNull(),
  formulaOrMethod: text('formula_or_method').notNull(),
  threshold: text('threshold').notNull(),
  thresholdUnit: text('threshold_unit').notNull(),
  resultValue: text('result_value').notNull(),
  resultUnit: text('result_unit').notNull(),
  status: text('status').notNull(), // 'Pass'|'Fail'|'Warning'
  sourceReference: text('source_reference').notNull(),
  limitation: text('limitation').notNull(),
  itemsChecked: jsonb('items_checked').notNull().default(sql`'[]'::jsonb`),
  invalidated: boolean('invalidated').notNull().default(false),
  supersededBy: uuid('superseded_by'),
  runAt: timestamptz('run_at').notNull().defaultNow(),
}, (t) => ({
  idxPhase: index('idx_check_results_phase').on(t.phaseId),
  idxType: index('idx_check_results_type').on(t.checkType),
  idxStatus: index('idx_check_results_status').on(t.status),
  idxInvalidated: index('idx_check_results_invalidated').on(t.invalidated),
}));

// 8. findings
export const findings = pgTable('findings', {
  findingId: text('finding_id').primaryKey(), // e.g. 'F4-001'
  sourcePhase: smallint('source_phase').notNull(),
  sourceGate: smallint('source_gate').notNull(),
  detectedBy: text('detected_by').notNull(), // 'DeterministicCheck'|'AgentAnalysis'|'HumanReview'
  checkId: uuid('check_id').references(() => checkResults.checkId),
  description: text('description').notNull(),
  severity: text('severity').notNull(), // 'Critical'|'Major'|'Minor'|'Observation'
  status: text('status').notNull(), // 'Open'|'InProgress'|'ClosedPendingVerification'|'VerifiedClosed'
  seeded: boolean('seeded').notNull().default(false),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  closedAt: timestamptz('closed_at'),
}, (t) => ({
  idxPhase: index('idx_findings_phase').on(t.sourcePhase),
  idxSeverity: index('idx_findings_severity').on(t.severity),
  idxStatus: index('idx_findings_status').on(t.status),
  idxSeeded: index('idx_findings_seeded').on(t.seeded),
}));

// 9. actions
export const actions = pgTable('actions', {
  actionId: text('action_id').primaryKey(), // e.g. 'A3-001'
  sourceFindingId: text('source_finding_id').notNull().references(() => findings.findingId),
  sourcePhase: smallint('source_phase').notNull(),
  sourceGate: smallint('source_gate').notNull(),
  description: text('description').notNull(),
  ownerRole: text('owner_role').notNull(),
  blocking: boolean('blocking').notNull().default(false),
  parallel: boolean('parallel').notNull().default(false),
  duePhase: smallint('due_phase').notNull(),
  dueGate: smallint('due_gate').notNull(),
  requiredClosureEvidence: text('required_closure_evidence').notNull(),
  status: text('status').notNull(), // 'Open'|'InProgress'|'ClosedPendingVerification'|'VerifiedClosed'|'Waived'
  humanApprover: text('human_approver'),
  closureEvidenceArtifactId: uuid('closure_evidence_artifact_id').references(() => artifactRegistry.artifactId),
  createdAt: timestamptz('created_at').notNull().defaultNow(),
  closedAt: timestamptz('closed_at'),
}, (t) => ({
  idxFinding: index('idx_actions_source_finding').on(t.sourceFindingId),
  idxBlocking: index('idx_actions_blocking').on(t.blocking),
  idxStatus: index('idx_actions_status').on(t.status),
  idxDueGate: index('idx_actions_due_gate').on(t.dueGate),
}));

// 10. gate_decisions
export const gateDecisions = pgTable('gate_decisions', {
  decisionId: uuid('decision_id').primaryKey().defaultRandom(),
  gateNumber: smallint('gate_number').notNull(),
  phaseName: text('phase_name').notNull(),
  aiRecommendation: jsonb('ai_recommendation').notNull(),
  humanDisposition: text('human_disposition').notNull().default(''),
  reviewerRole: text('reviewer_role').notNull(),
  decision: text('decision').notNull(), // 'Pass'|'Conditional Pass'|'Fail'
  comments: text('comments'),
  timestamp: timestamptz('timestamp').notNull().defaultNow(),
  artifactVersionsReviewed: jsonb('artifact_versions_reviewed').notNull().default(sql`'[]'::jsonb`),
  openConditions: jsonb('open_conditions').notNull().default(sql`'[]'::jsonb`),
  isFinal: boolean('is_final').notNull().default(true),
  supersedes: uuid('supersedes'), // self-reference
}, (t) => ({
  idxGate: index('idx_gate_decisions_gate').on(t.gateNumber),
  idxDecision: index('idx_gate_decisions_decision').on(t.decision),
}));

// 11. audit_history — append-only; UPDATE/DELETE revoked at DB level
export const auditHistory = pgTable('audit_history', {
  auditId: uuid('audit_id').primaryKey().defaultRandom(),
  eventType: text('event_type').notNull(),
  phaseId: smallint('phase_id'),
  description: text('description').notNull(),
  actor: text('actor').notNull(),
  relatedIds: text('related_ids').array().notNull().default(sql`'{}'::text[]`),
  payload: jsonb('payload').notNull().default(sql`'{}'::jsonb`),
  timestamp: timestamptz('timestamp').notNull().defaultNow(),
}, (t) => ({
  idxEventType: index('idx_audit_history_event_type').on(t.eventType),
  idxPhase: index('idx_audit_history_phase').on(t.phaseId),
  idxTimestamp: index('idx_audit_history_timestamp').on(t.timestamp),
}));
