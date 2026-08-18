import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface DFMFindingRow {
  findingId: string;
  category: string;
  description: string;
  severity: string;
  affectedComponent: string;
  riskLevel: string;
  recommendedAction: string;
}

export async function generatePDRReadinessSummary(content: string, phaseId = 3) {
  return generateDocx(content, 'phase3-pdr-readiness-summary.txt', phaseId, 3, 'pdr-agent');
}

export async function generateEarlyDFMFindingsRegister(rows: DFMFindingRow[], phaseId = 3) {
  const xlsxRows = rows.map(r => ({
    'Finding ID': r.findingId,
    'Category': r.category,
    'Description': r.description,
    'Severity': r.severity,
    'Affected Component': r.affectedComponent,
    'Risk Level': r.riskLevel,
    'Recommended Action': r.recommendedAction,
  }));
  return generateXlsx(xlsxRows, 'phase3-early-dfm-findings-register.xlsx', phaseId, 3, 'pdr-agent');
}
