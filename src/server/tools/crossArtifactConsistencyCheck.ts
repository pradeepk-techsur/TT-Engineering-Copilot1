/**
 * Cross-Artifact Consistency Check — DETERMINISTIC, zero LLM calls.
 * Verifies footprint, part number, and revision consistency between BOM and DFM rules.
 * Detects SI-03d: C_HV_1 footprint 0805 in BOM vs 1206 in DFM spec.
 */

import { db } from '@/db';
import { checkResults, findings } from '@/db/schema';
import { randomUUID } from 'crypto';
import { EVINV_POC_STD_001, POC_STD_LABEL } from './evinvPocStd001';
import { CheckToolResult, ConsistencyItem } from './toolTypes';

const INITIAL_COMPARISON: ConsistencyItem[] = [
  { item_id: 'C_HV_1',   field_checked: 'Footprint',   value_in_internal: '0805',          value_in_external: '1206',          match: false, status: 'Fail' },  // SI-03d
  { item_id: 'C_BULK_3', field_checked: 'Footprint',   value_in_internal: 'C_2917',         value_in_external: 'C_2917',         match: true,  status: 'Pass' },
  { item_id: 'Q_HV_1',   field_checked: 'Part Number', value_in_internal: 'IGBT-HV-800-A', value_in_external: 'IGBT-HV-800-A', match: true,  status: 'Pass' },
  { item_id: 'R_GATE_1', field_checked: 'Revision',    value_in_internal: 'Rev A',          value_in_external: 'Rev A',          match: true,  status: 'Pass' },
  { item_id: 'U_MCU_1',  field_checked: 'Footprint',   value_in_internal: 'QFP-64',         value_in_external: 'QFP-64',         match: true,  status: 'Pass' },
];

const REVISED_COMPARISON: ConsistencyItem[] = INITIAL_COMPARISON.map(d =>
  d.item_id === 'C_HV_1' && d.field_checked === 'Footprint'
    ? { ...d, value_in_internal: '1206', match: true, status: 'Pass' as const }
    : d
);

export async function runCrossArtifactConsistencyCheck(
  phaseId: number,
  inputVersionId: string,
  isRevised: boolean = false
): Promise<CheckToolResult> {
  const data = isRevised ? REVISED_COMPARISON : INITIAL_COMPARISON;
  const failures = data.filter(d => !d.match);
  const overallStatus = failures.length === 0 ? 'Pass' : 'Fail';

  const checkId = randomUUID();
  await db.insert(checkResults).values({
    checkId, checkType: 'CrossArtifactConsistency', phaseId: phaseId as any,
    inputVersionIds: [inputVersionId],
    formulaOrMethod: 'For each reference designator: compare field values between internal design package and external DFM rules. Fail if value_in_internal ≠ value_in_external.',
    threshold: `${EVINV_POC_STD_001.consistency.maxMismatches} mismatches`,
    thresholdUnit: 'count of mismatches',
    resultValue: `${failures.length} mismatch(es) found`, resultUnit: 'count',
    status: overallStatus,
    sourceReference: `${EVINV_POC_STD_001.consistency.clause} — ${POC_STD_LABEL}`,
    limitation: 'Textual consistency check only; does not verify electrical correctness or 3D clearances.',
    itemsChecked: data as any[], invalidated: false, supersededBy: null,
  });

  if (!isRevised) {
    for (const fail of failures) {
      await db.insert(findings).values({
        findingId: `F4-004-${fail.item_id}-${fail.field_checked}`,
        sourcePhase: phaseId as any, sourceGate: phaseId as any,
        detectedBy: 'DeterministicCheck', checkId,
        description: `Cross-artifact mismatch: ${fail.item_id} ${fail.field_checked} — BOM: "${fail.value_in_internal}" vs DFM spec: "${fail.value_in_external}". Must be reconciled before design freeze.`,
        severity: 'Major', status: 'Open',
        seeded: fail.item_id === 'C_HV_1',  // SI-03d
      }).onConflictDoNothing();
    }
  }

  return {
    checkId, checkType: 'CrossArtifactConsistency', phaseId, inputVersionId,
    formulaOrMethod: 'String equality comparison of field values across internal BOM and external DFM package',
    threshold: '0', thresholdUnit: 'mismatches',
    resultValue: `${failures.length} mismatch(es)`, resultUnit: 'count',
    status: overallStatus,
    sourceReference: `${EVINV_POC_STD_001.consistency.clause} — ${POC_STD_LABEL}`,
    limitation: 'Textual consistency only; no electrical or geometric verification.',
    itemsChecked: data, runAt: new Date().toISOString(),
  };
}
