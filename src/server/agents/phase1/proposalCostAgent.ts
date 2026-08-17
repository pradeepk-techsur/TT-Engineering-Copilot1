import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generateCostedProposal, generateResourceMilestoneSchedule, ResourceScheduleRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const PROJECT_ID = 'EVINV-POC-001';

export class ProposalCostAgent extends BaseAgent {
  constructor() { super(1, 'ProposalCostAgent', 8000); }

  async run(context: AgentContext): Promise<AgentResult> {
    const systemPrompt = this.buildSystemPrompt(1);
    const prompt = `Phase 1 — Business Case / Costed Proposal for EVINV-POC-001 (EV-INV-800, 800VDC, 150kW/220kW).
EXTERNAL INPUT: ${context.activeExternalInput?.logicalName} (customer requirements, quantities, supplier pricing)
INTERNAL INPUT: ${context.activeInternalInput?.logicalName} (preliminary BOM, labor rates, historical cost data)
Upstream approved: ${JSON.stringify(context.upstreamSummaries.map(s => s.outcome))}

Generate: (a) costed proposal summary with total cost breakdown and gross margin, (b) 7-row resource/milestone schedule covering kickoff through production readiness.
Format as JSON: {"totalMaterial": 1183, "totalLabor": 64000, "totalNRE": 45000, "margin": 28.5, "validity": "90 days from issue", "assumptions": [...3 items...], "summary": "...", "scheduleRows": [...7 rows...], "recommendedOutcome": "Pass"}`;

    const llmResponse = await this.callLLM(prompt, systemPrompt);
    let parsed: any;
    try { const m = llmResponse.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : null; } catch { parsed = null; }

    const defaultSchedule: ResourceScheduleRow[] = [
      { milestoneId: 'MS-001', milestone: 'Project Kickoff', plannedDate: '2026-09-01', laborCategory: 'Project Manager', hoursEstimate: 16, costEstimate: 1760, dependencies: 'PO received' },
      { milestoneId: 'MS-002', milestone: 'Requirements Baseline', plannedDate: '2026-09-22', laborCategory: 'System Engineer', hoursEstimate: 80, costEstimate: 10000, dependencies: 'MS-001' },
      { milestoneId: 'MS-003', milestone: 'Preliminary Design Review', plannedDate: '2026-11-10', laborCategory: 'Power Electronics Engineer', hoursEstimate: 160, costEstimate: 20000, dependencies: 'MS-002' },
      { milestoneId: 'MS-004', milestone: 'Critical Design Review', plannedDate: '2027-01-19', laborCategory: 'ECAD Engineer', hoursEstimate: 120, costEstimate: 11400, dependencies: 'MS-003' },
      { milestoneId: 'MS-005', milestone: 'Design Validation Complete', plannedDate: '2027-04-07', laborCategory: 'Power Electronics Engineer', hoursEstimate: 200, costEstimate: 25000, dependencies: 'MS-004' },
      { milestoneId: 'MS-006', milestone: 'Production Readiness Approval', plannedDate: '2027-06-16', laborCategory: 'Manufacturing Engineer', hoursEstimate: 80, costEstimate: 8800, dependencies: 'MS-005' },
      { milestoneId: 'MS-007', milestone: 'First Production Delivery', plannedDate: '2027-08-11', laborCategory: 'Project Manager', hoursEstimate: 40, costEstimate: 4400, dependencies: 'MS-006' },
    ];

    const [proposalResult, scheduleResult] = await Promise.all([
      generateCostedProposal({
        projectId: PROJECT_ID, proposalTitle: 'EV-INV-800 Traction Inverter Development Proposal',
        customerName: 'Customer (per RFQ-EV-2026-001)',
        totalMaterialCost: parsed?.totalMaterial ?? 64000,
        totalLaborCost: parsed?.totalLabor ?? 81200,
        totalNRE: parsed?.totalNRE ?? 45000,
        grossMarginPercent: parsed?.margin ?? 28.5,
        proposalValidity: parsed?.validity ?? '90 days from issue',
        keyAssumptions: parsed?.assumptions ?? ['Customer provides ICD within 2 weeks of PO', 'Functional safety scope limited to ASIL-B', 'Single-source SiC module accepted for prototype'],
        executiveSummary: parsed?.summary ?? 'TT Electronics proposes to develop the EV-INV-800 traction inverter (800VDC, 150kW continuous, 220kW peak) as an NPI A program. Preliminary costing indicates a total program cost of ~$190K with 28.5% gross margin.',
      }),
      generateResourceMilestoneSchedule(parsed?.scheduleRows ?? defaultSchedule),
    ]);

    await db.insert(phaseOutputs).values([
      { projectId: PROJECT_ID, phaseId: 1, outputName: 'Costed Proposal or Business Case', artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: proposalResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      { projectId: PROJECT_ID, phaseId: 1, outputName: 'Resource and Milestone Schedule', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: scheduleResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
    ]);

    await db.update(phaseStates).set({ phaseState: 'AwaitingGate', gateState: 'Open', aiRecommendation: this.buildAIRecommendation('Pass', 'Cost model complete; schedule defined; BOM preliminary; recommendation to approve for Phase 2.') as any })
      .where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 1 as any)));

    return {
      phaseId: 1, outputs: [
        { outputName: 'Costed Proposal', artifactType: 'DOCX', artifactId: proposalResult.artifactId, storageUri: proposalResult.storageUri, disclaimerPresent: true },
        { outputName: 'Resource and Milestone Schedule', artifactType: 'XLSX', artifactId: scheduleResult.artifactId, storageUri: scheduleResult.storageUri, rowCount: scheduleResult.rowCount, disclaimerPresent: true },
      ],
      findings: [], aiRecommendation: this.buildAIRecommendation('Pass', 'Business case complete.'),
      contextUsed: { projectId: context.projectId, phaseId: 1 },
    };
  }
}
