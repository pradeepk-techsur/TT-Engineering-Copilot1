export type CheckStatus = 'Pass' | 'Fail' | 'Warning';

export type CheckType =
  | 'CrossArtifactConsistency'
  | 'HVClearance'
  | 'ComponentDerating'
  | 'TestPointCoverage'
  | 'Cpk'
  | 'RequirementTestability'
  | 'ActionClosure'
  | 'CostCalc'
  | 'TraceabilityCompleteness'
  | 'InventoryReconciliation';

// Generic check item (per-component or per-net result detail)
export interface CheckItem {
  [key: string]: unknown;
}

// HV Clearance check item (FRD F05 §Check 2)
export interface HVClearanceItem extends CheckItem {
  net_pair: string;
  clearance_type: 'Air' | 'Creepage';
  measured_mm: number;
  threshold_mm: number;
  margin_mm: number;
  status: CheckStatus;
}

// Derating check item (FRD F05 §Check 3)
export interface DeratingItem extends CheckItem {
  ref_des: string;
  component_type: string;
  stress_parameter: string;
  rated_value: number;
  operating_value: number;
  unit: string;
  derating_margin_pct: number;
  threshold_pct: number;
  status: CheckStatus;
}

// Test point coverage item (FRD F05 §Check 4)
export interface TestPointItem extends CheckItem {
  net_name: string;
  test_point_ids: string[];
  accessible: boolean;
  status: CheckStatus;
}

// Cross-artifact consistency item (FRD F05 §Check 1)
export interface ConsistencyItem extends CheckItem {
  item_id: string;
  field_checked: string;
  value_in_internal: string;
  value_in_external: string;
  match: boolean;
  status: CheckStatus;
}

/**
 * Complete check tool result — all 13 FRD F05 fields.
 * This is what gets written to the check_results table.
 */
export interface CheckToolResult {
  checkId: string;                    // UUID
  checkType: CheckType;
  phaseId: number;                    // 0–9
  inputVersionId: string;
  formulaOrMethod: string;
  threshold: string;
  thresholdUnit: string;
  resultValue: string;
  resultUnit: string;
  status: CheckStatus;
  sourceReference: string;            // Must cite EVINV-POC-STD-001 with Synthetic label
  limitation: string;
  itemsChecked: CheckItem[];
  runAt: string;                      // ISO 8601
}
