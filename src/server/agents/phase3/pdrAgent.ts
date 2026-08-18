import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generatePDRReadinessSummary, generateEarlyDFMFindingsRegister, DFMFindingRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, findings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export class PDRAgent extends BaseAgent {
  constructor() { super(3, 'PDRAgent', 8000); }

  async run(context: AgentContext): Promise<AgentResult> {
    const systemPrompt = this.buildSystemPrompt(3);
    const prompt = `Phase 3 — Preliminary Design Review (PDR) for EVINV-POC-001 (EV-INV-800, 800VDC, 150kW).
EXTERNAL INPUT: ${context.activeExternalInput?.logicalName ?? 'Standards Library, Mfg Capability Repository'} (SIMULATED)
INTERNAL INPUT: ${context.activeInternalInput?.logicalName ?? 'Preliminary Design Package'} (user-provided)
Upstream approved: Phase 2 Requirements baseline (Gate 2 Pass after REQ-THERM-004 clarification).

Review the preliminary design against DFM rules. Key finding to identify:
- Coolant connector CN-COOL-1 orientation creates assembly access concern for M4 fasteners J-FAST-7 through J-FAST-10.
- This is an Early DFM/DFA finding — coolant connector must be reoriented in detailed design.

Generate PDR readiness summary and early DFM/DFA findings. Recommend Conditional Pass.
Format response as JSON: {"pdrSummary": "...", "gateOutcome": "Conditional Pass"}`;

    const llmResponse = await this.callLLM(prompt, systemPrompt);
    let parsed: any;
    try { const m = llmResponse.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }

    // SI-02: Seeded DFM finding — coolant connector orientation
    const dfmFindings: DFMFindingRow[] = [
      {
        findingId: 'F3-001',
        category: 'Assembly Access',
        description: 'Coolant connector (CN-COOL-1) orientation creates assembly-access concern. Connector insertion angle obstructs access to M4 fasteners J-FAST-7 through J-FAST-10.',
        severity: 'Major',
        affectedComponent: 'CN-COOL-1',
        riskLevel: 'High — may cause assembly difficulty and rework during production build',
        recommendedAction: 'Revise coolant connector orientation in detailed design to ensure unobstructed access to J-FAST-7 through J-FAST-10. Provide revised drawing for Phase 4 verification.',
      },
      {
        findingId: 'F3-002',
        category: 'HV Layout (Preliminary)',
        description: 'HV bus routing at preliminary stage shows tight clearance zone near gate driver section. Requires verification in detailed layout.',
        severity: 'Minor',
        affectedComponent: 'VBUS+',
        riskLevel: 'Medium — to be confirmed in Phase 4 HV clearance check',
        recommendedAction: 'Monitor in Phase 4 detailed design review; HV clearance check will quantify.',
      },
      {
        findingId: 'F3-003',
        category: 'DFM Rule Compliance',
        description: 'Preliminary BOM lists SiC power module IGBT-HV-800-A — verify PCN/PDN status before design freeze.',
        severity: 'Observation',
        affectedComponent: 'Q_HV_1',
        riskLevel: 'Low — will be confirmed in Phase 4 supplier feed check',
        recommendedAction: 'Request latest lifecycle status from supplier before Phase 4 CDR.',
      },
    ];

    const summaryContent = parsed?.pdrSummary ?? `# PDR Readiness Summary — Phase 3

**Project:** EVINV-POC-001 | **Phase:** 3 — Preliminary Design | **Gate:** 3 — PDR

## PDR Readiness Assessment

The preliminary design for EV-INV-800 demonstrates feasibility for the core power stage, cooling concept, and control interfaces. The architecture is sound with three-phase SiC inverter topology appropriate for the 800VDC, 150kW/220kW specification.

## Key Review Outcomes

- Power stage concept (SiC IGBT-HV-800-A modules): feasible and appropriately specified
- Cooling concept (liquid-cooled cold plate, ≤65°C coolant inlet): adequate for thermal budget
- CAN interface: aligned with CUST-ICD-001 requirements
- Enclosure concept (sealed aluminum, IP67): appropriately specified

## Outstanding Issues (requires Conditional Pass action)

1. **F3-001 (Major):** Coolant connector orientation — assembly-access concern. Action A3-001 required before CDR.

## AI Recommendation

Conditional Pass — PDR readiness criteria substantially met. A3-001 must be verified closed before Gate 4.

*Advisory Only — Human decision required.*`;

    const [summaryResult, findingsResult] = await Promise.all([
      generatePDRReadinessSummary(summaryContent),
      generateEarlyDFMFindingsRegister(dfmFindings),
    ]);

    // Raise F3-001 finding in DB (SI-02 seeded)
    await db.insert(findings).values({
      findingId: 'F3-001',
      sourcePhase: 3 as any,
      sourceGate: 3 as any,
      detectedBy: 'AgentAnalysis',
      description: dfmFindings[0].description,
      severity: 'Major',
      status: 'Open',
      seeded: true,
    }).onConflictDoNothing();

    await db.insert(phaseOutputs).values([
      {
        projectId: PROJECT_ID, phaseId: 3, outputName: 'PDR Readiness Summary',
        artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: summaryResult.artifactId,
        versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true,
      },
      {
        projectId: PROJECT_ID, phaseId: 3, outputName: 'Early DFM/DFA Findings and Risk Register',
        artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: findingsResult.artifactId,
        versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true,
      },
    ]);

    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate',
      gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation(
        'Conditional Pass',
        'F3-001 coolant connector orientation concern requires conditional action before CDR.',
        ['F3-001']
      ) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 3 as any)));

    return {
      phaseId: 3,
      outputs: [
        { outputName: 'PDR Readiness Summary', artifactType: 'DOCX', artifactId: summaryResult.artifactId, storageUri: summaryResult.storageUri, disclaimerPresent: true },
        { outputName: 'Early DFM/DFA Findings and Risk Register', artifactType: 'XLSX', artifactId: findingsResult.artifactId, storageUri: findingsResult.storageUri, rowCount: findingsResult.rowCount, disclaimerPresent: true },
      ],
      findings: [{ findingId: 'F3-001', sourcePhase: 3, sourceGate: 3, detectedBy: 'AgentAnalysis', description: dfmFindings[0].description, severity: 'Major', seeded: true }],
      aiRecommendation: this.buildAIRecommendation('Conditional Pass', 'Coolant connector orientation concern requires action before CDR.', ['F3-001']),
      contextUsed: { projectId: context.projectId, phaseId: 3 },
    };
  }
}
