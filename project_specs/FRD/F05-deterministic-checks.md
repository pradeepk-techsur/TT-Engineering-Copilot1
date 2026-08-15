---

## F05: Deterministic Engineering Checks

**Requirements:** DP-01 to DP-07, SS-01 | **Priority:** P0

**Description:** At least four deterministic engineering checks (and one process-capability check) run outside the LLM as standalone tool calls, producing structured, reproducible results. Running checks outside the LLM ensures that the same inputs always produce the same outputs — independent of model temperature, model version, or prompt variation. Each check records its complete provenance: inputs used, formula or method applied, threshold, unit, result, pass/fail status, source reference, and known limitations. Check results are stored in ProjectState and are version-aware: they are invalidated and rerun when their dependent inputs change (see F03).

---

### Terminology

- **Deterministic Check:** A calculation or consistency rule executed as a tool call outside the LLM; result is purely a function of the input data.
- **Check Result Record:** The structured output of a deterministic check stored in ProjectState.
- **EVINV-POC-STD-001:** Synthetic POC standard ("EV Traction Inverter Design and Manufacturing Standard, POC Demonstration Edition", Version 1.0) that defines thresholds for clearance, derating, and Cpk; labeled as a synthetic POC standard, not an approved TT or industry standard.
- **Cpk:** Process Capability Index = min(USL − μ, μ − LSL) / (3σ); measures how centered and narrow a process is relative to its specification limits.
- **Derating Margin:** The margin by which a component's operating stress is kept below its rated maximum, expressed as a percentage.
- **Test Point Coverage:** The fraction of defined diagnostic nets that have an accessible physical test point.
- **Cross-Artifact Consistency:** Verification that reference designators, revision levels, and part numbers are consistent across two or more design documents.

---

### Sub-features

- Check 1 — Cross-Artifact Reference and Revision Consistency (Phase 4)
- Check 2 — High-Voltage Clearance (Phase 4)
- Check 3 — Component Derating (Phase 4)
- Check 4 — Test-Point Coverage (Phase 4)
- Check 5 — Cpk Calculation (Phase 6)
- Additional deterministic logic: cost calculations, traceability completeness, requirement testability flags, action closure verification, inventory reconciliation (across phases)
- All check results stored in ProjectState with full provenance
- Version-aware: checks invalidated and rerun when dependent inputs change

---

### Check Result Record Schema (all checks)

| Field | Type | Description |
|---|---|---|
| `check_id` | string (UUID) | Unique check result identifier |
| `check_type` | enum | `CrossArtifactConsistency`, `HVClearance`, `ComponentDerating`, `TestPointCoverage`, `Cpk`, `CostCalc`, `TraceabilityCompleteness`, `RequirementTestability`, `ActionClosure`, `InventoryReconciliation` |
| `phase_id` | integer 0–9 | Phase in which the check ran |
| `input_version_ids` | string[] | Version IDs of all inputs used in this check |
| `formula_or_method` | string | Human-readable description of the formula or comparison method |
| `threshold` | number \| string | The pass/fail threshold value |
| `threshold_unit` | string | Unit of the threshold (e.g., `mm`, `%`, dimensionless) |
| `result_value` | number \| string | Computed or extracted result |
| `result_unit` | string | Unit of the result |
| `status` | enum | `Pass`, `Fail`, `Warning` |
| `source_reference` | string | Standard, clause, or POC rule cited (e.g., "EVINV-POC-STD-001 §3.2") |
| `limitation` | string | Known limitation of this check (e.g., "Clearance measured from 2D design data only") |
| `items_checked` | CheckItem[] | Per-item detail (one row per component, net, requirement, etc.) |
| `invalidated` | boolean | True if this result has been invalidated by a revised input |
| `superseded_by` | string \| null | `check_id` of the rerun result that replaced this one |
| `run_at` | ISO 8601 | Timestamp when check executed |

---

### Check 1: Cross-Artifact Reference and Revision Consistency (Phase 4)

**Purpose:** Verifies that reference designators, part numbers, revision levels, and footprint identifiers are consistent between the Released Detailed Design Baseline Package (internal input) and the DFM/Standards Package (external input).

**Inputs used:**
- `Phase4.InternalInput` (Released Detailed Design Baseline Package) — schematic/layout netlist/BOM
- `Phase4.ExternalInput` (DFM, Assembly, Standards & Supplier-Risk Package) — DFM rules referencing part and footprint IDs

**Method:**
1. Extract all reference designators and part numbers from internal input BOM.
2. Extract all reference designators and part numbers referenced in external input DFM rules.
3. For each reference in the external input, verify it exists in the internal BOM with matching revision.
4. For each footprint ID in the internal input, verify it matches the expected footprint in the external DFM database.
5. Flag any mismatches as `Fail` items.

**Threshold:** Zero mismatches for `Pass`; any mismatch = `Fail`.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `item_id` | string | Reference designator or footprint ID |
| `field_checked` | string | e.g., "Part Number", "Revision", "Footprint" |
| `value_in_internal` | string | Value from internal design package |
| `value_in_external` | string | Value from external DFM package |
| `match` | boolean | True if consistent |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** One BOM/design footprint mismatch is seeded. Capacitor `C_HV_1` has footprint `0805` in BOM but DFM rules reference `1206`. Detected by this check. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §2.1 — Cross-Document Consistency Requirements (Synthetic POC Standard).
**Limitation:** Checks textual consistency only; does not verify electrical correctness or 3D clearances.

---

### Check 2: High-Voltage Clearance (Phase 4)

**Purpose:** Compares measured PCB clearances between high-voltage nets (≥60 V) against the minimum clearance threshold defined in EVINV-POC-STD-001. Flags any clearance below threshold.

**Inputs used:**
- `Phase4.InternalInput` — PCB layout clearance data (extracted from design file or provided as structured table in internal package)

**Method:**
1. For each HV net pair in the clearance table, extract the measured clearance value.
2. Compare against `EVINV-POC-STD-001 §3.1` minimum clearance threshold = 8.0 mm (air), 5.0 mm (creepage, synthetic POC values).
3. Flag any net pair where measured clearance < threshold as `Fail`.

**Threshold:** 8.0 mm air / 5.0 mm creepage (EVINV-POC-STD-001 §3.1 — Synthetic POC Standard).
**Unit:** mm.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `net_pair` | string | e.g., "VBUS+ to VBUS−" |
| `clearance_type` | enum | `Air` or `Creepage` |
| `measured_mm` | number | Measured clearance from design data |
| `threshold_mm` | number | EVINV-POC-STD-001 threshold |
| `margin_mm` | number | `measured_mm − threshold_mm` |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** Net pair `VBUS+ to GND_SHIELD` has measured clearance of 6.2 mm against 8.0 mm threshold. Margin = −1.8 mm. Status = `Fail`. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §3.1 — High-Voltage Clearance and Creepage Requirements (Synthetic POC Standard).
**Limitation:** Clearance values taken from design data provided in the internal package; not extracted directly from CAD files in POC.

---

### Check 3: Component Derating (Phase 4)

**Purpose:** Calculates the derating margin for each stress-sensitive component (capacitors, MOSFETs, diodes) by comparing operating stress to rated maximum. Flags components where the derating margin falls below the EVINV-POC-STD-001 minimum.

**Inputs used:**
- `Phase4.InternalInput` — BOM with rated values and design-specified operating conditions
- `Phase4.ExternalInput` — DFM/Standards package containing derating rules

**Method:**
1. For each component in the derating scope (capacitors: voltage; MOSFETs: VDS, ID; diodes: VRRM, IF):
   - Extract rated value from BOM/datasheet reference.
   - Extract operating stress from design conditions in internal package.
   - Compute derating margin = `(Rated − Operating) / Rated × 100%`.
2. Compare against minimum derating margin from EVINV-POC-STD-001 §3.3:
   - Capacitors: ≥ 50% voltage derating margin required.
   - MOSFETs (VDS): ≥ 30% margin required.
   - Diodes (VRRM): ≥ 30% margin required.
3. Flag any component where margin < threshold as `Fail`.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `ref_des` | string | Reference designator (e.g., `C_HV_2`) |
| `component_type` | string | e.g., `Capacitor`, `MOSFET` |
| `stress_parameter` | string | e.g., `Voltage`, `VDS`, `VRRM` |
| `rated_value` | number | Rated maximum from component spec |
| `operating_value` | number | Design operating stress |
| `unit` | string | e.g., `V`, `A` |
| `derating_margin_pct` | number | `(Rated − Operating) / Rated × 100` |
| `threshold_pct` | number | EVINV-POC-STD-001 minimum margin |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** Capacitor `C_BULK_3` rated 450 V, operating stress 430 V, derating margin = 4.4% against 50% threshold. Status = `Fail`. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §3.3 — Component Stress and Derating Limits (Synthetic POC Standard).
**Limitation:** Operating stress values sourced from design package; worst-case stress analysis not performed in POC.

---

### Check 4: Test-Point Coverage (Phase 4)

**Purpose:** Verifies that every diagnostic net identified in the design has an accessible physical test point. Flags any diagnostic net with no associated test point.

**Inputs used:**
- `Phase4.InternalInput` — netlist with diagnostic net designations and test point list

**Method:**
1. Extract list of nets flagged as `diagnostic` in the netlist.
2. Extract list of accessible test points from the design package.
3. For each diagnostic net, verify at least one test point is associated with it.
4. Flag diagnostic nets with no accessible test point as `Fail`.

**Threshold:** Zero uncovered diagnostic nets for `Pass`; any uncovered net = `Fail`.
**Unit:** Count of uncovered nets.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `net_name` | string | Diagnostic net identifier |
| `test_point_ids` | string[] | Associated test point IDs (empty if none) |
| `accessible` | boolean | True if at least one test point exists |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-03):** Diagnostic net `DIAG_TEMP_IGBT_CASE` has no accessible test point. Status = `Fail`. Corrected in revised design (SI-04).

**Source reference:** EVINV-POC-STD-001 §4.2 — Diagnostic Accessibility Requirements (Synthetic POC Standard).
**Limitation:** Accessibility determined from design data; physical access constraints (cable routing, enclosure clearance) not assessed in POC.

---

### Check 5: Cpk Calculation (Phase 6)

**Purpose:** Computes the process capability index (Cpk) for a critical assembly characteristic from MES process data. Flags characteristics where Cpk falls below the synthetic acceptance threshold.

**Inputs used:**
- `Phase6.InternalInput` — Manufacturing Process & Capability Package containing process sample data (measurements, USL, LSL, sample size)

**Method:**
1. For each critical assembly characteristic in the capability package:
   - Extract sample measurements, Upper Specification Limit (USL), Lower Specification Limit (LSL).
   - Compute mean (μ) and standard deviation (σ) from sample data.
   - Compute `Cpk = min((USL − μ) / (3σ), (μ − LSL) / (3σ))`.
2. Compare Cpk against synthetic threshold = 1.33 (EVINV-POC-STD-001 §5.1).
3. Flag any characteristic with Cpk < 1.33 as `Fail`.

**Threshold:** Cpk ≥ 1.33 (EVINV-POC-STD-001 §5.1 — Synthetic POC Standard).
**Unit:** Dimensionless.

**Output per item:**

| Field | Type | Description |
|---|---|---|
| `characteristic_id` | string | Characteristic identifier (e.g., `TORQUE_TERM_1`) |
| `characteristic_name` | string | e.g., "Terminal Torque — Position 1" |
| `sample_size` | integer | Number of measurements |
| `mean` | number | Sample mean |
| `std_dev` | number | Sample standard deviation |
| `usl` | number | Upper Specification Limit |
| `lsl` | number | Lower Specification Limit |
| `unit` | string | Measurement unit (e.g., `N·m`) |
| `cpk` | number | Computed Cpk value (4 decimal places) |
| `threshold` | number | 1.33 |
| `status` | enum | `Pass` or `Fail` |

**Seeded issue (SI-06):** Characteristic `SOLDER_JOINT_SHEAR_HV_BUS` has Cpk = 0.87 against threshold 1.33. Status = `Fail`. Human approves corrective action; revised MES sample ingested; check rerun.

**Source reference:** EVINV-POC-STD-001 §5.1 — Process Capability Requirements (Synthetic POC Standard).
**Limitation:** Cpk computed from synthetic sample data only; assumes normal distribution; does not account for measurement system variation.

---

### Additional Deterministic Logic (All Phases)

| Check Type | Phase(s) | Method | Threshold |
|---|---|---|---|
| Cost calculation | Phase 1 | Sum of BOM unit costs × quantities + labor rates × hours | Within ±5% of parametric estimate |
| Traceability completeness | Phase 2 | Count of requirements with ≥1 linked test method / total requirements | ≥ 90% for Pass; < 90% = Warning |
| Requirement testability flag | Phase 2 | Rule: requirement must contain a measurable acceptance criterion (numeric value or binary observable) | Any untestable requirement = Flag |
| Action closure verification | Phase 4, 5, 6, 7 | Verify all blocking actions due by this phase have status `VerifiedClosed` | Zero open blocking actions for gate pass |
| Inventory reconciliation | Phase 8 | Compare BOM quantities against ERP/MES stock levels; flag discrepancies | Zero unresolved discrepancies for pass |

---

### Validation Rules

- All five primary checks must run before Phase 4 / Phase 6 gate reviews; gate review blocked if checks have not run.
- Check must not use LLM inference for threshold comparison or calculation; all arithmetic performed in deterministic code.
- Check inputs must reference specific `version_id` records; if a version is invalidated, check must rerun with the current active version.
- `status` field must be set to exactly one of `Pass`, `Fail`, or `Warning`; no partial or ambiguous states.
- `source_reference` must cite EVINV-POC-STD-001 with section number; the standard must be labeled "Synthetic POC Standard" in every reference.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Check run with no active input version | 409 | `NO_ACTIVE_INPUT_VERSION` | "Cannot run check: no active version for input [logical_name]." |
| Gate review attempted before required checks run | 409 | `REQUIRED_CHECKS_NOT_RUN` | "Phase {n} gate review requires all mandatory checks to have run. Missing: [check_types]." |
| LLM inference detected in check result | 500 | `DETERMINISTIC_INTEGRITY_VIOLATION` | "Check result contains LLM-generated content. Deterministic checks must not use LLM inference." |
| Standard referenced without Synthetic label | 422 | `SYNTHETIC_LABEL_MISSING` | "Reference to EVINV-POC-STD-001 must include 'Synthetic POC Standard' label." |

---

### API Surface (this feature)

See `Y1-api.md` §Checks for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/checks/phase/{id}/run` | Run all mandatory checks for a phase |
| `POST` | `/api/checks/{check_type}/run` | Run a specific check type for a phase |
| `GET` | `/api/checks/phase/{id}/results` | Get all check results for a phase |
| `GET` | `/api/checks/{check_id}` | Get a specific check result record |
| `POST` | `/api/checks/{check_id}/invalidate` | Mark a check result as invalidated (triggered by targeted-rerun) |

---

### Schema Surface (this feature)

Uses `ProjectState.checkResults[]` — see `Y0-schema.md` §Check Results.

---

*FRD-TTCopilot-v1.0 | F05 | Synthetic POC Data Only*
