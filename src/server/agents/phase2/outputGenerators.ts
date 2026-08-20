import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface RTMRow {
  reqId: string; requirementText: string; source: string;
  interface: string; subsystem: string; acceptanceCriterion: string;
  verificationMethod: string; traceToCustomer: string; status: string;
}

export interface TestabilityReportData {
  totalRequirements: number; testableCount: number; nonTestableCount: number;
  nonTestableList: { reqId: string; issue: string }[];
  overallStatus: 'Pass' | 'Fail'; correctionRequired: boolean;
}

export async function generateRTM(rows: RTMRow[], phaseId = 2) {
  const xlsxRows = rows.map(r => ({
    'Req ID': r.reqId, 'Requirement Text': r.requirementText,
    'Source': r.source, 'Interface': r.interface, 'Subsystem': r.subsystem,
    'Acceptance Criterion': r.acceptanceCriterion, 'Verification Method': r.verificationMethod,
    'Customer Trace': r.traceToCustomer, 'Status': r.status,
  }));
  return generateXlsx(xlsxRows, 'phase2-requirements-traceability-matrix.xlsx', phaseId, 2, 'requirements-agent');
}

export async function generateTestabilityReport(data: TestabilityReportData, phaseId = 2) {
  const content = `# Requirements Quality and Testability Report

**Project:** EVINV-POC-001 | **Phase:** 2 — Requirements Development | **Gate:** 2

## Testability Check Results (DETERMINISTIC — Outside LLM)

| Metric | Value |
|---|---|
| Total Requirements Checked | ${data.totalRequirements} |
| Testable | ${data.testableCount} |
| Non-Testable (requires action) | ${data.nonTestableCount} |
| Overall Check Status | **${data.overallStatus}** |

${data.nonTestableList.length > 0 ? `## Non-Testable Requirements (Action Required)

${data.nonTestableList.map(r => `- **${r.reqId}:** ${r.issue}`).join('\n')}

## Corrective Action Required
${data.correctionRequired ? 'One or more requirements lack measurable acceptance criteria. Upload revised requirements package after correction.' : 'None.'}` : '## All Requirements Testable ✓\nAll checked requirements have measurable acceptance criteria.'}

---
*Testability check run by RequirementTestability deterministic tool — not LLM inference.
Source: EVINV-POC-STD-001 §1.1. This report is advisory; human reviewer confirms requirements baseline.*`;

  return generateDocx(content, 'phase2-testability-report.txt', phaseId, 2, 'requirements-agent');
}
