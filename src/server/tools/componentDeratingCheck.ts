/**
 * Component Derating Check — DETERMINISTIC, zero LLM calls.
 * Formula: derating_margin_pct = (rated_value - operating_value) / rated_value * 100
 * Detects SI-03b: C_BULK_3 rated 450V, operating 430V → margin 4.4% < 50% threshold.
 */

import { db } from '@/db';
import { checkResults, findings } from '@/db/schema';
import { randomUUID } from 'crypto';
import { EVINV_POC_STD_001, POC_STD_LABEL } from './evinvPocStd001';
import { CheckToolResult } from './toolTypes';

// Concrete interface avoids the DeratingItem extends CheckItem unknown field issue
interface RawComponent {
  ref_des: string;
  component_type: string;
  stress_parameter: string;
  rated_value: number;
  operating_value: number;
  unit: string;
}

interface ComputedComponent extends RawComponent {
  derating_margin_pct: number;
  threshold_pct: number;
  status: 'Pass' | 'Fail';
}

// Seeded component data
const INITIAL_COMPONENT_DATA: RawComponent[] = [
  { ref_des: 'C_BULK_3',   component_type: 'Capacitor', stress_parameter: 'Voltage', rated_value: 450,  operating_value: 430, unit: 'V' },  // SI-03b: 4.4% margin
  { ref_des: 'C_HV_1',     component_type: 'Capacitor', stress_parameter: 'Voltage', rated_value: 900,  operating_value: 430, unit: 'V' },  // 52.2% margin — Pass
  { ref_des: 'C_DECOUP_1', component_type: 'Capacitor', stress_parameter: 'Voltage', rated_value: 50,   operating_value: 15,  unit: 'V' },  // 70% margin
  { ref_des: 'Q_HV_1',     component_type: 'MOSFET',    stress_parameter: 'VDS',     rated_value: 1200, operating_value: 800, unit: 'V' },  // 33.3% margin > 30%
  { ref_des: 'D_CLAMP_1',  component_type: 'Diode',     stress_parameter: 'VRRM',    rated_value: 1000, operating_value: 680, unit: 'V' },  // 32.0% margin > 30%
];

// Revised data — C_BULK_3 replaced with 900V capacitor → (900-430)/900 = 52.2% → Pass
const REVISED_COMPONENT_DATA: RawComponent[] = INITIAL_COMPONENT_DATA.map(d =>
  d.ref_des === 'C_BULK_3' ? { ...d, rated_value: 900 } : d
);

function computeDerating(component: RawComponent): ComputedComponent {
  const margin = ((component.rated_value - component.operating_value) / component.rated_value) * 100;
  const threshold = component.component_type === 'Capacitor'
    ? EVINV_POC_STD_001.derating.capacitorVoltage_pct
    : component.component_type === 'MOSFET'
      ? EVINV_POC_STD_001.derating.mosfetVds_pct
      : EVINV_POC_STD_001.derating.diodeVrrm_pct;
  return {
    ...component,
    derating_margin_pct: Math.round(margin * 10) / 10,
    threshold_pct: threshold,
    status: margin >= threshold ? 'Pass' : 'Fail',
  };
}

export async function runComponentDeratingCheck(
  phaseId: number,
  inputVersionId: string,
  isRevised: boolean = false
): Promise<CheckToolResult> {
  const rawData = isRevised ? REVISED_COMPONENT_DATA : INITIAL_COMPONENT_DATA;
  // NO LLM — pure arithmetic
  const computed = rawData.map(computeDerating);
  const failures = computed.filter(d => d.status === 'Fail');
  const overallStatus = failures.length === 0 ? 'Pass' : 'Fail';

  const checkId = randomUUID();
  await db.insert(checkResults).values({
    checkId, checkType: 'ComponentDerating', phaseId: phaseId as unknown as number,
    inputVersionIds: [inputVersionId],
    formulaOrMethod: 'Derating margin (%) = (Rated_Value − Operating_Value) / Rated_Value × 100. Capacitors: threshold ≥50%; MOSFETs/Diodes: threshold ≥30%.',
    threshold: `Capacitor: ${EVINV_POC_STD_001.derating.capacitorVoltage_pct}%, MOSFET/Diode: ${EVINV_POC_STD_001.derating.mosfetVds_pct}%`,
    thresholdUnit: '%',
    resultValue: `${failures.length} derating violation(s) found`,
    resultUnit: 'count', status: overallStatus,
    sourceReference: `${EVINV_POC_STD_001.derating.clause} — ${POC_STD_LABEL}`,
    limitation: 'Operating stress from design package; worst-case analysis not performed in POC.',
    itemsChecked: computed as unknown as Record<string, unknown>[],
    invalidated: false, supersededBy: null,
  });

  if (!isRevised) {
    for (const fail of failures) {
      await db.insert(findings).values({
        findingId: `F4-002-${fail.ref_des}`,
        sourcePhase: phaseId as unknown as number,
        sourceGate: phaseId as unknown as number,
        detectedBy: 'DeterministicCheck', checkId,
        description: `Derating violation: ${fail.ref_des} (${fail.component_type}) ${fail.stress_parameter} derating margin ${fail.derating_margin_pct}% < ${fail.threshold_pct}% threshold. Rated: ${fail.rated_value}${fail.unit}, Operating: ${fail.operating_value}${fail.unit}.`,
        severity: 'Critical', status: 'Open',
        seeded: fail.ref_des === 'C_BULK_3',  // SI-03b
      }).onConflictDoNothing();
    }
  }

  return {
    checkId, checkType: 'ComponentDerating', phaseId, inputVersionId,
    formulaOrMethod: 'margin_pct = (Rated − Operating) / Rated × 100; compare against EVINV-POC-STD-001 §3.3 thresholds',
    threshold: '50% (capacitors), 30% (MOSFETs/diodes)', thresholdUnit: '%',
    resultValue: `${failures.length} violation(s)`, resultUnit: 'count',
    status: overallStatus,
    sourceReference: `${EVINV_POC_STD_001.derating.clause} — ${POC_STD_LABEL}`,
    limitation: 'Operating stress values from design package; no worst-case analysis in POC.',
    itemsChecked: computed as unknown as Record<string, unknown>[], runAt: new Date().toISOString(),
  };
}
