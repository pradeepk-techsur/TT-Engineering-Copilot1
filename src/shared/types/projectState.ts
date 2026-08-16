export interface CompactPhaseSummary {
  phaseId: number;
  phaseName: string;
  outcome: 'Pass' | 'Conditional Pass' | 'Fail' | 'Pending';
  keyFindings: string[];       // max 3 bullet points
  openActions: string[];       // action IDs only — no full text
  approvedOutputs: string[];   // artifact names only — no full content
  approvedAt?: string;         // ISO 8601
}

export interface AgentContext {
  projectId: string;
  phaseId: number;
  phaseName: string;
  technicalReview: string | null;
  // ONLY the active inputs for THIS phase — no prior phase inputs
  activeExternalInput: { logicalName: string; behavior: string; systemRepresented: string | null } | null;
  activeInternalInput: { logicalName: string; behavior: string; systemRepresented: string | null } | null;
  // Compact summaries of approved upstream phases — NOT full documents
  upstreamSummaries: CompactPhaseSummary[];
  // Open actions affecting this phase
  openBlockingActions: { actionId: string; description: string; sourcePhase: number }[];
  // Selected checklist items (phases 0, 1, 3, 4 only — max 5 items)
  applicableChecklistItems: string[];
  // Selected applicable rules from EVINV-POC-STD-001 (max 3 rules)
  applicableStandardsRules: string[];
  // Token budget hint for this phase's agent
  maxOutputTokens: number;
}
