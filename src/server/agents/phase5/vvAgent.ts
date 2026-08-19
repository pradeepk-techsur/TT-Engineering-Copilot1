import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generateVVMatrix, generateGate5Summary, VVMatrixRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, checkResults, findings, inputVersions, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { EVINV_POC_STD_001, POC_STD_LABEL } from '@/server/tools/evinvPocStd001';
import { randomUUID } from 'crypto';

const PROJECT_ID = 'EVINV-POC-001';

// SI-05: TP-CASE-1 thermal measurement 91°C > criterion ≤85°C
const INITIAL_VV_DATA: VVMatrixRow[] = [
  { reqId: 'SYS-001', requirementText: 'Nominal DC input 800 VDC', traceability: 'CUST-001', dfmeaRisk: 'Low', testId: 'TM-001', testMethod: 'DC input sweep test', measuredResult: '800', unit: 'VDC', acceptanceCriterion: '≥800V ±5%', testConfig: 'Bench, rated load', status: 'Pass', evidenceRef: 'TEST-RPT-001' },
  { reqId: 'SYS-002', requirementText: 'Operating range 550–920 VDC', traceability: 'CUST-002', dfmeaRisk: 'Low', testId: 'TM-005', testMethod: 'Voltage sweep at limits', measuredResult: '550 / 920', unit: 'VDC', acceptanceCriterion: 'No shutdown at limits', testConfig: 'Bench, light load', status: 'Pass', evidenceRef: 'TEST-RPT-002' },
  { reqId: 'SYS-003', requirementText: 'Continuous output ≥150 kW', traceability: 'CUST-003', dfmeaRisk: 'Medium', testId: 'TM-001', testMethod: 'Dynamometer load test 30min', measuredResult: '152.4', unit: 'kW', acceptanceCriterion: '≥150kW for ≥30 min', testConfig: '25°C ambient, rated coolant', status: 'Pass', evidenceRef: 'TEST-RPT-003' },
  { reqId: 'SYS-004', requirementText: 'Peak output ≥220 kW / 10s', traceability: 'CUST-004', dfmeaRisk: 'Medium', testId: 'TM-002', testMethod: 'Peak dynamometer test', measuredResult: '221.8', unit: 'kW', acceptanceCriterion: '≥220kW for 10s', testConfig: '25°C ambient', status: 'Pass', evidenceRef: 'TEST-RPT-004' },
  // SI-05: REQ-THERM-004 thermal test FAIL — TP-CASE-1 = 91°C vs criterion ≤85°C
  { reqId: 'REQ-THERM-004', requirementText: 'Case temperature ≤85°C at TP-CASE-1', traceability: 'SYS-THM-001', dfmeaRisk: 'High', testId: 'TM-003', testMethod: 'Thermal test at rated load, 65°C coolant', measuredResult: '91', unit: '°C', acceptanceCriterion: '≤85°C at TP-CASE-1', testConfig: '25°C ambient, 65°C coolant inlet', status: 'Fail', evidenceRef: 'TEST-RPT-005-FAIL' },
  { reqId: 'SYS-006', requirementText: 'CAN interface per CUST-ICD-001', traceability: 'CUST-006', dfmeaRisk: 'Low', testId: 'TM-004', testMethod: 'CAN protocol analyzer', measuredResult: '100', unit: '%', acceptanceCriterion: '100% frame pass', testConfig: 'Bench, CAN analyzer', status: 'Pass', evidenceRef: 'TEST-RPT-006' },
  { reqId: 'SYS-007', requirementText: 'IP67 sealed enclosure', traceability: 'SYS-005', dfmeaRisk: 'Medium', testId: 'TM-006', testMethod: 'Water immersion IEC 60529', measuredResult: 'Pass', unit: 'Pass/Fail', acceptanceCriterion: 'No ingress', testConfig: '1m depth, 30 min', status: 'Pass', evidenceRef: 'TEST-RPT-007' },
];

// Revised: TP-CASE-1 corrected to 82°C after thermal management improvement
const REVISED_VV_DATA: VVMatrixRow[] = INITIAL_VV_DATA.map(r =>
  r.reqId === 'REQ-THERM-004'
    ? { ...r, measuredResult: '82', status: 'Pass', evidenceRef: 'TEST-RPT-005-REVISED' }
    : r
);

export class VVAgent extends BaseAgent {
  constructor() { super(5, 'VVAgent', 8000); }

  async run(context: AgentContext, isRevised: boolean = false): Promise<AgentResult> {
    const data = isRevised ? REVISED_VV_DATA : INITIAL_VV_DATA;
    const failures = data.filter(d => d.status === 'Fail');
    const hasThermalFailure = failures.some(r => r.reqId === 'REQ-THERM-004');

    // Get active internal input version
    const [internalInput] = await db.select().from(phaseInputs)
      .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 5 as any), eq(phaseInputs.inputRole, 'internal')));
    const [activeVersion] = internalInput ? await db.select().from(inputVersions)
      .where(and(eq(inputVersions.inputId, internalInput.inputId), eq(inputVersions.active, true))) : [null];
    const inputVersionId = activeVersion?.versionId ?? `phase5-v${isRevised ? 2 : 1}`;

    // Write V&V check result to check_results (deterministic comparison outside LLM)
    const checkId = randomUUID();
    await db.insert(checkResults).values({
      checkId, checkType: 'TraceabilityCompleteness', phaseId: 5 as any,
      inputVersionIds: [inputVersionId],
      formulaOrMethod: `Compare measured result against acceptance criterion for each requirement. Thermal: measured_°C ≤ criterion_°C. Other: numeric comparison or pass/fail.`,
      threshold: 'All requirements Pass', thresholdUnit: 'count of failures',
      resultValue: `${failures.length} requirement(s) failed`, resultUnit: 'count',
      status: failures.length === 0 ? 'Pass' : 'Fail',
      sourceReference: `EVINV-POC-STD-001 §1.1 Testability (${POC_STD_LABEL}); REQ-THERM-004 criterion: ≤85°C at TP-CASE-1`,
      limitation: 'Measured values from validation evidence package; actual test conditions not independently verified in POC.',
      itemsChecked: data as any[], invalidated: false, supersededBy: null,
    });

    // Raise/close SI-05 finding
    if (!isRevised && hasThermalFailure) {
      await db.insert(findings).values({
        findingId: 'F5-001',
        sourcePhase: 5 as any, sourceGate: 5 as any,
        detectedBy: 'DeterministicCheck', checkId,
        description: 'V&V test failure: REQ-THERM-004 — TP-CASE-1 thermal measurement 91°C exceeds acceptance criterion ≤85°C. Delta: +6°C. Corrective action required before Gate 5 Pass.',
        severity: 'Major', status: 'Open', seeded: true,  // SI-05
      }).onConflictDoNothing();
    } else if (isRevised && failures.length === 0) {
      await db.update(findings).set({ status: 'VerifiedClosed', closedAt: new Date().toISOString() })
        .where(eq(findings.findingId, 'F5-001'));
    }

    // STEP 2: LLM for narrative context (does NOT recalculate — receives check summary)
    const systemPrompt = this.buildSystemPrompt(5);
    const prompt = `Phase 5 V&V Summary for EVINV-POC-001.
Test results (already computed deterministically — do NOT recalculate):
- ${data.length} requirements tested, ${failures.length} failed
${hasThermalFailure ? '- FAIL: REQ-THERM-004 TP-CASE-1 = 91°C vs criterion ≤85°C. Corrective action required.' : '- All requirements PASS including REQ-THERM-004 TP-CASE-1 = 82°C.'}

Write a concise Gate 5 V&V summary (~1 paragraph). 
Recommend: ${failures.length > 0 ? 'Fail (Gate 5 — corrective action required)' : 'Pass (Gate 5 — all requirements verified)'}
Cite REQ-THERM-004 and EVINV-POC-STD-001 (Synthetic POC Standard). Do NOT invent test results.`;

    const narrative = await this.callLLM(prompt, systemPrompt, 2000);

    const summaryContent = `# Gate 5 Verification and Validation Summary

**Project:** EVINV-POC-001 | **Phase:** 5 — Verification & Validation | **Gate:** 5
**Run:** ${isRevised ? 'Revised Validation Evidence (Post-Correction)' : 'Initial Validation Evidence'}

## V&V Test Results

| Requirement | Test | Result | Criterion | Status |
|---|---|---|---|---|
${data.map(r => `| ${r.reqId} | ${r.testId} | ${r.measuredResult} ${r.unit} | ${r.acceptanceCriterion} | ${r.status} |`).join('\n')}

**Overall: ${data.filter(r => r.status === 'Pass').length} Pass / ${failures.length} Fail**

## Summary

${narrative}

---
*${POC_STD_LABEL}. This report is advisory; gate decision requires human approval.*`;

    const [matrixResult, summaryResult] = await Promise.all([
      generateVVMatrix(data),
      generateGate5Summary(summaryContent),
    ]);

    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 5 as any)));
    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        { projectId: PROJECT_ID, phaseId: 5 as any, outputName: 'Verification and Validation Matrix', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: matrixResult.artifactId, versionRef: isRevised ? 'v2' : 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
        { projectId: PROJECT_ID, phaseId: 5 as any, outputName: 'Gate 5 Verification and Validation Summary', artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: summaryResult.artifactId, versionRef: isRevised ? 'v2' : 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      ]);
    }

    const recommendedOutcome = failures.length === 0 ? 'Pass' : 'Fail';
    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate', gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation(recommendedOutcome, narrative, hasThermalFailure ? ['F5-001'] : [], [checkId]) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 5 as any)));

    return {
      phaseId: 5, outputs: [
        { outputName: 'V&V Matrix', artifactType: 'XLSX', artifactId: matrixResult.artifactId, storageUri: matrixResult.storageUri, rowCount: matrixResult.rowCount, disclaimerPresent: true },
        { outputName: 'Gate 5 V&V Summary', artifactType: 'DOCX', artifactId: summaryResult.artifactId, storageUri: summaryResult.storageUri, disclaimerPresent: true },
      ],
      findings: hasThermalFailure ? [{ findingId: 'F5-001', sourcePhase: 5, sourceGate: 5, detectedBy: 'DeterministicCheck', description: 'TP-CASE-1 91°C > 85°C criterion', severity: 'Major', seeded: true }] : [],
      aiRecommendation: this.buildAIRecommendation(recommendedOutcome, narrative, [], [checkId]),
      contextUsed: { projectId: context.projectId, phaseId: 5 },
    };
  }
}
