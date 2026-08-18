import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface VVMatrixRow {
  reqId: string;
  requirementText: string;
  traceability: string;
  dfmeaRisk: string;
  testId: string;
  testMethod: string;
  measuredResult: string;
  unit: string;
  acceptanceCriterion: string;
  testConfig: string;
  status: string;
  evidenceRef: string;
}

export async function generateVVMatrix(rows: VVMatrixRow[], phaseId = 5) {
  const xlsxRows = rows.map(r => ({
    'Req ID': r.reqId,
    'Requirement': r.requirementText,
    'Trace': r.traceability,
    'DFMEA Risk': r.dfmeaRisk,
    'Test ID': r.testId,
    'Method': r.testMethod,
    'Result': r.measuredResult,
    'Unit': r.unit,
    'Criterion': r.acceptanceCriterion,
    'Status': r.status,
    'Evidence': r.evidenceRef,
  }));
  return generateXlsx(xlsxRows, 'phase5-vv-matrix.xlsx', phaseId, 5, 'vv-agent');
}

export async function generateGate5Summary(content: string, phaseId = 5) {
  return generateDocx(content, 'phase5-gate5-vv-summary.txt', phaseId, 5, 'vv-agent');
}
