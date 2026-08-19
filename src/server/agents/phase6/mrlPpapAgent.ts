import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { runCpkCalculation } from '@/server/tools/cpkCalculation';
import { generateMRLScorecard, generatePPAPFAIIndex, MRLScorecardRow, PPAPFAIRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, inputVersions, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { POC_STD_LABEL } from '@/server/tools/evinvPocStd001';

const PROJECT_ID = 'EVINV-POC-001';

const MRL_SCORECARD_DATA: MRLScorecardRow[] = [
  { mrlElement: 'MRL-4', description: 'Capability to produce technology in lab', evidenceRef: 'LAB-VERIFY-001', currentLevel: '4', targetLevel: '7', gap: 'Process scaling required', status: 'In Progress' },
  { mrlElement: 'MRL-5', description: 'Capability to produce prototype components in production environment', evidenceRef: 'PROTO-BUILD-001', currentLevel: '5', targetLevel: '7', gap: 'PPAP completion required', status: 'In Progress' },
  { mrlElement: 'MRL-6', description: 'Capability to produce prototype systems in production environment', evidenceRef: 'MFG-DEMO-001', currentLevel: '6', targetLevel: '7', gap: 'Minor — process refinement', status: 'Near Complete' },
  { mrlElement: 'MRL-7-SQ', description: 'Statistical Quality — Cpk ≥ 1.33 for critical characteristics', evidenceRef: 'CPK-RPT-001', currentLevel: 'Partial', targetLevel: '7', gap: 'Solder joint Cpk below threshold — corrective action in progress', status: 'Action Required' },
  { mrlElement: 'MRL-7-DOC', description: 'Production documentation complete (BOM, routes, WI, SOP)', evidenceRef: 'DOC-PKG-001', currentLevel: '7', targetLevel: '7', gap: 'None', status: 'Complete' },
  { mrlElement: 'MRL-7-EQ', description: 'Equipment qualification complete', evidenceRef: 'EQUIP-QUAL-001', currentLevel: '7', targetLevel: '7', gap: 'None', status: 'Complete' },
];

const PPAP_FAI_DATA: PPAPFAIRow[] = [
  { deliverableId: 'PPAP-001', ppapElement: 'Design Records (Final BOM Rev D)', customerCriterion: 'Released BOM per CUST-PPAP-001 §3.1', requiredEvidence: 'Released BOM with ECN sign-off', currentStatus: 'Complete', responsibleRole: 'Engineering Manager', priority: 'High' },
  { deliverableId: 'PPAP-002', ppapElement: 'Approved Engineering Change Documents', customerCriterion: 'All ECNs signed per change control process', requiredEvidence: 'ECN register with approval signatures', currentStatus: 'Complete', responsibleRole: 'Engineering Manager', priority: 'High' },
  { deliverableId: 'PPAP-003', ppapElement: 'Process Flow Diagram', customerCriterion: 'Detailed assembly/test flow per APQP §4', requiredEvidence: 'Process flow map RPT-FLOW-001', currentStatus: 'Complete', responsibleRole: 'Manufacturing Engineering', priority: 'High' },
  { deliverableId: 'PPAP-004', ppapElement: 'Process FMEA', customerCriterion: 'PFMEA covering all critical characteristics', requiredEvidence: 'PFMEA-EVINV-001 with RPN scoring', currentStatus: 'Complete', responsibleRole: 'Quality Engineering', priority: 'High' },
  { deliverableId: 'PPAP-005', ppapElement: 'Process Capability Study (Cpk ≥ 1.33)', customerCriterion: 'Cpk ≥ 1.33 for all critical characteristics', requiredEvidence: 'Cpk study per EVINV-POC-STD-001 §5.1', currentStatus: 'Action Required — Solder Joint Cpk below threshold', responsibleRole: 'Quality Engineering', priority: 'Critical' },
  { deliverableId: 'PPAP-006', ppapElement: 'First Article Inspection Report', customerCriterion: 'FAI per AS9102 or equivalent', requiredEvidence: 'FAI report FAI-EVINV-001', currentStatus: 'In Progress', responsibleRole: 'Quality Engineering', priority: 'High' },
  { deliverableId: 'PPAP-007', ppapElement: 'Dimensional Results (GD&T)', customerCriterion: 'All critical dimensions within tolerance', requiredEvidence: 'CMM report DIM-EVINV-001', currentStatus: 'Complete', responsibleRole: 'Manufacturing Engineering', priority: 'Medium' },
];

export class MRLPPAPAgent extends BaseAgent {
  constructor() { super(6, 'MRLPPAPAgent', 8000); }

  async run(context: AgentContext, isRevised: boolean = false): Promise<AgentResult> {
    // Get active internal input version (SI — MES/quality data)
    const [internalInput] = await db.select().from(phaseInputs)
      .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 6 as any), eq(phaseInputs.inputRole, 'internal')));
    const [activeVersion] = internalInput ? await db.select().from(inputVersions)
      .where(and(eq(inputVersions.inputId, internalInput.inputId), eq(inputVersions.active, true))) : [null];
    const inputVersionId = activeVersion?.versionId ?? `phase6-v${isRevised ? 2 : 1}`;

    // STEP 1: Run Cpk deterministic check OUTSIDE LLM
    const cpkResult = await runCpkCalculation(6, inputVersionId, isRevised);
    const cpkPass = cpkResult.status === 'Pass';

    // STEP 2: LLM narrative (receives check summary — does NOT recalculate)
    const systemPrompt = this.buildSystemPrompt(6);
    const prompt = `Phase 6 MRL/PPAP for EVINV-POC-001.
Cpk check result (already computed deterministically — do NOT recalculate):
- ${cpkResult.resultValue} | Overall status: ${cpkResult.status}
- Source: ${cpkResult.sourceReference}

${!cpkPass ? 'SOLDER_JOINT_SHEAR_HV_BUS Cpk below 1.33 threshold. Process corrective action required.' : 'All characteristics meet Cpk ≥ 1.33. Manufacturing process qualified.'}

Write a concise MRL/PPAP readiness narrative (~1 paragraph). Recommend: ${cpkPass ? 'Pass' : 'Fail'} for Gate 6.
Do NOT invent Cpk values. Cite EVINV-POC-STD-001 §5.1 (Synthetic POC Standard).`;

    const narrative = await this.callLLM(prompt, systemPrompt, 2000);

    const [mrlResult, ppapResult] = await Promise.all([
      generateMRLScorecard(MRL_SCORECARD_DATA),
      generatePPAPFAIIndex(PPAP_FAI_DATA),
    ]);

    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 6 as any)));
    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        { projectId: PROJECT_ID, phaseId: 6, outputName: 'Manufacturing Readiness Level Scorecard', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: mrlResult.artifactId, versionRef: isRevised ? 'v2' : 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
        { projectId: PROJECT_ID, phaseId: 6, outputName: 'PPAP/FAI Readiness Index and Action List', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: ppapResult.artifactId, versionRef: isRevised ? 'v2' : 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      ]);
    }

    const recommendedOutcome = cpkPass ? 'Pass' : 'Fail';
    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate', gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation(
        recommendedOutcome,
        narrative,
        cpkPass ? [] : ['F6-001-SOLDER_JOINT_SHEAR_HV_BUS'],
        [cpkResult.checkId]
      ) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 6 as any)));

    return {
      phaseId: 6, outputs: [
        { outputName: 'MRL Scorecard', artifactType: 'XLSX', artifactId: mrlResult.artifactId, storageUri: mrlResult.storageUri, rowCount: mrlResult.rowCount, disclaimerPresent: true },
        { outputName: 'PPAP/FAI Readiness Index', artifactType: 'XLSX', artifactId: ppapResult.artifactId, storageUri: ppapResult.storageUri, rowCount: ppapResult.rowCount, disclaimerPresent: true },
      ],
      findings: cpkPass ? [] : [{
        findingId: 'F6-001-SOLDER_JOINT_SHEAR_HV_BUS',
        sourcePhase: 6, sourceGate: 6,
        detectedBy: 'DeterministicCheck',
        description: 'SOLDER_JOINT_SHEAR_HV_BUS Cpk below 1.33',
        severity: 'Major',
        seeded: true,
      }],
      aiRecommendation: this.buildAIRecommendation(recommendedOutcome, narrative, [], [cpkResult.checkId]),
      contextUsed: { projectId: context.projectId, phaseId: 6 },
    };
  }
}
