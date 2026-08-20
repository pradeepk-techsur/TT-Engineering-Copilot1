import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface CostedProposalData {
  projectId: string; proposalTitle: string; customerName: string;
  totalMaterialCost: number; totalLaborCost: number; totalNRE: number;
  grossMarginPercent: number; proposalValidity: string;
  keyAssumptions: string[]; executiveSummary: string;
}

export interface ResourceScheduleRow {
  milestoneId: string; milestone: string; plannedDate: string;
  laborCategory: string; hoursEstimate: number; costEstimate: number;
  dependencies: string;
}

export async function generateCostedProposal(data: CostedProposalData, phaseId = 1) {
  const content = `# Costed Proposal / Business Case

**Project:** ${data.projectId} | **Phase:** 1 — Concept & Proposal
**Customer:** ${data.customerName}
**Title:** ${data.proposalTitle}

## Executive Summary
${data.executiveSummary}

## Cost Summary

| Category | Amount (USD) |
|---|---|
| Material Cost (BOM) | $${data.totalMaterialCost.toLocaleString()} |
| Labor Cost | $${data.totalLaborCost.toLocaleString()} |
| Non-Recurring Engineering | $${data.totalNRE.toLocaleString()} |
| **Total Proposal Value** | **$${(data.totalMaterialCost + data.totalLaborCost + data.totalNRE).toLocaleString()}** |
| Gross Margin | ${data.grossMarginPercent}% |
| Proposal Validity | ${data.proposalValidity} |

## Key Assumptions
${data.keyAssumptions.map((a, i) => `${i + 1}. ${a}`).join('\n')}

---
*Draft — Advisory Only. Requires authorized commercial approval before submission.*`;

  return generateDocx(content, 'phase1-costed-proposal.txt', phaseId, 1, 'proposal-cost-agent');
}

export async function generateResourceMilestoneSchedule(rows: ResourceScheduleRow[], phaseId = 1) {
  const xlsxRows = rows.map(r => ({
    'Milestone ID': r.milestoneId, 'Milestone': r.milestone,
    'Planned Date': r.plannedDate, 'Labor Category': r.laborCategory,
    'Hours Estimate': r.hoursEstimate, 'Cost Estimate (USD)': r.costEstimate,
    'Dependencies': r.dependencies,
  }));
  return generateXlsx(xlsxRows, 'phase1-resource-milestone-schedule.xlsx', phaseId, 1, 'proposal-cost-agent');
}
