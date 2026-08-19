import { generateXlsx } from '@/server/artifacts/artifactGenerator';

export interface MRLScorecardRow {
  mrlElement: string;
  description: string;
  evidenceRef: string;
  currentLevel: string;
  targetLevel: string;
  gap: string;
  status: string;
}

export interface PPAPFAIRow {
  deliverableId: string;
  ppapElement: string;
  customerCriterion: string;
  requiredEvidence: string;
  currentStatus: string;
  responsibleRole: string;
  priority: string;
}

export async function generateMRLScorecard(rows: MRLScorecardRow[], phaseId = 6) {
  const xlsxRows = rows.map(r => ({
    'MRL Element': r.mrlElement,
    'Description': r.description,
    'Evidence': r.evidenceRef,
    'Current MRL': r.currentLevel,
    'Target MRL': r.targetLevel,
    'Gap': r.gap,
    'Status': r.status,
  }));
  return generateXlsx(xlsxRows, 'phase6-mrl-scorecard.xlsx', phaseId, 6, 'mrl-ppap-agent');
}

export async function generatePPAPFAIIndex(rows: PPAPFAIRow[], phaseId = 6) {
  const xlsxRows = rows.map(r => ({
    'Deliverable ID': r.deliverableId,
    'PPAP Element': r.ppapElement,
    'Customer Criterion': r.customerCriterion,
    'Required Evidence': r.requiredEvidence,
    'Status': r.currentStatus,
    'Responsible': r.responsibleRole,
    'Priority': r.priority,
  }));
  return generateXlsx(xlsxRows, 'phase6-ppap-fai-readiness-index.xlsx', phaseId, 6, 'mrl-ppap-agent');
}
