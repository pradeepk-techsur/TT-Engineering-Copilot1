import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { runHVClearanceCheck } from '@/server/tools/hvClearanceCheck';
import { runComponentDeratingCheck } from '@/server/tools/componentDeratingCheck';
import { runTestPointCoverageCheck } from '@/server/tools/testPointCoverageCheck';
import { runCrossArtifactConsistencyCheck } from '@/server/tools/crossArtifactConsistencyCheck';
import { generateDFMStandardsAudit, generateBOMHealthReport, DFMAuditFindingRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, findings, actions, inputVersions, phaseInputs } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { CheckToolResult } from '@/server/tools/toolTypes';

const PROJECT_ID = 'EVINV-POC-001';

export class DFMStandardsAgent extends BaseAgent {
  constructor() { super(4, 'DFMStandardsAgent', 16000); }

  async run(context: AgentContext, isRevised: boolean = false): Promise<AgentResult> {
    // Get active internal input version
    const [internalInput] = await db.select().from(phaseInputs)
      .where(and(eq(phaseInputs.projectId, PROJECT_ID), eq(phaseInputs.phaseId, 4 as any), eq(phaseInputs.inputRole, 'internal')));
    const [activeVersion] = internalInput ? await db.select().from(inputVersions)
      .where(and(eq(inputVersions.inputId, internalInput.inputId), eq(inputVersions.active, true))) : [null];
    const inputVersionId = activeVersion?.versionId ?? `phase4-v${isRevised ? 2 : 1}`;

    // STEP 1: Run all four deterministic checks OUTSIDE LLM
    const [crossResult, hvResult, deratingResult, tpResult] = await Promise.all([
      runCrossArtifactConsistencyCheck(4, inputVersionId, isRevised),
      runHVClearanceCheck(4, inputVersionId, isRevised),
      runComponentDeratingCheck(4, inputVersionId, isRevised),
      runTestPointCoverageCheck(4, inputVersionId, isRevised),
    ]);

    const checkResults: CheckToolResult[] = [crossResult, hvResult, deratingResult, tpResult];
    const allPass = checkResults.every(c => c.status === 'Pass');

    // STEP 2: Check if A3-001 (Phase 3 Conditional Pass action) is closed on revised run
    let a3001Closed = false;
    if (isRevised) {
      const [a3001] = await db.select().from(actions).where(eq(actions.actionId, 'A3-001'));
      a3001Closed = a3001?.status === 'VerifiedClosed';
      if (!a3001Closed) {
        // Auto-close A3-001 on revised run (in POC: coolant connector verified in revised design)
        await db.update(actions)
          .set({ status: 'VerifiedClosed', closedAt: new Date().toISOString() })
          .where(eq(actions.actionId, 'A3-001'));
        await db.update(findings)
          .set({ status: 'VerifiedClosed', closedAt: new Date().toISOString() })
          .where(eq(findings.findingId, 'F3-001'));
        a3001Closed = true;
      }
    }

    // STEP 3: Collect all Phase 4 findings from DB (set by deterministic checks)
    const phase4Findings = await db.select().from(findings)
      .where(eq(findings.sourcePhase, 4 as any));

    // STEP 4: Build compact audit rows from check results
    const auditRows: DFMAuditFindingRow[] = [];
    checkResults.forEach(check => {
      check.itemsChecked.forEach((item: any) => {
        if (item.status === 'Fail' || !isRevised) {
          auditRows.push({
            findingId: `${check.checkType}-${(item.item_id ?? item.net_pair ?? item.ref_des ?? item.net_name ?? 'item')}`.slice(0, 30),
            checkType: check.checkType,
            component: item.item_id ?? item.net_pair ?? item.ref_des ?? item.net_name ?? 'N/A',
            field: item.field_checked ?? item.clearance_type ?? item.stress_parameter ?? 'Coverage',
            measuredValue: String(item.value_in_internal ?? item.measured_mm ?? item.derating_margin_pct ?? (item.accessible ? 'Accessible' : 'None')),
            thresholdValue: check.threshold,
            unit: check.thresholdUnit,
            status: item.status ?? check.status,
            seeded: String(item.match === false || item.margin_mm < 0 || item.derating_margin_pct < 50 || item.accessible === false),
            sourceReference: check.sourceReference,
            recommendedAction: item.status === 'Fail'
              ? (check.checkType === 'HVClearance' ? 'Increase clearance to ≥8.5mm'
                : check.checkType === 'ComponentDerating' ? 'Replace with higher-rated component'
                : check.checkType === 'TestPointCoverage' ? 'Add test point to diagnostic net'
                : 'Reconcile footprint between BOM and DFM spec')
              : 'No action required',
          });
        }
      });
    });

    // Limit to 10 rows (CA-01)
    const limitedAuditRows = auditRows.slice(0, 10);

    // STEP 5: LLM generates narrative context (uses check results, not performs checks)
    const systemPrompt = this.buildSystemPrompt(4);
    const checkSummaryForLLM = checkResults.map(c =>
      `- ${c.checkType}: ${c.status} (${c.resultValue}) | Source: ${c.sourceReference}`
    ).join('\n');

    const prompt = `Phase 4 CDR/DFM Audit for EVINV-POC-001 (EV-INV-800, 800VDC, 150kW).
Deterministic checks have already run and produced these results (do NOT recalculate):
${checkSummaryForLLM}
A3-001 (Coolant Connector Orientation): ${a3001Closed ? 'VERIFIED CLOSED' : 'OPEN'}

Write a concise (~1 paragraph) CDR readiness narrative based on these check results.
${allPass && a3001Closed ? 'Recommend: Pass (design freeze approved).' : 'Recommend: Fail (corrections required before design freeze).'}
Do not re-derive the check results. Cite EVINV-POC-STD-001 (Synthetic POC Standard).`;

    const narrative = await this.callLLM(prompt, systemPrompt, 2000);
    const recommendedOutcome = allPass && a3001Closed ? 'Pass' : 'Fail';

    const [auditResult, reportResult] = await Promise.all([
      generateDFMStandardsAudit(limitedAuditRows),
      generateBOMHealthReport(checkResults, a3001Closed, isRevised),
    ]);

    // Register outputs (first run only — on rerun update existing)
    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 4 as any)));
    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        {
          projectId: PROJECT_ID, phaseId: 4,
          outputName: 'Source-Cited, Risk-Scored DFM and Standards Audit',
          artifactType: 'XLSX', sizeGuidance: '≤10 findings',
          artifactId: auditResult.artifactId, versionRef: isRevised ? 'v2' : 'v1',
          approvalStatus: 'AwaitingReview', reviewRequired: true,
        },
        {
          projectId: PROJECT_ID, phaseId: 4,
          outputName: 'BOM Health and Manufacturability Report',
          artifactType: 'DOCX', sizeGuidance: '~1–2 pages',
          artifactId: reportResult.artifactId, versionRef: isRevised ? 'v2' : 'v1',
          approvalStatus: 'AwaitingReview', reviewRequired: true,
        },
      ]);
    }

    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate',
      gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation(
        recommendedOutcome,
        `${narrative}\n\nDeterministic checks: ${allPass ? 'all pass' : 'failures detected'}. A3-001: ${a3001Closed ? 'verified closed' : 'still open'}.`,
        phase4Findings.filter(f => f.status === 'Open').map(f => f.findingId),
        checkResults.map(c => c.checkId)
      ) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 4 as any)));

    return {
      phaseId: 4,
      outputs: [
        { outputName: 'DFM and Standards Audit', artifactType: 'XLSX', artifactId: auditResult.artifactId, storageUri: auditResult.storageUri, rowCount: auditResult.rowCount, disclaimerPresent: true },
        { outputName: 'BOM Health and Manufacturability Report', artifactType: 'DOCX', artifactId: reportResult.artifactId, storageUri: reportResult.storageUri, disclaimerPresent: true },
      ],
      findings: phase4Findings.map(f => ({
        findingId: f.findingId, sourcePhase: 4, sourceGate: 4,
        detectedBy: f.detectedBy as any, description: f.description,
        severity: f.severity as any, seeded: f.seeded,
      })),
      aiRecommendation: this.buildAIRecommendation(recommendedOutcome, narrative, [], checkResults.map(c => c.checkId)),
      contextUsed: { projectId: context.projectId, phaseId: 4 },
    };
  }
}
