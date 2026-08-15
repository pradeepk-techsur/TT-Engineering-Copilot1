---

## F06: Seeded Issues and Correction Cycles

**Requirements:** SI-01 to SI-08 | **Priority:** P0

**Description:** Eight specific engineering issues are seeded into the synthetic EV-INV-800 product data across Phases 2–8. Each seeded issue is objectively detectable by a deterministic check or testability rule, triggers a structured finding, requires a human-approved corrective action, leads to a revised input, and results in a targeted rerun of affected checks and outputs. Original and revised results are preserved side by side. Together, these issues demonstrate the full lifecycle correction workflow that the Copilot is designed to support.

---

### Terminology

- **Seeded Issue:** An intentionally embedded engineering problem in synthetic POC data; `finding.seeded = true`.
- **Correction Cycle:** The full workflow for a seeded issue: detection → finding raised → human decision (approve corrective action) → revised input → targeted rerun → result verification → closure.
- **Conditional Pass Action:** An action created when Gate 3 records a Conditional Pass outcome; must be tracked to closure before the project can close.
- **Side-by-Side Preservation:** Both the original (pre-correction) and revised (post-correction) check results and outputs are stored in ProjectState with distinct `version_ref` values.

---

### Seeded Issue: SI-01 — Phase 2 Requirements Testability

**Phase:** 2 (Requirements Definition)
**Detection method:** Requirement testability deterministic check (see F05 §Additional Deterministic Logic).
**Seeded data:** One efficiency or thermal performance requirement in the Customer & Standards Requirements Package has no measurable acceptance criterion (e.g., "The inverter shall be thermally stable under load" — no temperature value, no test condition specified).

**Correction Cycle:**
1. Testability check runs; flags requirement `REQ-THERM-004` as untestable (no numeric criterion).
2. Finding `F2-001` raised: Severity = `Major`; description: "REQ-THERM-004 lacks a measurable acceptance criterion."
3. AI recommendation includes this finding in rationale; recommends `Conditional Pass` or human clarification.
4. Human approves corrective action `A2-001`: "Revise REQ-THERM-004 to add measurable criterion: operating temperature ≤ 85°C at rated power, confirmed by thermocouple measurement at Case Temperature Point TP-CASE-1."
5. User uploads revised Customer & Standards Requirements Package via "Upload Revised Version" workflow.
6. Testability check reruns on revised requirement; `REQ-THERM-004` now passes.
7. Finding `F2-001` status → `VerifiedClosed`.
8. Gate 2: human selects `Pass` (after clarification). Happy-path outcome.

**Outputs in ProjectState:**
- `checkResults[]` entry for original run: `status = Fail`, `version_ref = v1`
- `checkResults[]` entry for rerun: `status = Pass`, `version_ref = v2`
- Both entries retained; `superseded_by` links original to rerun.

---

### Seeded Issue: SI-02 — Phase 3 Assembly Access Concern

**Phase:** 3 (Preliminary Design)
**Detection method:** Agent analysis of Preliminary Design Package (no dedicated deterministic check for assembly access in Phase 3; detected by agent DFM/DFA rule application with Early DFM/DFA Findings output).
**Seeded data:** Coolant connector orientation in the preliminary design drawing places the connector parallel to the PCB mounting face, requiring the connector to be inserted at an angle that obstructs access to adjacent fasteners.

**Correction Cycle:**
1. Phase 3 agent analyzes preliminary design package against DFM/DFA rules from external input.
2. Finding `F3-001` raised: Severity = `Major`; description: "Coolant connector (CN-COOL-1) orientation creates an assembly-access concern. Connector insertion angle obstructs access to M4 fasteners J-FAST-7 through J-FAST-10."
3. AI recommends `Conditional Pass`; human selects `Conditional Pass`. Gate 3 = Conditional Pass.
4. Conditional Pass action `A3-001` created: "Revise coolant connector orientation in detailed design to ensure unobstructed access to J-FAST-7 through J-FAST-10. Provide revised design drawing for verification."
5. Action tracked in Findings and Actions Workspace (AV-07); `blocking = true`; `due_phase = 4`; `due_gate = 4`.
6. Action remains visibly open on all views until Phase 4 revised design verification.

**Phase 4 Verification (SI-04 companion):**
7. Phase 4 released design baseline includes revised connector orientation.
8. Phase 4 cross-artifact consistency check verifies connector designation matches revised DFM spec.
9. Human reviewer confirms `A3-001` closure in Phase 4 Gate Review Workspace: provides closure evidence artifact ID.
10. `A3-001` status → `VerifiedClosed`. Finding `F3-001` status → `VerifiedClosed`.
11. Gate 4 happy-path gate pass includes this verified closure.

---

### Seeded Issues: SI-03 — Phase 4 Initial Design (Four Simultaneous Issues)

**Phase:** 4 (Detailed Design)
**Detection method:** Four deterministic checks (see F05). All four run on initial Phase 4 inputs.

#### SI-03a: HV Clearance Failure

- **Check:** HV Clearance Check (F05 §Check 2)
- **Seeded data:** Net pair `VBUS+ to GND_SHIELD`; measured clearance = 6.2 mm; threshold = 8.0 mm; margin = −1.8 mm.
- **Finding:** `F4-001`; Severity = `Critical`; status = `Open`.
- **Action:** `A4-001` (blocking): "Increase clearance between VBUS+ and GND_SHIELD from 6.2 mm to ≥ 8.5 mm. Provide revised layout extract."

#### SI-03b: Component Derating Failure

- **Check:** Component Derating Check (F05 §Check 3)
- **Seeded data:** `C_BULK_3` rated 450 V, operating 430 V, derating margin = 4.4%; threshold = 50%.
- **Finding:** `F4-002`; Severity = `Critical`; status = `Open`.
- **Action:** `A4-002` (blocking): "Replace C_BULK_3 with 900 V rated capacitor to achieve ≥ 50% derating margin. Update BOM revision."

#### SI-03c: Test-Point Coverage Failure

- **Check:** Test-Point Coverage Check (F05 §Check 4)
- **Seeded data:** Diagnostic net `DIAG_TEMP_IGBT_CASE` has no accessible test point.
- **Finding:** `F4-003`; Severity = `Major`; status = `Open`.
- **Action:** `A4-003` (blocking): "Add accessible test point TP-IGBT-CASE to diagnostic net DIAG_TEMP_IGBT_CASE. Update test point list and netlist."

#### SI-03d: Cross-Artifact Consistency Failure

- **Check:** Cross-Artifact Consistency Check (F05 §Check 1)
- **Seeded data:** `C_HV_1` footprint in BOM = `0805`; footprint in DFM rules = `1206`.
- **Finding:** `F4-004`; Severity = `Major`; status = `Open`.
- **Action:** `A4-004` (blocking): "Resolve footprint mismatch for C_HV_1. Correct BOM or DFM spec to match. Provide revised BOM with corrected footprint designation."

**Gate 4 Initial Recommendation:** AI recommends `Fail` (four critical/major issues open, blocking actions pending). Human selects `Fail`. Project enters correction cycle.

---

### Seeded Issue: SI-04 — Phase 4 Revised Design (Correction Verification)

**Phase:** 4 (Detailed Design — Revised)
**Process:** User uploads revised Released Detailed Design Baseline Package via "Upload Revised Version."

**Correction Verification Steps:**
1. Revised internal input (v2) ingested; all four Phase 4 checks run via targeted rerun.
2. HV Clearance Check (rerun): `VBUS+ to GND_SHIELD` clearance now = 9.1 mm; margin = +1.1 mm; status = `Pass`.
3. Derating Check (rerun): `C_BULK_3` replaced with 900 V rated capacitor; operating 430 V; margin = 52.2%; status = `Pass`.
4. Test-Point Coverage Check (rerun): `DIAG_TEMP_IGBT_CASE` now has test point `TP-IGBT-CASE`; status = `Pass`.
5. Cross-Artifact Consistency Check (rerun): `C_HV_1` footprint now `1206` in both BOM and DFM spec; status = `Pass`.
6. Phase 3 action `A3-001` (coolant connector) verified closed in revised design; reviewer confirms in Gate Review Workspace.
7. All four actions `A4-001` through `A4-004` status → `VerifiedClosed`.
8. Finding statuses → `VerifiedClosed`.
9. Original check results (v1) and revised check results (v2) both stored in `checkResults[]`; linked by `superseded_by`.
10. Gate 4: AI recommends `Pass`; human selects `Pass`. Happy-path outcome.

---

### Seeded Issue: SI-05 — Phase 5 Thermal Verification

**Phase:** 5 (Verification and Validation)
**Detection method:** Requirement testability comparison within V&V Matrix; thermal result exceeds synthetic acceptance criterion.
**Seeded data:** Thermal measurement at `TP-CASE-1` = 91°C; synthetic acceptance criterion (from REQ-THERM-004 revised in SI-01) = ≤ 85°C.

**Correction Cycle:**
1. V&V agent compares test results against acceptance criteria in Validation Evidence Package.
2. Finding `F5-001` raised: Severity = `Critical`; description: "Thermal measurement at TP-CASE-1 (91°C) exceeds acceptance criterion of 85°C defined in REQ-THERM-004."
3. AI recommends `Fail`. Human approves corrective action `A5-001`: "Investigate thermal path; revise thermal interface material specification or heat-sink profile; re-test."
4. User uploads revised Validation Evidence Package (updated test results after thermal mitigation).
5. Targeted rerun: V&V Matrix row for REQ-THERM-004 updated; revised thermal result = 82°C; criterion met.
6. Finding `F5-001` status → `VerifiedClosed`.
7. Gate 5: AI recommends `Pass`; human selects `Pass` (after correction).

---

### Seeded Issue: SI-06 — Phase 6 Process Capability

**Phase:** 6 (Manufacturing Readiness)
**Detection method:** Cpk deterministic check (F05 §Check 5).
**Seeded data:** Characteristic `SOLDER_JOINT_SHEAR_HV_BUS`; Cpk = 0.87; threshold = 1.33.

**Correction Cycle:**
1. Cpk check runs on Manufacturing Process & Capability Package.
2. Finding `F6-001` raised: Severity = `Critical`; description: "SOLDER_JOINT_SHEAR_HV_BUS Cpk = 0.87 below threshold 1.33. Process not capable."
3. AI recommends `Conditional Pass` with action. Human approves corrective action `A6-001`: "Review solder paste volume and reflow profile for HV bus connection; re-sample after process adjustment."
4. Revised synthetic MES sample (v2) becomes available; user ingests via "Ingest Revised Sample."
5. Cpk check reruns on revised sample; `SOLDER_JOINT_SHEAR_HV_BUS` Cpk = 1.45; status = `Pass`.
6. Finding `F6-001` → `VerifiedClosed`; Action `A6-001` → `VerifiedClosed`.
7. Gate 6: AI recommends `Pass`; human selects `Pass` (after correction).

---

### Seeded Issue: SI-07 — Phase 7 Transfer Finding

**Phase:** 7 (Transfer and Lessons Learned)
**Detection method:** Agent analysis of Transfer, Actions, Defects & Yield Package (simulated: Cora/MES/CAPA).
**Seeded data:** MES yield data shows torque variation in mounting operation `MOP-012-BRACKET-MOUNT` (torque range: 2.1–4.8 N·m; specification: 3.5 ± 0.5 N·m). Some readings outside ±14% of target.

**Correction Cycle:**
1. Phase 7 agent analyzes transfer package; identifies torque variation pattern.
2. Finding `F7-001` raised: Severity = `Minor`; description: "Torque variation in MOP-012-BRACKET-MOUNT exceeds specification on 8% of assemblies. Operator training and torque tool calibration recommended."
3. Finding captured in Structured Lessons-Learned Register (Phase 7 Output 1).
4. Action `A7-001` (non-blocking, parallel): "Schedule torque tool calibration and operator re-training for MOP-012-BRACKET-MOUNT before volume ramp." Owner: Manufacturing Engineering.
5. Gate 7: AI recommends `Pass`; human selects `Pass`. (Lessons-learned finding does not block gate for this POC.)

---

### Seeded Issue: SI-08 — Phase 8 Component Obsolescence

**Phase:** 8 (Production and Sustaining)
**Detection method:** Deterministic obsolescence flag from Supplier Lifecycle & Availability Package (simulated: supplier feeds, obsolescence databases).
**Seeded data:** Primary power semiconductor (IGBT module `IGBT-HV-800-A`, reference designator `Q_HV_1`) receives a fictional product discontinuance notice with last-time-buy date 12 months from current date. Replacement requires full redesign and requalification. Remaining customer demand does not justify redevelopment investment.

**Correction Cycle:**
1. Phase 8 agent flags `IGBT-HV-800-A` with `ObsolescenceRisk = Critical` in Obsolescence & Supply-Risk Forecast.
2. Finding `F8-001` raised: Severity = `Critical`; description: "IGBT-HV-800-A (Q_HV_1) has received a product discontinuance notice. Last-time-buy date: [+12 months]. No drop-in replacement identified. Redesign and requalification required."
3. Yield/Quality report confirms remaining demand does not justify redevelopment.
4. AI recommends `Pass to initiate Phase 9 EOL`.
5. Gate 8: human selects `Pass` to initiate EOL. Gate 8 happy-path outcome = `Pass`.
6. Project transitions to Phase 9 (End of Life).

---

### Inputs (general across all seeded issues)

- Phase inputs as defined in F01 per-phase specification
- For revision cycles: revised user-provided file or revised synthetic sample (per F02 and F03 workflows)

---

### Outputs (per correction cycle)

- Finding record in `ProjectState.findings[]` with `seeded = true`
- Action record in `ProjectState.actions[]`
- Human-approved corrective action (gate decision or standalone action approval)
- Revised input version (new `InputVersion` record)
- Rerun check results with version reference (original and revised)
- Revised phase outputs where affected
- Intake audit event for revised input
- Gate decision record with AI recommendation and human outcome

---

### Validation Rules

- Every seeded issue must be detected by a deterministic check or explicit rule (not by unconstrained LLM inference alone).
- `finding.seeded = true` must be set on all eight seeded findings.
- Correction cycle cannot auto-complete; human must explicitly approve the corrective action.
- Original pre-correction check results must be preserved in `checkResults[]` with `invalidated = true`; they must not be deleted.
- Revised results must be stored as separate `checkResults[]` entries linked to original via `superseded_by`.
- SI-04 must verify both Phase 3 action closure (A3-001) and all four Phase 4 actions (A4-001 through A4-004).
- SI-08 must transition project to Phase 9 after Gate 8 Pass; transition is human-gated.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Seeded finding auto-closed without human approval | 403 | `HUMAN_APPROVAL_REQUIRED` | "Corrective action closure requires human approval." |
| Original check result deleted after correction | 500 | `AUDIT_INTEGRITY_VIOLATION` | "Original check results must not be deleted. Correction cycle preserves both results." |
| Seeded issue not flagged with seeded=true | 422 | `SEEDED_FLAG_MISSING` | "Seeded issue finding must have seeded=true in finding record." |

---

### API Surface (this feature)

See `Y1-api.md` §Findings and §Actions for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/findings` | Get all findings (with seeded filter option) |
| `GET` | `/api/findings/{id}` | Get a specific finding |
| `POST` | `/api/findings/{id}/close` | Close a finding (requires human approver) |
| `GET` | `/api/actions` | Get all actions |
| `POST` | `/api/actions/{id}/approve` | Approve a corrective action (human action) |
| `POST` | `/api/actions/{id}/close` | Close an action with closure evidence |

---

### Schema Surface (this feature)

Uses `ProjectState.findings[]`, `ProjectState.actions[]`, `ProjectState.checkResults[]`, `ProjectState.gateDecisions[]` — see `Y0-schema.md` §Findings, §Actions.

---

*FRD-TTCopilot-v1.0 | F06 | Synthetic POC Data Only*
