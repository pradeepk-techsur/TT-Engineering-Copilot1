import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generateOpportunitySummary, generateCapabilityGapMatrix, GapMatrixRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export class BidNoBidAgent extends BaseAgent {
  constructor() {
    super(0, 'BidNoBidCopilot', 8000);
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const systemPrompt = this.buildSystemPrompt(0);

    // Build minimal, token-optimized prompt using only active phase 0 inputs
    const prompt = `You are the Bid/No-Bid Copilot for TT Electronics.

Phase: 0 — Project Initiation (Gate 0: Bid/No-Bid)
Project: ${context.projectId}
Product: EV-INV-800 Demonstration Traction Inverter (NPI A / Category 1)

EXTERNAL INPUT: ${context.activeExternalInput?.logicalName ?? 'Customer Opportunity Package'}
(User-provided RFQ/RFP/SOW with scope, deliverables, dates, quantities, requirements)

INTERNAL INPUT: ${context.activeInternalInput?.logicalName ?? 'Capability and Opportunity Assessment Package'}
System Represented: ${context.activeInternalInput?.systemRepresented ?? 'Salesforce, Cora, Capability Library'}

Based on the above inputs for EVINV-POC-001 (EV-INV-800 liquid-cooled traction inverter, 800VDC, 150kW/220kW):

1. Analyze capability match (High/Medium/Low/Gap for: Power Electronics Design, Thermal Management, HV PCB Layout, CAN Interface, Sealed Enclosure, Export Control, Functional Safety)
2. Assess information sufficiency and export/security indicators
3. Generate: (a) bid recommendation rationale, (b) 3 key strengths, (c) 3 key risks, (d) export control assessment
4. Recommend gate outcome: Pass (proceed to proposal), Conditional Pass (with conditions), or Fail (no-bid)

Format your response as JSON with these exact keys:
{
  "bidRecommendation": "Bid",
  "rationale": "...",
  "strengths": ["...", "...", "..."],
  "risks": ["...", "...", "..."],
  "exportControl": "...",
  "nextActions": "...",
  "recommendedGateOutcome": "Pass",
  "gapMatrixRows": [
    {"capabilityId": "CAP-001", "capabilityArea": "Power Electronics Design", "matchLevel": "High", "evidence": "...", "risk": "Low", "recommendedAction": "..."}
  ]
}`;

    const llmResponse = await this.callLLM(prompt, systemPrompt);

    // Parse LLM response (with fallback for malformed JSON)
    let parsed: any;
    try {
      const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      parsed = null;
    }

    // Use parsed data or fall back to synthetic defaults
    const bidRec = parsed?.bidRecommendation ?? 'Bid';
    const rationale = parsed?.rationale ?? 'Capability assessment indicates strong match for EV traction inverter development.';
    const strengths = parsed?.strengths ?? ['Power electronics expertise', 'Thermal management capability', 'CAN interface experience'];
    const risks = parsed?.risks ?? ['800V HV layout experience limited', 'Functional safety gap (ISO 26262)', 'Export control review needed'];
    const exportControl = parsed?.exportControl ?? 'EAR99 assessment required; no immediate ITAR concerns identified.';
    const nextActions = parsed?.nextActions ?? 'Prepare proposal; initiate export control review; assign program manager.';
    const gapRows: GapMatrixRow[] = parsed?.gapMatrixRows ?? [
      { capabilityId: 'CAP-001', capabilityArea: 'Power Electronics Design', matchLevel: 'High', evidence: 'Multiple prior EV power stage programs', risk: 'Low', recommendedAction: 'Proceed' },
      { capabilityId: 'CAP-002', capabilityArea: 'Thermal Management', matchLevel: 'High', evidence: 'Liquid-cooled cold plate expertise', risk: 'Low', recommendedAction: 'Proceed' },
      { capabilityId: 'CAP-003', capabilityArea: 'HV PCB Layout (800V)', matchLevel: 'Medium', evidence: 'Up to 600V experience; 800V requires DFM audit', risk: 'Medium', recommendedAction: 'DFM review at Gate 3' },
      { capabilityId: 'CAP-004', capabilityArea: 'CAN Interface Firmware', matchLevel: 'High', evidence: '5+ programs with automotive CAN', risk: 'Low', recommendedAction: 'Proceed' },
      { capabilityId: 'GAP-001', capabilityArea: 'Functional Safety (ISO 26262)', matchLevel: 'Gap', evidence: 'No certified staff currently', risk: 'High', recommendedAction: 'Subcontract or training required' },
      { capabilityId: 'GAP-002', capabilityArea: 'Export Control Assessment', matchLevel: 'Low', evidence: 'Application TBD; EAR99 likely', risk: 'Medium', recommendedAction: 'Legal review before proposal submission' },
    ];

    // Generate two compact outputs (CA-01, CA-02, CA-03, CA-04, CA-05)
    const [summaryResult, matrixResult] = await Promise.all([
      generateOpportunitySummary({
        projectId: context.projectId,
        productName: 'EV-INV-800 Demonstration Traction Inverter',
        customerName: 'Customer (from RFQ)',
        applicationArea: 'Passenger Electric Vehicle Traction',
        rfqReference: 'RFQ-EV-2026-001',
        bidRecommendation: bidRec,
        recommendationRationale: rationale,
        keyStrengths: strengths,
        keyRisks: risks,
        exportControlStatus: exportControl,
        nextActions,
      }),
      generateCapabilityGapMatrix(gapRows),
    ]);

    // Register outputs in phase_outputs table (max 2 per phase — AC-03 enforced)
    const PROJECT_ID = 'EVINV-POC-001';
    await db.insert(phaseOutputs).values([
      {
        projectId: PROJECT_ID,
        phaseId: 0 as any,
        outputName: 'Opportunity Summary and Bid/No-Bid Recommendation',
        artifactType: 'DOCX',
        sizeGuidance: '~1–2 pages',
        artifactId: summaryResult.artifactId,
        versionRef: 'v1',
        approvalStatus: 'AwaitingReview',
        reviewRequired: true,
      },
      {
        projectId: PROJECT_ID,
        phaseId: 0 as any,
        outputName: 'Capability-Match and Critical-Gap Matrix',
        artifactType: 'XLSX',
        sizeGuidance: '≤10 rows',
        artifactId: matrixResult.artifactId,
        versionRef: 'v1',
        approvalStatus: 'AwaitingReview',
        reviewRequired: true,
      },
    ]);

    // Transition phase to AwaitingGate
    const aiRec = this.buildAIRecommendation(parsed?.recommendedGateOutcome ?? 'Pass', rationale);
    await db.update(phaseStates)
      .set({ phaseState: 'AwaitingGate', gateState: 'Open', aiRecommendation: aiRec as any })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 0 as any)));

    return {
      phaseId: 0,
      outputs: [
        { outputName: 'Opportunity Summary', artifactType: 'DOCX', artifactId: summaryResult.artifactId, storageUri: summaryResult.storageUri, disclaimerPresent: true },
        { outputName: 'Capability-Match and Critical-Gap Matrix', artifactType: 'XLSX', artifactId: matrixResult.artifactId, storageUri: matrixResult.storageUri, rowCount: matrixResult.rowCount, disclaimerPresent: true },
      ],
      findings: [],
      aiRecommendation: aiRec,
      contextUsed: { projectId: context.projectId, phaseId: context.phaseId },
    };
  }
}
