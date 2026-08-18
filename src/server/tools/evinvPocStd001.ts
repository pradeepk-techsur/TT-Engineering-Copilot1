/**
 * EVINV-POC-STD-001: EV Traction Inverter Design and Manufacturing Standard, POC Demonstration Edition
 * Version: 1.0
 * Status: SYNTHETIC POC STANDARD — not an approved TT Electronics or industry standard.
 * Use: POC demonstration only. All threshold values are synthetic.
 */

export const POC_STD_LABEL = 'Synthetic POC Standard, not an approved TT or industry standard';

export const EVINV_POC_STD_001 = {
  documentId: 'EVINV-POC-STD-001',
  title: 'EV Traction Inverter Design and Manufacturing Standard, POC Demonstration Edition',
  version: '1.0',
  syntheticLabel: POC_STD_LABEL,
  status: 'Synthetic POC Standard',

  /** §3.1 — High-Voltage Clearance and Creepage Requirements */
  clearance: {
    hvAir_mm: 8.0,        // Air clearance minimum for HV nets (≥60V), in mm
    hvCreepage_mm: 5.0,   // Creepage distance minimum, in mm
    unit: 'mm',
    clause: 'EVINV-POC-STD-001 §3.1 (Synthetic POC Standard)',
  },

  /** §3.3 — Component Stress and Derating Limits */
  derating: {
    capacitorVoltage_pct: 50,   // Minimum voltage derating margin for capacitors, %
    mosfetVds_pct: 30,           // Minimum VDS derating margin for MOSFETs, %
    diodeVrrm_pct: 30,           // Minimum VRRM derating margin for diodes, %
    unit: '%',
    clause: 'EVINV-POC-STD-001 §3.3 (Synthetic POC Standard)',
  },

  /** §4.2 — Diagnostic Accessibility Requirements */
  testPoint: {
    minPerDiagnosticNet: 1,      // Minimum accessible test points per diagnostic net
    unit: 'count per diagnostic net',
    clause: 'EVINV-POC-STD-001 §4.2 (Synthetic POC Standard)',
  },

  /** §2.1 — Cross-Document Consistency Requirements */
  consistency: {
    maxMismatches: 0,            // Zero mismatches for Pass
    clause: 'EVINV-POC-STD-001 §2.1 (Synthetic POC Standard)',
  },

  /** §5.1 — Process Capability Requirements */
  cpk: {
    threshold: 1.33,
    unit: 'dimensionless',
    clause: 'EVINV-POC-STD-001 §5.1 (Synthetic POC Standard)',
  },
} as const;
