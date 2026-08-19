import { generateXlsx, generateDocx } from '@/server/artifacts/artifactGenerator';

export interface ObsolescenceRiskRow {
  mpn: string; description: string; noticeType: string; noticeDate: string;
  lastOrderDate: string; distributorStock: number; leadTimeWeeks: number;
  suggestedAlternate: string; alternateStatus: string; riskLevel: string;
}

export interface YieldQualityRow {
  bomPart: string; mpn: string; usageQty: number; inventory: number;
  forecastDemand: number; yieldPct: number; scrapPct: number;
  unitCostUSD: number; qualityStatus: string; redesignImpact: string;
}

export async function generateObsolescenceForecast(rows: ObsolescenceRiskRow[], phaseId = 8) {
  const xlsxRows = rows.map(r => ({
    'MPN': r.mpn, 'Description': r.description, 'Notice Type': r.noticeType,
    'Notice Date': r.noticeDate, 'Last Order Date': r.lastOrderDate,
    'Dist. Stock': r.distributorStock, 'Lead Time (wk)': r.leadTimeWeeks,
    'Alternate': r.suggestedAlternate, 'Alt Status': r.alternateStatus, 'Risk': r.riskLevel,
  }));
  return generateXlsx(xlsxRows, 'phase8-obsolescence-supply-risk-forecast.xlsx', phaseId, 8, 'obsolescence-radar-agent');
}

export async function generateYieldQualityAnomalyReport(content: string, phaseId = 8) {
  return generateDocx(content, 'phase8-yield-quality-financial-anomaly-report.txt', phaseId, 8, 'obsolescence-radar-agent');
}
