import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generateLessonsLearnedRegister, generateTransferReport, LessonsLearnedRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, findings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { SYNTHETIC_DISCLAIMER } from '@/server/artifacts/artifactGenerator';

const PROJECT_ID = 'EVINV-POC-001';

// SI-07: Torque variation in MOP-012-BRACKET-MOUNT (2.1–4.8 N·m; spec 3.5±0.5)
const LESSONS_DATA: LessonsLearnedRow[] = [
  {
    lessonId: 'LL-001', category: 'Process Variability', phase: 'Phase 6–7',
    description: 'Torque variation in MOP-012 bracket mounting operation (2.1–4.8 N·m; spec 3.5±0.5 N·m). Torque wrench calibration inconsistency and operator technique variation.',
    rootCause: 'Manual torque wrench without torque indication feedback; operator variability in technique',
    correctiveAction: 'Upgrade to click-type torque wrench with calibration certificate; implement operator re-training and SPC monitoring for this operation.',
    applicableFuturePhases: 'Apply to all torque-sensitive assembly operations in future NPI programs',
    status: 'Action In Progress',
  },
  {
    lessonId: 'LL-002', category: 'DFM/Assembly', phase: 'Phase 3',
    description: 'Coolant connector orientation (A3-001) required design change. Early DFM review should include 3D assembly simulation.',
    rootCause: 'Insufficient assembly access analysis at preliminary design stage',
    correctiveAction: 'Add assembly access simulation to Phase 3 DFM checklist for future programs.',
    applicableFuturePhases: 'Phase 3 DFM review — all future NPI programs',
    status: 'Closed',
  },
  {
    lessonId: 'LL-003', category: 'Quality / Cpk', phase: 'Phase 6',
    description: 'Solder joint Cpk below threshold on first qualification build (Cpk 0.87 vs 1.33). Reflow profile required adjustment.',
    rootCause: 'Reflow profile not optimized for new 800V-class power module pad geometry',
    correctiveAction: 'Optimize reflow profile early in Phase 5; perform Cpk pilot run before Phase 6 qualification.',
    applicableFuturePhases: 'Phase 5 validation planning for future high-power programs',
    status: 'Closed',
  },
  {
    lessonId: 'LL-004', category: 'Requirements', phase: 'Phase 2',
    description: 'REQ-THERM-004 initial revision lacked measurable acceptance criterion. Added TP-CASE-1 thermocouple criterion in Phase 2.',
    rootCause: 'Requirements review missed testability of thermal stability requirement',
    correctiveAction: 'Apply RequirementTestability check at requirements stage for all future programs.',
    applicableFuturePhases: 'Phase 2 requirements review — all future NPI programs',
    status: 'Closed',
  },
  {
    lessonId: 'LL-005', category: 'Supply Chain', phase: 'Phase 8',
    description: 'Primary SiC power module IGBT-HV-800-A received PDN (discontinuance notice). EOL process initiated.',
    rootCause: 'Supplier lifecycle monitoring not integrated into Phase 4/6 reviews',
    correctiveAction: 'Integrate supplier lifecycle feed into Phase 4 BOM health check for future programs.',
    applicableFuturePhases: 'Phase 4 CDR BOM health check — all future NPI programs',
    status: 'Open (EOL process ongoing)',
  },
];

export class LessonsLearnedAgent extends BaseAgent {
  constructor() { super(7, 'LessonsLearnedAgent', 8000); }

  async run(context: AgentContext): Promise<AgentResult> {
    // Raise SI-07 finding (torque variation)
    await db.insert(findings).values({
      findingId: 'F7-001',
      sourcePhase: 7 as any, sourceGate: 7 as any,
      detectedBy: 'AgentAnalysis',
      description: 'Production defect (non-blocking lessons learned): Torque variation in MOP-012-BRACKET-MOUNT operation (2.1–4.8 N·m; specification 3.5±0.5 N·m). Captured in Lessons-Learned Register as LL-001. Action A7-001 raised — non-blocking.',
      severity: 'Observation', status: 'Open', seeded: true,  // SI-07
    }).onConflictDoNothing();

    // LLM for transfer narrative
    const systemPrompt = this.buildSystemPrompt(7);
    const prompt = `Phase 7 Transfer & Monitor for EVINV-POC-001.
5 lessons captured. Key lessons:
- LL-001 (SI-07): MOP-012 torque variation — action in progress
- LL-002: Coolant connector DFM (closed), LL-003: Solder joint Cpk (closed), LL-004: REQ-THERM-004 testability (closed), LL-005: Supply chain lifecycle (ongoing EOL)
First pass yield build 2: 94.8% FPY (improved from 91.4% after corrective actions).
Transfer to operations: complete. Recommend Gate 7 Pass.
Write a concise transfer completeness summary (~1 paragraph). Cite ENG 001 v4.1.`;

    const narrative = await this.callLLM(prompt, systemPrompt, 2000);

    const transferContent = `# Transfer-Completeness and Improvement-Action Report

**Project:** EVINV-POC-001 | **Phase:** 7 — Transfer & Monitor | **Gate:** 7

## Transfer Status

${narrative}

## Key Performance Indicators

| Metric | Value |
|---|---|
| First Pass Yield (Build 1) | 91.4% |
| First Pass Yield (Build 2) | 94.8% (improved after corrective actions) |
| Open Lessons-Learned Actions | 2 (LL-001 in progress, LL-005 ongoing EOL) |
| Closed Actions from Gates 3–6 | A3-001, A4-001–A4-004, A5-001, A6-001 |

## Improvement Actions

| Action | Status |
|---|---|
| A7-001: MOP-012 torque wrench upgrade and re-training | In Progress (non-blocking) |

---
*Transfer to Operations approved pending Gate 7 human decision. ${SYNTHETIC_DISCLAIMER}*`;

    const [registerResult, transferResult] = await Promise.all([
      generateLessonsLearnedRegister(LESSONS_DATA),
      generateTransferReport(transferContent),
    ]);

    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 7 as any)));
    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        { projectId: PROJECT_ID, phaseId: 7, outputName: 'Structured Lessons-Learned Register', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: registerResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
        { projectId: PROJECT_ID, phaseId: 7, outputName: 'Transfer-Completeness and Improvement-Action Report', artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: transferResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      ]);
    }

    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate', gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation('Pass', narrative + ' MOP-012 torque action non-blocking; transfer recommended.', ['F7-001']) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 7 as any)));

    return {
      phaseId: 7, outputs: [
        { outputName: 'Lessons-Learned Register', artifactType: 'XLSX', artifactId: registerResult.artifactId, storageUri: registerResult.storageUri, rowCount: registerResult.rowCount, disclaimerPresent: true },
        { outputName: 'Transfer-Completeness Report', artifactType: 'DOCX', artifactId: transferResult.artifactId, storageUri: transferResult.storageUri, disclaimerPresent: true },
      ],
      findings: [{ findingId: 'F7-001', sourcePhase: 7, sourceGate: 7, detectedBy: 'AgentAnalysis', description: 'MOP-012 torque variation captured in lessons-learned', severity: 'Observation', seeded: true }],
      aiRecommendation: this.buildAIRecommendation('Pass', 'Transfer complete. MOP-012 action non-blocking. Recommend Gate 7 Pass.', ['F7-001']),
      contextUsed: { projectId: context.projectId, phaseId: 7 },
    };
  }
}
