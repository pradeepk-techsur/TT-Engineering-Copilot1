import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface ClosureRow {
  recordId: string; type: string; description: string; finalStatus: string;
  retentionRequirement: string; disposalRequirement: string; responsibleRole: string; closureStatus: string;
}

export async function generateEOLDecisionPack(content: string, phaseId = 9) {
  return generateDocx(content, 'phase9-eol-last-time-buy-decision-pack.txt', phaseId, 9, 'eol-memory-agent');
}

export async function generateClosureAndMemoryRecord(rows: ClosureRow[], phaseId = 9) {
  const xlsxRows = rows.map(r => ({
    'Record ID': r.recordId, 'Type': r.type, 'Description': r.description,
    'Final Status': r.finalStatus, 'Retention': r.retentionRequirement,
    'Disposal': r.disposalRequirement, 'Responsible': r.responsibleRole, 'Closure': r.closureStatus,
  }));
  return generateXlsx(xlsxRows, 'phase9-project-closure-institutional-memory.xlsx', phaseId, 9, 'eol-memory-agent');
}
