import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';
import { CheckToolResult } from '@/server/tools/toolTypes';

export interface DFMAuditFindingRow {
  findingId: string;
  checkType: string;
  component: string;
  field: string;
  measuredValue: string;
  thresholdValue: string;
  unit: string;
  status: string;
  seeded: string;
  sourceReference: string;
  recommendedAction: string;
}

export async function generateDFMStandardsAudit(rows: DFMAuditFindingRow[], phaseId = 4) {
  const xlsxRows = rows.map(r => ({
    'Finding ID': r.findingId,
    'Check Type': r.checkType,
    'Component/Net': r.component,
    'Field': r.field,
    'Measured': r.measuredValue,
    'Threshold': r.thresholdValue,
    'Unit': r.unit,
    'Status': r.status,
    'Seeded Issue': r.seeded,
    'Source': r.sourceReference,
    'Action': r.recommendedAction,
  }));
  return generateXlsx(xlsxRows, 'phase4-dfm-standards-audit.xlsx', phaseId, 4, 'dfm-standards-agent');
}

export async function generateBOMHealthReport(
  checkResults: CheckToolResult[],
  a3001Closed: boolean,
  isRevised: boolean,
  phaseId = 4
) {
  const passCount = checkResults.filter(c => c.status === 'Pass').length;
  const failCount = checkResults.filter(c => c.status === 'Fail').length;

  const content = `# BOM Health and Manufacturability Report

**Project:** EVINV-POC-001 | **Phase:** 4 — Detailed Design | **Gate:** 4 — CDR
**Run:** ${isRevised ? 'Revised Design Baseline (Post-Correction)' : 'Initial Design Baseline'}

## Deterministic Check Summary (Outside LLM)

| Check Type | Status | Finding(s) |
|---|---|---|
| Cross-Artifact Consistency | ${checkResults.find(c => c.checkType === 'CrossArtifactConsistency')?.status ?? '—'} | ${isRevised ? 'Corrected: C_HV_1 footprint 1206 in both BOM and DFM spec' : 'F4-004: C_HV_1 footprint mismatch 0805 vs 1206'} |
| HV Clearance | ${checkResults.find(c => c.checkType === 'HVClearance')?.status ?? '—'} | ${isRevised ? 'Corrected: VBUS+ to GND_SHIELD 9.1mm ≥ 8.0mm' : 'F4-001: VBUS+ to GND_SHIELD 6.2mm < 8.0mm'} |
| Component Derating | ${checkResults.find(c => c.checkType === 'ComponentDerating')?.status ?? '—'} | ${isRevised ? 'Corrected: C_BULK_3 replaced 900V, margin 52.2% ≥ 50%' : 'F4-002: C_BULK_3 derating 4.4% < 50%'} |
| Test-Point Coverage | ${checkResults.find(c => c.checkType === 'TestPointCoverage')?.status ?? '—'} | ${isRevised ? 'Corrected: TP-IGBT-CASE added to DIAG_TEMP_IGBT_CASE' : 'F4-003: DIAG_TEMP_IGBT_CASE has no test point'} |

**Overall: ${passCount} Pass / ${failCount} Fail**
**Phase 3 A3-001 (Coolant Connector):** ${a3001Closed ? 'VERIFIED CLOSED — CN-COOL-1 reoriented in revised design' : 'OPEN — verification required'}

## CDR Readiness Assessment

${isRevised && failCount === 0 && a3001Closed
    ? '✓ All deterministic checks PASS on revised design. A3-001 verified closed. RECOMMENDATION: Proceed to design freeze (CDR Pass).'
    : `⚠ ${failCount} check(s) failed. A3-001 status: ${a3001Closed ? 'Closed' : 'Open'}. RECOMMENDATION: Upload corrected design before design freeze.`
  }

*All checks run deterministically outside LLM. Source: EVINV-POC-STD-001 (Synthetic POC Standard, not an approved TT or industry standard).
This report is advisory; design freeze decision requires authorized human approval.*`;

  return generateDocx(content, 'phase4-bom-health-manufacturability-report.txt', phaseId, 4, 'dfm-standards-agent');
}
