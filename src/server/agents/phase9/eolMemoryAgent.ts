import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generateEOLDecisionPack, generateClosureAndMemoryRecord, ClosureRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, projectState } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { SYNTHETIC_DISCLAIMER } from '@/server/artifacts/artifactGenerator';

const PROJECT_ID = 'EVINV-POC-001';

const CLOSURE_DATA: ClosureRow[] = [
  { recordId: 'ARCH-001', type: 'Design Archive', description: 'PCB design files and Gerbers — EV-INV-800 Rev D', finalStatus: 'Archived', retentionRequirement: '10 years per TT record policy', disposalRequirement: 'N/A', responsibleRole: 'ECAD Engineer', closureStatus: 'Complete' },
  { recordId: 'ARCH-002', type: 'BOM Archive', description: 'Final released BOM Rev D with ECN history', finalStatus: 'Archived', retentionRequirement: '10 years', disposalRequirement: 'N/A', responsibleRole: 'Engineering Manager', closureStatus: 'Complete' },
  { recordId: 'INV-001', type: 'Final Production', description: 'Last-time-buy build — 420 units (PO-EOL-2027-001)', finalStatus: 'In production (planned completion 2027-06)', retentionRequirement: 'Ship all units', disposalRequirement: 'Remaining stock: scrap per EHS policy', responsibleRole: 'Supply Chain', closureStatus: 'In Progress' },
  { recordId: 'TOOL-001', type: 'Tooling', description: 'Cold plate press-fit tooling set TL-4412 (2 sets)', finalStatus: 'In storage', retentionRequirement: 'Until last order + 2 years', disposalRequirement: 'Dispose or sell after retention period', responsibleRole: 'Manufacturing Engineering', closureStatus: 'Pending' },
  { recordId: 'CONTRACT-001', type: 'Customer Notification', description: 'EOL notification per customer contract terms', finalStatus: 'Sent (2026-07-01)', retentionRequirement: 'Retain with project record', disposalRequirement: 'N/A', responsibleRole: 'Commercial', closureStatus: 'Complete' },
  { recordId: 'ERP-001', type: 'ERP Update', description: 'Update ERP material status to Obsolete for EVINV-POC-001', finalStatus: 'Pending Gate 9 approval', retentionRequirement: 'N/A', disposalRequirement: 'N/A', responsibleRole: 'Supply Chain', closureStatus: 'Pending Gate 9' },
  { recordId: 'MEM-001', type: 'Institutional Memory', description: 'Lessons-learned register, key decisions register, design rationale — transferred to TT engineering knowledge base', finalStatus: 'Transferred', retentionRequirement: 'Permanent', disposalRequirement: 'N/A', responsibleRole: 'Engineering Manager', closureStatus: 'Complete' },
];

export class EOLMemoryAgent extends BaseAgent {
  constructor() { super(9, 'EOLMemoryAgent', 8000); }

  async run(context: AgentContext): Promise<AgentResult> {
    const systemPrompt = this.buildSystemPrompt(9);
    const prompt = `Phase 9 End-of-Life for EVINV-POC-001 (EV-INV-800).
Background: IGBT-HV-800-A PDN received (Gate 8). EOL process initiated. Last-time-buy build in progress (420 units).

Write a concise EOL and Last-Time-Buy Decision Pack (~1 page summary):
1. EOL trigger (IGBT-HV-800-A discontinuance)
2. Last-time-buy decision: 420 units at distributor; final production run (PO-EOL-2027-001)
3. Customer notification status: sent 2026-07-01
4. Project closure actions: ERP update pending Gate 9; tooling retained 2 years; design archived
5. Institutional memory transferred
6. Recommend Gate 9 Pass and project closure.
Mark as synthetic POC data.`;

    const narrative = await this.callLLM(prompt, systemPrompt, 3000);

    const eolContent = `# EOL and Last-Time-Buy Decision Pack

**Project:** EVINV-POC-001 | **Phase:** 9 — End of Life | **Gate:** 9

${narrative}

---
${SYNTHETIC_DISCLAIMER}
*This document is advisory. Gate 9 Pass and project closure require authorized human approval.*`;

    const [eolResult, closureResult] = await Promise.all([
      generateEOLDecisionPack(eolContent),
      generateClosureAndMemoryRecord(CLOSURE_DATA),
    ]);

    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 9 as any)));
    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        { projectId: PROJECT_ID, phaseId: 9, outputName: 'EOL and Last-Time-Buy Decision Pack', artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: eolResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
        { projectId: PROJECT_ID, phaseId: 9, outputName: 'Project Closure and Institutional-Memory Record', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: closureResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      ]);
    }

    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate', gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation('Pass', 'EOL process complete. Last-time-buy in production. Institutional memory transferred. Recommend Gate 9 Pass and project closure.') as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 9 as any)));

    // Gate 9 Pass sets projectStatus to 'Closed' — DB-persisted (not UI state)
    // Note: actual Closed status is set in the gate decide route on Pass decision
    // This agent marks phase as AwaitingGate only; closure requires human Gate 9 Pass

    return {
      phaseId: 9, outputs: [
        { outputName: 'EOL and Last-Time-Buy Decision Pack', artifactType: 'DOCX', artifactId: eolResult.artifactId, storageUri: eolResult.storageUri, disclaimerPresent: true },
        { outputName: 'Project Closure and Institutional-Memory Record', artifactType: 'XLSX', artifactId: closureResult.artifactId, storageUri: closureResult.storageUri, rowCount: closureResult.rowCount, disclaimerPresent: true },
      ],
      findings: [],
      aiRecommendation: this.buildAIRecommendation('Pass', 'EOL complete. Recommend Gate 9 Pass and project Closed status.'),
      contextUsed: { projectId: context.projectId, phaseId: 9 },
    };
  }
}
