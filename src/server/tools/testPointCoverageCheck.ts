/**
 * Test-Point Coverage Check — DETERMINISTIC, zero LLM calls.
 * Verifies each diagnostic net has ≥1 accessible test point.
 * Detects SI-03c: DIAG_TEMP_IGBT_CASE has no test point.
 */

import { db } from '@/db';
import { checkResults, findings } from '@/db/schema';
import { randomUUID } from 'crypto';
import { EVINV_POC_STD_001, POC_STD_LABEL } from './evinvPocStd001';
import { CheckToolResult, TestPointItem } from './toolTypes';

const INITIAL_NETLIST: TestPointItem[] = [
  { net_name: 'DIAG_TEMP_IGBT_CASE', test_point_ids: [],              accessible: false, status: 'Fail' },  // SI-03c
  { net_name: 'DIAG_VDC_BUS',        test_point_ids: ['TP-VDC-1'],    accessible: true,  status: 'Pass' },
  { net_name: 'DIAG_PHASE_U_CURR',   test_point_ids: ['TP-IU-1'],     accessible: true,  status: 'Pass' },
  { net_name: 'DIAG_PHASE_V_CURR',   test_point_ids: ['TP-IV-1'],     accessible: true,  status: 'Pass' },
  { net_name: 'DIAG_GATE_FAULT',     test_point_ids: ['TP-GFLT-1'],   accessible: true,  status: 'Pass' },
  { net_name: 'DIAG_COOLANT_TEMP',   test_point_ids: ['TP-COOL-1'],   accessible: true,  status: 'Pass' },
];

const REVISED_NETLIST: TestPointItem[] = INITIAL_NETLIST.map(n =>
  n.net_name === 'DIAG_TEMP_IGBT_CASE'
    ? { ...n, test_point_ids: ['TP-IGBT-CASE'], accessible: true, status: 'Pass' as const }
    : n
);

export async function runTestPointCoverageCheck(
  phaseId: number,
  inputVersionId: string,
  isRevised: boolean = false
): Promise<CheckToolResult> {
  const data = isRevised ? REVISED_NETLIST : INITIAL_NETLIST;
  const failures = data.filter(d => !d.accessible);
  const overallStatus = failures.length === 0 ? 'Pass' : 'Fail';

  const checkId = randomUUID();
  await db.insert(checkResults).values({
    checkId, checkType: 'TestPointCoverage', phaseId: phaseId as any,
    inputVersionIds: [inputVersionId],
    formulaOrMethod: `For each diagnostic net: verify len(test_point_ids) ≥ ${EVINV_POC_STD_001.testPoint.minPerDiagnosticNet}. Fail if no accessible test point.`,
    threshold: EVINV_POC_STD_001.testPoint.minPerDiagnosticNet.toString(),
    thresholdUnit: EVINV_POC_STD_001.testPoint.unit,
    resultValue: `${failures.length} uncovered diagnostic net(s)`, resultUnit: 'count',
    status: overallStatus,
    sourceReference: `${EVINV_POC_STD_001.testPoint.clause} — ${POC_STD_LABEL}`,
    limitation: 'Accessibility from design data; physical cable routing not assessed in POC.',
    itemsChecked: data as any[], invalidated: false, supersededBy: null,
  });

  if (!isRevised) {
    for (const fail of failures) {
      await db.insert(findings).values({
        findingId: `F4-003-${fail.net_name}`,
        sourcePhase: phaseId as any, sourceGate: phaseId as any,
        detectedBy: 'DeterministicCheck', checkId,
        description: `Test-point coverage gap: Diagnostic net "${fail.net_name}" has no accessible test point. EVINV-POC-STD-001 §4.2 requires ≥1 test point per diagnostic net.`,
        severity: 'Major', status: 'Open',
        seeded: fail.net_name === 'DIAG_TEMP_IGBT_CASE',  // SI-03c
      }).onConflictDoNothing();
    }
  }

  return {
    checkId, checkType: 'TestPointCoverage', phaseId, inputVersionId,
    formulaOrMethod: 'Count test_point_ids per diagnostic net; fail if count = 0',
    threshold: '1', thresholdUnit: 'test points per diagnostic net',
    resultValue: `${failures.length} uncovered net(s)`, resultUnit: 'count',
    status: overallStatus,
    sourceReference: `${EVINV_POC_STD_001.testPoint.clause} — ${POC_STD_LABEL}`,
    limitation: 'Physical access constraints not assessed in POC.',
    itemsChecked: data, runAt: new Date().toISOString(),
  };
}
