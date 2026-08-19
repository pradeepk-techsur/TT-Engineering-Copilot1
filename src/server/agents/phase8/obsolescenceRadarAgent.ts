import { BaseAgent } from '@/server/agents/base/agentBase';
import { AgentContext } from '@/shared/types/projectState';
import { AgentResult } from '@/server/agents/base/agentTypes';
import { generateObsolescenceForecast, generateYieldQualityAnomalyReport, ObsolescenceRiskRow } from './outputGenerators';
import { db } from '@/db';
import { phaseOutputs, phaseStates, findings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { SYNTHETIC_DISCLAIMER } from '@/server/artifacts/artifactGenerator';

const PROJECT_ID = 'EVINV-POC-001';

// SI-08: IGBT-HV-800-A fictional discontinuance notice — triggers EOL recommendation
const SUPPLIER_DATA: ObsolescenceRiskRow[] = [
  // SI-08: Primary SiC power module — fictional PDN triggers EOL storyline
  { mpn: 'IGBT-HV-800-A', description: 'SiC Power Module 800V 300A', noticeType: 'PDN — Product Discontinuance Notice', noticeDate: '2026-06-15', lastOrderDate: '2027-03-31', distributorStock: 420, leadTimeWeeks: 26, suggestedAlternate: 'SiC-HV-900-B', alternateStatus: 'Not qualified; requires full redesign + requalification (18–24 months)', riskLevel: 'Critical — triggers EOL assessment' },
  { mpn: 'GD-ISO-4A', description: 'Gate Driver IC isolated', noticeType: 'None', noticeDate: 'N/A', lastOrderDate: 'N/A', distributorStock: 2800, leadTimeWeeks: 8, suggestedAlternate: 'N/A', alternateStatus: 'Active', riskLevel: 'Low' },
  { mpn: 'CAP-DC-900V-100U', description: 'DC Link Capacitor 900V 100µF', noticeType: 'PCN — Package change', noticeDate: '2026-04-01', lastOrderDate: 'N/A', distributorStock: 1200, leadTimeWeeks: 10, suggestedAlternate: 'CAP-DC-900V-100U-B', alternateStatus: 'Drop-in with requalification', riskLevel: 'Medium' },
  { mpn: 'CURR-SENS-200A', description: 'Current Sensor 200A Hall effect', noticeType: 'None', noticeDate: 'N/A', lastOrderDate: 'N/A', distributorStock: 4500, leadTimeWeeks: 6, suggestedAlternate: 'N/A', alternateStatus: 'Active', riskLevel: 'Low' },
  { mpn: 'CONN-CAN-4P', description: 'CAN Connector 4-pin sealed', noticeType: 'None', noticeDate: 'N/A', lastOrderDate: 'N/A', distributorStock: 8200, leadTimeWeeks: 4, suggestedAlternate: 'N/A', alternateStatus: 'Active', riskLevel: 'Low' },
];

export class ObsolescenceRadarAgent extends BaseAgent {
  constructor() { super(8, 'ObsolescenceRadarAgent', 8000); }

  async run(context: AgentContext): Promise<AgentResult> {
    // SI-08: Detect IGBT-HV-800-A discontinuance
    const igbtItem = SUPPLIER_DATA.find(d => d.mpn === 'IGBT-HV-800-A');
    const hasCriticalObsolescence = igbtItem?.riskLevel.includes('Critical');

    // Raise SI-08 finding
    if (hasCriticalObsolescence) {
      await db.insert(findings).values({
        findingId: 'F8-001',
        sourcePhase: 8 as any, sourceGate: 8 as any,
        detectedBy: 'AgentAnalysis',
        description: `Primary power semiconductor IGBT-HV-800-A received PDN-2026-IGBT001 (Product Discontinuance Notice, Last Order Date 2027-03-31). Suggested alternate SiC-HV-900-B requires full redesign and requalification (18–24 months). Remaining demand (420 units at distributor) does not justify redevelopment investment. EOL process recommended.`,
        severity: 'Critical', status: 'Open', seeded: true,  // SI-08
      }).onConflictDoNothing();
    }

    // LLM narrative
    const systemPrompt = this.buildSystemPrompt(8);
    const prompt = `Phase 8 Yield & Obsolescence Radar for EVINV-POC-001 (EV-INV-800).
Both inputs are SIMULATED SYSTEM INTAKE (no user file upload for Phase 8).

CRITICAL FINDING (SI-08): IGBT-HV-800-A — PDN received. Alternate requires full redesign.
Distributor stock: 420 units. Last order date: 2027-03-31.
Demand does not justify 18–24 month redevelopment program.

RECOMMENDATION: Gate 8 PASS to initiate Phase 9 End-of-Life process.

Write a concise Gate 8 EOL recommendation paragraph (~3 sentences).
Include: discontinuance trigger, EOL rationale (demand vs redevelopment cost), recommended Gate 8 outcome.
Cite fictional PDN notice PDN-2026-IGBT001. Mark as synthetic POC data.`;

    const narrative = await this.callLLM(prompt, systemPrompt, 2000);

    const reportContent = `# Yield, Quality, and Financial-Anomaly Report

**Project:** EVINV-POC-001 | **Phase:** 8 — Production & Sustaining | **Gate:** 8
**Gate 8 EOL Recommendation**

## Gate 8 EOL Assessment

${narrative}

## Production Health Summary

| Metric | Value |
|---|---|
| Production Status | Active (monitoring) |
| Critical Obsolescence Alert | IGBT-HV-800-A — PDN received (PDN-2026-IGBT001) |
| Last Order Date | 2027-03-31 |
| Distributor Stock | 420 units |
| Redevelopment Feasibility | No — 18–24 months; demand insufficient |
| Recommended Action | Initiate Phase 9 End-of-Life |

## Gate 8 Recommendation

**AI Recommendation: Pass — Initiate End-of-Life (Phase 9)**
*Advisory Only — Human decision required.*

${SYNTHETIC_DISCLAIMER}`;

    const [forecastResult, reportResult] = await Promise.all([
      generateObsolescenceForecast(SUPPLIER_DATA),
      generateYieldQualityAnomalyReport(reportContent),
    ]);

    const existingOutputs = await db.select().from(phaseOutputs)
      .where(and(eq(phaseOutputs.projectId, PROJECT_ID), eq(phaseOutputs.phaseId, 8 as any)));
    if (existingOutputs.length === 0) {
      await db.insert(phaseOutputs).values([
        { projectId: PROJECT_ID, phaseId: 8, outputName: 'Obsolescence and Supply-Risk Forecast', artifactType: 'XLSX', sizeGuidance: '≤10 rows', artifactId: forecastResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
        { projectId: PROJECT_ID, phaseId: 8, outputName: 'Yield, Quality, and Financial-Anomaly Report', artifactType: 'DOCX', sizeGuidance: '~1–2 pages', artifactId: reportResult.artifactId, versionRef: 'v1', approvalStatus: 'AwaitingReview', reviewRequired: true },
      ]);
    }

    await db.update(phaseStates).set({
      phaseState: 'AwaitingGate', gateState: 'Open',
      aiRecommendation: this.buildAIRecommendation('Pass', narrative + ' Gate 8 Pass initiates Phase 9 End-of-Life.', ['F8-001']) as any,
    }).where(and(eq(phaseStates.projectId, PROJECT_ID), eq(phaseStates.phaseId, 8 as any)));

    return {
      phaseId: 8, outputs: [
        { outputName: 'Obsolescence and Supply-Risk Forecast', artifactType: 'XLSX', artifactId: forecastResult.artifactId, storageUri: forecastResult.storageUri, rowCount: forecastResult.rowCount, disclaimerPresent: true },
        { outputName: 'Yield, Quality, and Financial-Anomaly Report', artifactType: 'DOCX', artifactId: reportResult.artifactId, storageUri: reportResult.storageUri, disclaimerPresent: true },
      ],
      findings: [{ findingId: 'F8-001', sourcePhase: 8, sourceGate: 8, detectedBy: 'AgentAnalysis', description: 'IGBT-HV-800-A PDN triggers EOL', severity: 'Critical', seeded: true }],
      aiRecommendation: this.buildAIRecommendation('Pass', 'IGBT-HV-800-A discontinuance triggers EOL. Gate 8 Pass recommended to initiate Phase 9.', ['F8-001']),
      contextUsed: { projectId: context.projectId, phaseId: 8 },
    };
  }
}
