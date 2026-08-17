import * as XLSX from 'xlsx';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const DISCLAIMER = 'Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.';

function makeSample(sheetData: (string | number)[][], fileName: string) {
  const dir = path.join(process.cwd(), 'public', 'samples');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const wb = XLSX.utils.book_new();
  // Add disclaimer as first row
  const withDisclaimer = [[DISCLAIMER], ...sheetData];
  const ws = XLSX.utils.aoa_to_sheet(withDisclaimer);
  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, path.join(dir, fileName));
  console.log(`Generated: ${fileName}`);
}

// Phase 0 internal — Capability & Opportunity Assessment (Salesforce/Cora)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '0', 'Rev A'],
  ['Capability ID', 'Capability Area', 'Match', 'Experience (years)', 'Capacity', 'Risk', 'Notes'],
  ['CAP-001', 'Power Electronics Design', 'High', 4, 'Available', 'Low', 'EV inverter experience at Plano'],
  ['CAP-002', 'Thermal Management', 'High', 3, 'Available', 'Low', 'Liquid-cooled cold plate expertise'],
  ['CAP-003', 'High-Voltage PCB Layout', 'Medium', 2, 'Available', 'Medium', 'Up to 600VDC; 800V requires DFM review'],
  ['CAP-004', 'CAN Interface Firmware', 'High', 5, 'Available', 'Low', 'Multiple prior programs'],
  ['CAP-005', 'Sealed Aluminum Enclosure', 'Medium', 2, 'Partial', 'Medium', 'Subcontract tooling review needed'],
  ['GAP-001', 'Export Control — EAR99', 'Review Required', 0, 'N/A', 'Medium', 'Customer application TBD'],
  ['GAP-002', 'Functional Safety (ISO 26262)', 'Gap', 1, 'N/A', 'High', 'No current IEC 26262 certified staff'],
], 'phase0-int-capability-assessment.xlsx');

// Phase 1 internal — Preliminary Cost & Resource (Cora/historical)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '1', 'Rev A'],
  ['Item ID', 'Description', 'Category', 'Unit Cost (USD)', 'Quantity', 'Total (USD)', 'Lead Time (weeks)', 'Source'],
  ['BOM-001', 'SiC Power Module (main)', 'Semiconductor', 280, 2, 560, 12, 'Parametric estimate'],
  ['BOM-002', 'Gate Driver IC', 'Semiconductor', 18, 4, 72, 8, 'Parametric estimate'],
  ['BOM-003', 'DC Link Capacitor (900V)', 'Passive', 45, 6, 270, 10, 'Parametric estimate'],
  ['BOM-004', 'Current Sensor', 'Sensor', 32, 3, 96, 6, 'Parametric estimate'],
  ['BOM-005', 'Aluminum Housing (cast)', 'Mechanical', 185, 1, 185, 14, 'Parametric estimate'],
  ['LAB-001', 'Power Electronics Engineer', 'Labor', 125, 320, 40000, 0, 'Labor rate card'],
  ['LAB-002', 'ECAD Engineer', 'Labor', 95, 160, 15200, 0, 'Labor rate card'],
  ['LAB-003', 'Project Manager', 'Labor', 110, 80, 8800, 0, 'Labor rate card'],
], 'phase1-int-cost-resource.xlsx');

// Phase 2 internal — Draft System Requirements (requirements repo/Cora)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '2', 'Rev A'],
  ['Req ID', 'Requirement Text', 'Type', 'Parent', 'Interface', 'Subsystem', 'Acceptance Criterion', 'Verification Method', 'Owner Role', 'Status'],
  ['SYS-001', 'Nominal DC input voltage shall be 800 VDC', 'Direct', 'CUST-001', 'Power Input', 'Power Stage', '≥800V ±5% under nominal load', 'Test', 'Design Engineer', 'Draft'],
  ['SYS-002', 'Operating range shall be 550–920 VDC', 'Direct', 'CUST-002', 'Power Input', 'Power Stage', 'Operates without shutdown at 550V and 920V', 'Test', 'Design Engineer', 'Draft'],
  ['SYS-003', 'Continuous output power ≥150 kW', 'Direct', 'CUST-003', 'Motor Output', 'Power Stage', 'Output ≥150kW for ≥30 min at rated voltage', 'Test', 'Design Engineer', 'Draft'],
  ['SYS-004', 'Peak output power ≥220 kW for ≥10 seconds', 'Direct', 'CUST-004', 'Motor Output', 'Power Stage', 'Output ≥220kW for 10s without shutdown', 'Test', 'Design Engineer', 'Draft'],
  ['SYS-005', 'Liquid-cooled cold plate; coolant inlet temperature ≤65°C', 'Direct', 'CUST-005', 'Thermal', 'Cooling', '≤65°C inlet per thermal test', 'Test', 'Mechanical Engineer', 'Draft'],
  ['SYS-006', 'CAN interface per customer specification CUST-ICD-001', 'Direct', 'CUST-006', 'Comms', 'Control', 'CAN frames per CUST-ICD-001 §4', 'Inspection', 'Software Engineer', 'Draft'],
  ['SYS-007', 'Sealed IP67 aluminum housing', 'Derived', 'SYS-005', 'Mechanical', 'Enclosure', 'IP67 per IEC 60529', 'Test', 'Mechanical Engineer', 'Draft'],
  ['SYS-008', 'Efficiency target — to be defined', 'Derived', 'SYS-003', 'Power', 'Power Stage', 'TBD — no measurable criterion defined', 'TBD', 'Design Engineer', 'Draft'],
], 'phase2-int-system-requirements.xlsx');

// Phase 3 external — Design Rules & Manufacturing Capabilities (standards library)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '3', 'Rev A'],
  ['Rule ID', 'Requirement', 'Feature Type', 'Threshold', 'Unit', 'Applicability', 'Process', 'Severity', 'Verification Method', 'Corrective Response'],
  ['DFM-001', 'Minimum trace/space for 800V class', 'Electrical Clearance', 8.0, 'mm', 'High-voltage bus traces', 'PCB Fab', 'Critical', 'DRC check', 'Increase clearance or reroute'],
  ['DFM-002', 'Component derating margin: voltage ≥50%', 'Component Derating', 50, '%', 'All passive components', 'Assembly', 'Critical', 'BOM audit', 'Replace with higher-rated component'],
  ['DFM-003', 'Minimum annular ring 0.15mm', 'PCB Fabrication', 0.15, 'mm', 'All via pads', 'PCB Fab', 'Major', 'DRC check', 'Increase pad size'],
  ['DFM-004', 'Test point accessibility: ≥1 per diagnostic net', 'Test Access', 1, 'per net', 'All diagnostic signal nets', 'Test', 'Critical', 'Test point audit', 'Add accessible test point'],
  ['DFM-005', 'Coolant connector orientation: must allow assembly access J-FAST-7 to J-FAST-10', 'Assembly Access', 0, 'clearance zone', 'Coolant connector CN-COOL-1', 'Assembly', 'Major', 'CAD review', 'Rotate or reposition connector'],
  ['DFM-006', 'Solder mask clearance ≥0.05mm from pad edge', 'Assembly', 0.05, 'mm', 'All SMD pads', 'PCB Fab', 'Minor', 'DRC check', 'Adjust solder mask aperture'],
  ['MFG-001', 'Pick and place component height ≤15mm', 'Assembly Height', 15, 'mm', 'All SMD components on primary side', 'Assembly', 'Major', 'Component audit', 'Select lower-profile component'],
], 'phase3-ext-design-rules.xlsx');

// Phase 4 external — DFM, Standards, Supplier-Risk (standards/supplier/obsolescence)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '4', 'Rev A'],
  ['POC Rule ID', 'Requirement', 'Applicability', 'Threshold', 'Unit', 'Required Evidence', 'Verification Method', 'Severity', 'Supplier Notice / Lifecycle', 'Corrective Response'],
  ['EVINV-POC-STD-001 §3.1', 'HV clearance VBUS+ to GND_SHIELD ≥8.0mm', 'High-voltage bus net pairs', 8.0, 'mm', 'PCB design file measurement per net pair', 'DeterministicCheck: HVClearance', 'Critical', 'N/A', 'Reroute or increase spacing'],
  ['EVINV-POC-STD-001 §3.3', 'Capacitor voltage derating margin ≥50%', 'All DC link capacitors', 50, '%', 'BOM manufacturer part number + rated voltage vs applied voltage', 'DeterministicCheck: ComponentDerating', 'Critical', 'N/A', 'Replace with higher-rated part'],
  ['EVINV-POC-STD-001 §4.1', 'Test point: ≥1 accessible TP per diagnostic net', 'DIAG_TEMP_IGBT_CASE net', 1, 'per net', 'Net-to-TP mapping from design file', 'DeterministicCheck: TestPointCoverage', 'Critical', 'N/A', 'Add TP to net'],
  ['EVINV-POC-STD-001 §2.1', 'BOM footprint vs design footprint match', 'All BOM components', 0, 'mismatches', 'Cross-reference BOM footprint vs placed footprint', 'DeterministicCheck: CrossArtifactConsistency', 'Major', 'N/A', 'Correct BOM or design entry'],
  ['SUPP-001', 'Primary SiC power module IGBT-HV-800-A', 'Q_HV_1 in BOM', 0, 'risk flags', 'Supplier lifecycle status check', 'SupplierFeed', 'High', 'Active — monitor PCN alerts', 'Qualify alternate if PCN received'],
  ['IPC-2221 §6', 'Minimum conductor spacing for 800V peak (external)', 6.4, 'mm', 'PCB layer spacing measurement', 'DRC', 'Critical', 'N/A', 'Increase spacing to comply'],
], 'phase4-ext-dfm-standards-supplier.xlsx');

// Phase 5 external — Test Methods & Customer Acceptance (standards/customer repo)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '5', 'Rev A'],
  ['Test Method ID', 'Customer Criterion', 'Requirement Ref', 'Test Method', 'Environment', 'Acceptance Threshold', 'Unit', 'Required Equipment', 'Evidence Expectation', 'Applicability'],
  ['TM-001', 'Output power ≥150kW continuous', 'SYS-003', 'Dynamometer load test', '25°C ambient, rated coolant', 150, 'kW', 'Dynamometer, power analyzer', 'Test report with power vs time trace', 'Mandatory'],
  ['TM-002', 'Peak power ≥220kW / 10s', 'SYS-004', 'Dynamometer peak load test', '25°C ambient', 220, 'kW for 10s', 'Dynamometer, power analyzer', 'Peak test data with timestamp', 'Mandatory'],
  ['TM-003', 'IGBT case temperature ≤85°C at 150kW', 'SYS-THM-001', 'Thermal test at rated load', '25°C ambient, 65°C coolant inlet', 85, '°C', 'Thermal camera, thermocouples', 'Thermal map at TP-CASE-1', 'Mandatory'],
  ['TM-004', 'CAN frame compliance', 'SYS-006', 'CAN protocol analyzer test', 'Bench', '100% frame pass', '%', 'CAN analyzer', 'Protocol trace log', 'Mandatory'],
  ['TM-005', 'Input voltage range 550–920VDC', 'SYS-002', 'Voltage sweep test', '25°C ambient', 'No shutdown at limits', 'Pass/Fail', 'Variable HV supply', 'Sweep log', 'Mandatory'],
  ['TM-006', 'IP67 ingress protection', 'SYS-007', 'Water immersion per IEC 60529', '1m depth, 30 min', 'No ingress', 'Pass/Fail', 'Water immersion tank', 'Post-test inspection report', 'Mandatory'],
], 'phase5-ext-test-methods-acceptance.xlsx');

// Phase 6 internal — Manufacturing Process & Capability (MES/quality/Cora)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '6', 'Rev A'],
  ['Process Step', 'Process Characteristic', 'PFMEA Risk', 'Process Control', 'Equipment', 'Spec Lower Limit', 'Spec Upper Limit', 'Mean', 'Std Dev', 'Cpk (calculated)', 'Evidence / Action'],
  ['SMT Reflow', 'Solder Joint Shear Strength (HV Bus)', 'High (RPN 144)', 'SPC chart + AVI', 'Reflow oven TZ-400', 28, 35, 29.1, 2.8, 0.87, 'Below threshold 1.33 — corrective action required'],
  ['HV Bus Press-Fit', 'Press-Fit Insertion Force', 'Medium (RPN 64)', 'Force monitor', 'Arbor press FP-200', 450, 650, 548, 28, 1.21, 'Within threshold'],
  ['Module Mounting', 'Bracket Torque (MOP-012)', 'Medium (RPN 72)', 'Torque wrench calibration', 'Torque wrench TW-50', 3.0, 4.0, 3.45, 0.61, 0.30, 'High variation — operator training action'],
  ['Cold Plate Assembly', 'Coolant Port Leak Test', 'High (RPN 108)', '100% leak test at 3 bar', 'Leak tester LT-100', 0, 0, 0, 0, 'N/A', 'Pass — no leaks in 50 units'],
  ['Final Test', 'Output Power Accuracy', 'Medium (RPN 56)', 'End-of-line power test', 'Load bank LB-500', 148, 152, 150.4, 0.7, 1.45, 'Within threshold'],
  ['Enclosure Sealing', 'IP67 Test Compliance', 'Low (RPN 24)', 'Batch sampling', 'IP test tank', '100%', '100%', '100%', 'N/A', 'N/A', 'All sampled units pass'],
], 'phase6-int-manufacturing-capability.xlsx');

// Phase 7 internal — Transfer, Actions, Defects & Yield (Cora/MES/CAPA)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '7', 'Rev A'],
  ['Record ID', 'Type', 'Description', 'Source Gate/Phase', 'Root Cause', 'Corrective Action', 'Closure Evidence', 'Status', 'Yield Impact (%)', 'Notes'],
  ['ACT-G6-001', 'Gate Action', 'Solder joint Cpk corrective action', 'Gate 6', 'Reflow profile out of spec', 'Reflow profile updated; SPC reestablished', 'New SPC chart — Cpk 1.45', 'Closed', 0, 'Verified in production build 2'],
  ['ACT-G6-002', 'Gate Action', 'Bracket torque variation reduction', 'Gate 6', 'Operator inconsistency', 'Torque tool upgrade + training', 'Training records + new torque data', 'Closed', 0, 'Cpk 1.38 after corrective action'],
  ['DEF-001', 'Production Defect', 'Solder bridge on gate driver U3', 'Phase 7', 'Paste volume excess', 'Stencil aperture reduced 10%', 'Inspection records', 'Closed', 2.1, 'Build 1 only'],
  ['DEF-002', 'Production Defect', 'Torque variation on MOP-012 mounting', 'Phase 7', 'Manual torque inconsistency', 'Torque tool audit + retrain', 'In progress', 'Open', 1.3, 'Action A7-001'],
  ['YLD-001', 'Yield', 'First pass yield build 1', 'Phase 7', 'N/A', 'N/A', 'Inspection report RPT-007', 'Closed', 91.4, '91.4% FPY — target 95%'],
  ['YLD-002', 'Yield', 'First pass yield build 2', 'Phase 7', 'N/A', 'N/A', 'Inspection report RPT-012', 'Closed', 94.8, '94.8% FPY — improved after DEF-001 fix'],
], 'phase7-int-transfer-defects-yield.xlsx');

// Phase 8 external — Supplier Lifecycle & Availability (supplier/distributor/obsolescence)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '8', 'Rev A'],
  ['MPN', 'Description', 'PCN/PDN/EOL Notice', 'Notice Date', 'Last Order Date', 'Distributor Stock', 'Lead Time (weeks)', 'Suggested Alternate', 'Alternate Status', 'Risk'],
  ['IGBT-HV-800-A', 'SiC Power Module 800V 300A', 'PDN-2026-IGBT001 — Discontinuance Notice', '2026-06-15', '2027-03-31', 420, 26, 'SiC-HV-900-B', 'Not qualified; requires redesign + requalification', 'Critical'],
  ['GD-ISO-4A', 'Gate Driver IC isolated', 'None', 'N/A', 'N/A', 2800, 8, 'N/A', 'N/A', 'Low'],
  ['CAP-DC-900V-100U', 'DC Link Capacitor 900V 100µF', 'PCN-2026-CAP003 — Case size change', '2026-04-01', 'N/A', 1200, 10, 'CAP-DC-900V-100U-B', 'Drop-in; requalification needed for HV', 'Medium'],
  ['CURR-SENS-200A', 'Current Sensor 200A Hall effect', 'None', 'N/A', 'N/A', 4500, 6, 'N/A', 'N/A', 'Low'],
  ['CONN-CAN-4P', 'CAN Connector 4-pin sealed', 'None', 'N/A', 'N/A', 8200, 4, 'N/A', 'N/A', 'Low'],
], 'phase8-ext-supplier-lifecycle.xlsx');

// Phase 8 internal — Production, BOM, Yield & Cost (ERP/MES/PLM)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '8', 'Rev A'],
  ['BOM Part', 'MPN', 'Usage Qty', 'Inventory', 'Forecast Demand (units)', 'Yield (%)', 'Scrap (%)', 'Unit Cost (USD)', 'Quality Status', 'Redesign Impact if PDN'],
  ['Q_HV_1', 'IGBT-HV-800-A', 2, 840, 420, 98.5, 1.5, 280, 'Pass', 'Complete redesign + requalification required; 18–24 month program'],
  ['U3', 'GD-ISO-4A', 4, 11200, 2800, 99.2, 0.8, 18, 'Pass', 'None'],
  ['C_HV_1..6', 'CAP-DC-900V-100U', 6, 7200, 1200, 99.0, 1.0, 45, 'PCN received — case change', 'Minor — requalification for HV application'],
  ['B1', 'CURR-SENS-200A', 3, 13500, 4500, 99.5, 0.5, 32, 'Pass', 'None'],
  ['J1', 'CONN-CAN-4P', 1, 8200, 8200, 99.8, 0.2, 5, 'Pass', 'None'],
  ['ASSY', 'EV-INV-800-ASSY', 1, 0, 420, 94.8, 5.2, 685, 'Production active', 'If Q_HV_1 discontinued: product requires full redesign'],
], 'phase8-int-production-bom-yield.xlsx');

// Phase 9 internal — Final Product, Demand, Asset & Archive (ERP/tooling/Cora)
makeSample([
  ['Project ID', 'Product', 'Phase', 'Revision'],
  ['EVINV-POC-001', 'EV-INV-800', '9', 'Rev A'],
  ['Record ID', 'Type', 'Description', 'Demand / Quantity', 'Status', 'Contract / Order', 'Retention Requirement', 'Disposal Requirement', 'Responsible Role', 'Closure Status'],
  ['ARCH-001', 'BOM Archive', 'Final released BOM EV-INV-800 Rev D', 'N/A', 'Archived', 'N/A', '10 years per TT record policy', 'N/A', 'Engineering Manager', 'Complete'],
  ['ARCH-002', 'Design Archive', 'PCB design files and Gerbers Rev D', 'N/A', 'Archived', 'N/A', '10 years', 'N/A', 'ECAD Engineer', 'Complete'],
  ['ARCH-003', 'Tooling Register', 'Cold plate press-fit tooling set TL-4412', '2 sets', 'In storage', 'N/A', 'Until last order + 2 years', 'Dispose or sell after retention', 'Manufacturing Engineering', 'Pending'],
  ['INV-001', 'Remaining Inventory', 'Finished goods EV-INV-800', 12, 'In warehouse', 'Last-time-buy order PO-EOL-2027-001 (420 units scheduled)', 'Fulfill PO then dispose', 'Sell or scrap per EHS policy', 'Supply Chain', 'In progress'],
  ['INV-002', 'Raw Material', 'IGBT-HV-800-A modules (last buy)', 0, 'Committed to production', 'PO-LTB-2027-IGBT (840 units ordered)', 'Use in production; zero remaining after build', 'N/A', 'Procurement', 'In progress'],
  ['CLOSE-001', 'Project Closure', 'EVINV-POC-001 formal closure', 'N/A', 'Awaiting Gate 9 approval', 'N/A', 'Project archive per TT policy', 'N/A', 'Program Manager', 'Pending Gate 9 decision'],
], 'phase9-int-final-product-archive.xlsx');

console.log('All 11 synthetic sample XLSX files generated in public/samples/');
