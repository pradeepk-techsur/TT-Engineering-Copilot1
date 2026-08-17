import { AgentContext } from '@/shared/types/projectState';

export interface AgentResult {
  phaseId: number;
  outputs: GeneratedOutput[];
  findings: AgentFinding[];
  aiRecommendation: AIRecommendation;
  contextUsed: Partial<AgentContext>;  // what context was actually sent to LLM
  tokensUsed?: number;
  durationMs?: number;
}

export interface GeneratedOutput {
  outputName: string;
  artifactType: 'XLSX' | 'DOCX' | 'PDF';
  artifactId: string;
  storageUri: string;
  rowCount?: number;
  pageCount?: number;
  disclaimerPresent: boolean;
}

export interface AgentFinding {
  findingId: string;       // e.g. 'F2-001'
  sourcePhase: number;
  sourceGate: number;
  detectedBy: 'DeterministicCheck' | 'AgentAnalysis' | 'HumanReview';
  checkId?: string;
  description: string;
  severity: 'Critical' | 'Major' | 'Minor' | 'Observation';
  seeded: boolean;
}

export interface AIRecommendation {
  recommendedOutcome: 'Pass' | 'Conditional Pass' | 'Fail';
  rationale: string;
  findingsCited: string[];   // finding IDs
  checksCited: string[];     // check IDs
  advisoryLabel: string;     // Always: "Advisory Only — Human Decision Required"
}
