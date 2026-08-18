import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface LessonsLearnedRow {
  lessonId: string; category: string; phase: string; description: string;
  rootCause: string; correctiveAction: string; applicableFuturePhases: string; status: string;
}

export async function generateLessonsLearnedRegister(rows: LessonsLearnedRow[], phaseId = 7) {
  const xlsxRows = rows.map(r => ({
    'Lesson ID': r.lessonId, 'Category': r.category, 'Phase': r.phase,
    'Description': r.description, 'Root Cause': r.rootCause,
    'Corrective Action': r.correctiveAction, 'Applicable Future': r.applicableFuturePhases,
    'Status': r.status,
  }));
  return generateXlsx(xlsxRows, 'phase7-lessons-learned-register.xlsx', phaseId, 7, 'lessons-learned-agent');
}

export async function generateTransferReport(content: string, phaseId = 7) {
  return generateDocx(content, 'phase7-transfer-completeness-report.txt', phaseId, 7, 'lessons-learned-agent');
}
