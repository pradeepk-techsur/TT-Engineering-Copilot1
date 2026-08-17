import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { runTestabilityCheck } from './testabilityCheck';
import { generateRTM, generateTestabilityReport, RTMRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, inputVersions, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export class RequirementsAgent extends BaseAgent {
  constructor() { super(2, 'RequirementsAgent', 8000); }

  async run(context: AgentContext, isRevised: boolean = false): Promise<AgentResult> {
    // Get active internal input version ID for check traceability
    const [internalInput] = await db.select().from(phaseInputs)
      .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 2 as any), eq(phaseInputs.inputRole, 'internal')));
    const [activeVersion] = internalInput ? await db.select().from(inputVersions)
      .where(and(eq(inputVersions.inputId, internalInput.inputId), eq(inputVersions.active, true))) : [null];

    // STEP 1: Run RequirementTestability DETERMINISTIC check (outside LLM)
    const checkResult = await runTestabilityCheck(2, activeVersion?.versionId ?? 'v1', isRevised);

    // STEP 2: Generate RTM rows (from seeded synthetic requirements)
    const rtmRows: RTMRow[] = [
      { reqId: 'SYS-001', requirementText: 'Nominal DC input voltage shall be 800 VDC', source: 'Customer CUST-001', interface: 'Power Input', subsystem: 'Power Stage', acceptanceCriterion: '≥800V ±5% under nominal load', verificationMethod: 'Test', traceToCustomer: 'CUST-001', status: 'Draft' },
      { reqId: 'SYS-002', requirementText: 'Operating range shall be 550–920 VDC', source: 'Customer CUST-002', interface: 'Power Input', subsystem: 'Power Stage', acceptanceCriterion: 'Operates without shutdown at 550V and 920V', verificationMethod: 'Test', traceToCustomer: 'CUST-002', status: 'Draft' },
      { reqId: 'SYS-003', requirementText: 'Continuous output power ≥150 kW', source: 'Customer CUST-003', interface: 'Motor Output', subsystem: 'Power Stage', acceptanceCriterion: 'Output ≥150kW for ≥30 min', verificationMethod: 'Test', traceToCustomer: 'CUST-003', status: 'Draft' },
      { reqId: 'SYS-004', requirementText: 'Peak output power ≥220 kW for ≥10 seconds', source: 'Customer CUST-004', interface: 'Motor Output', subsystem: 'Power Stage', acceptanceCriterion: 'Output ≥220kW for 10s', verificationMethod: 'Test', traceToCustomer: 'CUST-004', status: 'Draft' },
      { reqId: 'SYS-005', requirementText: 'Liquid-cooled cold plate; coolant inlet ≤65°C', source: 'Customer CUST-005', interface: 'Thermal', subsystem: 'Cooling', acceptanceCriterion: '≤65°C inlet per thermal test', verificationMethod: 'Test', traceToCustomer: 'CUST-005', status: 'Draft' },
      { reqId: 'SYS-006', requirementText: 'CAN interface per CUST-ICD-001', source: 'Customer CUST-006', interface: 'Comms', subsystem: 'Control', acceptanceCriterion: 'CAN frames per CUST-ICD-001 §4', verificationMethod: 'Inspection', traceToCustomer: 'CUST-006', status: 'Draft' },
      { reqId: 'SYS-007', requirementText: 'Sealed IP67 aluminum housing', source: 'Derived SYS-005', interface: 'Mechanical', subsystem: 'Enclosure', acceptanceCriterion: 'IP67 per IEC 60529', verificationMethod: 'Test', traceToCustomer: 'SYS-005', status: 'Draft' },
      // SI-01: REQ-THERM-004 — revised version has measurable criterion
      {
        reqId: 'REQ-THERM-004',
        requirementText: isRevised ? 'The inverter case temperature shall not exceed 85°C at TP-CASE-1 under continuous rated load' : 'The inverter shall be thermally stable under load',
        source: 'Customer Standards', interface: 'Thermal', subsystem: 'Thermal Management',
        acceptanceCriterion: isRevised ? 'Operating temperature ≤85°C at TP-CASE-1, thermocouple measurement' : 'TBD — no measurable criterion defined',
        verificationMethod: isRevised ? 'Test (thermocouple TP-CASE-1)' : 'TBD',
        traceToCustomer: 'CUST-THM-001', status: isRevised ? 'Revised' : 'Draft — action required',
      },
    ];

    const hasFailed = checkResult.status === 'Fail';
    const gateRecommendation = hasFailed ? 'Conditional Pass' : 'Pass';
    const rationale = hasFailed
      ? `RequirementTestability check found ${checkResult.failedRequirements.length} non-testable requirement(s): ${checkResult.failedRequirements.join(', ')}. Upload revised requirements package after correction.`
      : 'All requirements have measurable acceptance criteria. Requirements baseline ready for Gate 2 approval.';

    const [rtmResult, reportResult] = await Promise.all([
      generateRTM(rtmRows),
      generateTestabilityReport({
        totalRequirements: rtmRows.length,
        testableCount: rtmRows.length - checkResult.failedRequirements.length,
        nonTestableCount: checkResult.failedRequirements.length,
        nonTestableList: checkResult.requirementsChecked
          .filter(r => !r.testable)
          .map(r => ({ reqId: r.reqId, issue: r.reason })),
        overallStatus: checkResult.status,
        correctionRequired: hasFailed,
      }),
    ]);

    // Only insert outputs once (skip on rerun if already exist)
    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 2 as any)));

    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        { projectId: PROJECT_ID, phaseId: 2, outputName: 'Requirements Traceability Matrix', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: rtmResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
        { projectId: PROJECT_ID, phaseId: 2, outputName: 'Requirements Quality and Testability Report', artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: reportResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      ]);
    }

    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate', gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation(gateRecommendation, rationale, checkResult.status === 'Fail' ? ['F2-001-original'] : [], [checkResult.checkId]) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 2 as any)));

    const agentFindings = checkResult.requirementsChecked
      .filter(r => !r.testable)
      .map(r => ({
        findingId: `F2-001-original`,
        sourcePhase: 2, sourceGate: 2, detectedBy: 'DeterministicCheck' as const,
        checkId: checkResult.checkId,
        description: `${r.reqId}: ${r.reason}`,
        severity: 'Major' as const, seeded: true,
      }));

    return {
      phaseId: 2, outputs: [
        { outputName: 'Requirements Traceability Matrix', artifactType: 'XLSX', artifactId: rtmResult.artifactId, storageUri: rtmResult.storageUri, rowCount: rtmResult.rowCount, disclaimerPresent: true },
        { outputName: 'Requirements Quality and Testability Report', artifactType: 'DOCX', artifactId: reportResult.artifactId, storageUri: reportResult.storageUri, disclaimerPresent: true },
      ],
      findings: agentFindings, aiRecommendation: this.buildAIRecommendation(gateRecommendation, rationale, agentFindings.map(f => f.findingId), [checkResult.checkId]),
      contextUsed: { projectId: context.projectId, phaseId: 2 },
    };
  }
}
