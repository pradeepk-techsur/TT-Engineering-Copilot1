/**
 * RequirementTestability Check — DETERMINISTIC, runs outside LLM.
 * Detects SI-01: REQ-THERM-004 lacks a measurable acceptance criterion.
 * 
 * This check NEVER calls the LLM. It inspects requirement text directly
 * for measurability indicators (numeric thresholds, test conditions, units).
 * Matches FRD F05 §RequirementTestability check.
 */

import { db } from '@/db';
import { checkResults, findings } from '@/db/schema';
import { randomUUID } from 'crypto';

export interface TestabilityCheckResult {
  checkId: string;
  checkType: 'RequirementTestability';
  phaseId: number;
  inputVersionId: string;
  formulaOrMethod: string;
  threshold: string;
  thresholdUnit: string;
  requirementsChecked: {
    reqId: string;
    requirementText: string;
    testable: boolean;
    reason: string;
  }[];
  failedRequirements: string[];
  status: 'Pass' | 'Fail';
  sourceReference: string;
  limitation: string;
}

// Seeded requirement data (from phase2-int-system-requirements.xlsx, row SYS-008)
const SEEDED_REQUIREMENTS = [
  { reqId: 'SYS-001', text: 'Nominal DC input voltage shall be 800 VDC', criterion: '≥800V ±5% under nominal load' },
  { reqId: 'SYS-002', text: 'Operating range shall be 550–920 VDC', criterion: 'Operates without shutdown at 550V and 920V' },
  { reqId: 'SYS-003', text: 'Continuous output power ≥150 kW', criterion: 'Output ≥150kW for ≥30 min at rated voltage' },
  { reqId: 'SYS-004', text: 'Peak output power ≥220 kW for ≥10 seconds', criterion: 'Output ≥220kW for 10s without shutdown' },
  { reqId: 'SYS-005', text: 'Liquid-cooled cold plate; coolant inlet temperature ≤65°C', criterion: '≤65°C inlet per thermal test' },
  { reqId: 'SYS-006', text: 'CAN interface per customer specification CUST-ICD-001', criterion: 'CAN frames per CUST-ICD-001 §4' },
  { reqId: 'SYS-007', text: 'Sealed IP67 aluminum housing', criterion: 'IP67 per IEC 60529' },
  // SI-01: REQ-THERM-004 — SEEDED ISSUE — no measurable acceptance criterion
  { reqId: 'REQ-THERM-004', text: 'The inverter shall be thermally stable under load', criterion: 'TBD — no measurable criterion defined' },
];

// After correction: revised requirement with measurable criterion
const REVISED_REQUIREMENTS = SEEDED_REQUIREMENTS.map(r =>
  r.reqId === 'REQ-THERM-004'
    ? { ...r, criterion: 'Operating temperature ≤85°C at Case Temperature Point TP-CASE-1, confirmed by thermocouple measurement at rated load', text: 'The inverter case temperature shall not exceed 85°C at TP-CASE-1 under continuous rated load' }
    : r
);

/**
 * Deterministic testability check.
 * A requirement is testable if it has a measurable acceptance criterion
 * (numeric value, test condition, units, or verification method reference).
 */
function isTestable(criterion: string): boolean {
  if (!criterion || criterion === '' || criterion.toLowerCase().includes('tbd')) return false;
  // Must have at least one of: number, unit, test method reference, percentage
  const hasNumeric = /\d/.test(criterion);
  const hasUnit = /°C|kW|V|Hz|%|mm|kg|N·m|per IEC|per ISO|per CUST/.test(criterion);
  const hasTestMethod = /test|inspect|measure|verify|per/.test(criterion.toLowerCase());
  return hasNumeric || hasUnit || hasTestMethod;
}

export async function runTestabilityCheck(
  phaseId: number,
  inputVersionId: string,
  isRevised: boolean = false
): Promise<TestabilityCheckResult> {
  const requirements = isRevised ? REVISED_REQUIREMENTS : SEEDED_REQUIREMENTS;
  const checked = requirements.map(req => ({
    reqId: req.reqId,
    requirementText: req.text,
    testable: isTestable(req.criterion),
    reason: isTestable(req.criterion)
      ? `Criterion is measurable: "${req.criterion.slice(0, 80)}"`
      : `Criterion is not measurable: "${req.criterion.slice(0, 80)}" — no numeric threshold, unit, or test condition`,
  }));

  const failed = checked.filter(r => !r.testable).map(r => r.reqId);
  const passed = failed.length === 0;

  // Write to check_results table (DETERMINISTIC — not LLM inference)
  const checkId = randomUUID();
  await db.insert(checkResults).values({
    checkId,
    checkType: 'RequirementTestability',
    phaseId: phaseId as any,
    inputVersionIds: [inputVersionId],
    formulaOrMethod: 'Testability rule: requirement acceptance criterion must contain numeric threshold, engineering unit, or test method reference. TBD/vague criteria fail.',
    threshold: '0 untestable requirements',
    thresholdUnit: 'count of non-testable requirements',
    resultValue: `${failed.length} non-testable requirement(s) found`,
    resultUnit: 'count',
    status: passed ? 'Pass' : 'Fail',
    sourceReference: 'EVINV-POC-STD-001 §1.1; FRD F05 §RequirementTestability; REQUIREMENTS.md SI-01',
    limitation: 'Checks syntactic measurability of acceptance criterion text only; does not verify engineering validity of threshold values.',
    itemsChecked: checked as any,
    invalidated: false,
  });

  // If failed, raise finding F2-001 (seeded=true)
  if (!passed && failed.includes('REQ-THERM-004')) {
    await db.insert(findings).values({
      findingId: `F2-001-${isRevised ? 'revised' : 'original'}`,
      sourcePhase: phaseId as any,
      sourceGate: phaseId as any,
      detectedBy: 'DeterministicCheck',
      checkId,
      description: 'REQ-THERM-004 lacks a measurable acceptance criterion. "Thermally stable under load" provides no numeric temperature limit, test condition, or measurement point. Testability check: FAIL.',
      severity: 'Major',
      status: 'Open',
      seeded: true,  // SI-01 is a seeded issue
    }).onConflictDoNothing();
  }

  // If passed and was the revised run, close F2-001
  if (passed && isRevised) {
    const { eq } = await import('drizzle-orm');
    await db.update(findings)
      .set({ status: 'VerifiedClosed', closedAt: new Date().toISOString() })
      .where(eq(findings.findingId, 'F2-001-original'));
  }

  return {
    checkId,
    checkType: 'RequirementTestability',
    phaseId,
    inputVersionId,
    formulaOrMethod: 'Criterion measurability rule: numeric threshold, unit, or test reference required',
    threshold: '0 untestable requirements',
    thresholdUnit: 'count',
    requirementsChecked: checked,
    failedRequirements: failed,
    status: passed ? 'Pass' : 'Fail',
    sourceReference: 'EVINV-POC-STD-001 §1.1; FRD F05 §RequirementTestability',
    limitation: 'Syntactic measurability check only; does not validate threshold engineering values',
  };
}
