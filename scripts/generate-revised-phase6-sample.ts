/**
 * Generates the revised Phase 6 synthetic MES sample XLSX.
 * Run: npx tsx scripts/generate-revised-phase6-sample.ts
 * 
 * This is the "Post-Corrective Action" version:
 * - SOLDER_JOINT_SHEAR_HV_BUS: mean=32.2, std=0.7 → Cpk ≥ 1.33 (corrected)
 */

import * as XLSX from 'xlsx';
import path from 'path';
import { writeFileSync } from 'fs';

const DISCLAIMER = 'Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.';

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  [DISCLAIMER],
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '6', 'Rev B — Post-Corrective Action'],
  [],
  [
    'Process Step', 'Process Characteristic', 'PFMEA Risk', 'Process Control',
    'Equipment', 'Spec Lower Limit', 'Spec Upper Limit', 'Mean', 'Std Dev',
    'Cpk (calculated)', 'Evidence / Action',
  ],
  // Revised: SOLDER_JOINT_SHEAR_HV_BUS corrected — reflow profile updated
  ['SMT Reflow (Revised)', 'Solder Joint Shear Strength (HV Bus)', 'Reduced (RPN 48)', 'SPC + new reflow profile', 'Reflow oven TZ-400 (Profile Rev B)', 28, 35, 32.2, 0.7, 1.43, 'Corrective action closed — reflow profile updated; Cpk now 1.43 ≥ 1.33'],
  ['HV Bus Press-Fit', 'Press-Fit Insertion Force', 'Medium (RPN 64)', 'Force monitor', 'Arbor press FP-200', 450, 650, 548, 28, 1.21, 'Within threshold'],
  ['Module Mounting', 'Bracket Torque (MOP-012)', 'Medium (RPN 72)', 'Torque wrench calibration', 'Torque wrench TW-50', 3.0, 4.0, 3.45, 0.61, 0.30, 'High variation — training ongoing'],
  ['Cold Plate Assembly', 'Coolant Port Leak Test', 'High (RPN 108)', '100% leak test at 3 bar', 'Leak tester LT-100', 0, 0, 0, 0, 'N/A', 'Pass — no leaks in 50 units'],
  ['Final Test', 'Output Power Accuracy', 'Medium (RPN 56)', 'End-of-line power test', 'Load bank LB-500', 148, 152, 150.4, 0.7, 1.45, 'Within threshold'],
  ['Enclosure Sealing', 'IP67 Test Compliance', 'Low (RPN 24)', 'Batch sampling', 'IP test tank', '100%', '100%', '100%', 'N/A', 'N/A', 'All sampled units pass'],
]);
XLSX.utils.book_append_sheet(wb, ws, 'Data');

const outPath = path.join(process.cwd(), 'public', 'samples', 'phase6-int-manufacturing-capability-revised.xlsx');
const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync(outPath, xlsxBuffer);
console.log('Generated: phase6-int-manufacturing-capability-revised.xlsx');
console.log('Path:', outPath);
