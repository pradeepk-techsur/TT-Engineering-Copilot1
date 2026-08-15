---

## F08: Compact Artifact Standards

**Requirements:** CA-01 to CA-05, SS-01 | **Priority:** P0

**Description:** All synthetic artifacts (both inputs and outputs) conform to a compact standard that makes them simultaneously human-reviewable, AI-processable, and token-efficient. Every synthetic artifact carries a mandatory disclaimer. Every artifact has full provenance information. The compact standard prevents data padding, unused columns, and documents that are too large for rapid human review or LLM processing within a reasonable token budget.

---

### Terminology

- **Meaningful Row:** A data row that conveys a distinct engineering fact; header rows, blank rows, and sub-total rows are excluded from the row count.
- **Essential Field:** A column that carries data required for the purpose of the artifact; unused, placeholder, or cosmetic columns are prohibited.
- **Provenance Information:** The metadata record identifying the artifact's source, version, phase, intake type, generation method, and timestamp.
- **Mandatory Disclaimer:** The required text that must appear on every synthetic artifact: "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."
- **EVINV-POC-STD-001 Label:** The required label that must accompany every reference to the synthetic standard: "Synthetic POC Standard, not an approved TT or industry standard."

---

### Sub-features

- XLSX/CSV size limit: ≤ 10 meaningful rows
- XLSX/CSV field discipline: 6–10 essential fields per record
- DOCX/PDF size limit: ≤ 2 pages
- Mandatory disclaimer on every synthetic artifact
- Mandatory provenance on every artifact
- EVINV-POC-STD-001 labeled as synthetic standard wherever referenced
- Artifact generation wrapper enforces all rules before artifact is emitted

---

### XLSX and CSV Artifact Standards

#### Row Count

- Maximum ~10 meaningful representative rows per artifact (header rows excluded from count).
- The ~10 rows must be carefully selected to cover the key engineering scenario, including all seeded issues where applicable.
- No data padding: rows must not be added to meet a minimum count; rows must not be duplicated or modified only to vary the row count.
- If a validation warning `ROW_COUNT_WARNING` is issued (user upload exceeds ~10 rows), phase execution may still proceed but the agent is informed of the excess and instructed to focus on the most representative rows.

#### Column Discipline

- 6–10 essential fields per record.
- Every XLSX/CSV record must include:
  - A stable unique identifier (row ID, requirement ID, action ID, etc.)
  - Units for any quantitative field (e.g., V, A, mm, N·m, °C)
  - Source reference where applicable (standard clause, requirement ID, supplier reference)
  - Revision level where the artifact is versioned
- No unused columns (all columns must contain non-empty values in at least one row).
- No placeholder columns (e.g., "TBD", "Future Use") unless explicitly required by the output schema.

#### Required Metadata Fields (XLSX header area or first row)

| Field | Description |
|---|---|
| `Project ID` | `EVINV-POC-001` |
| `Product Name` | `EV-INV-800 Demonstration Traction Inverter` |
| `Phase` | TT lifecycle phase number and name |
| `Gate` | Associated gate number |
| `Artifact Name` | Canonical output name |
| `Version` | Artifact version number |
| `Status` | e.g., `Draft`, `Awaiting Approval`, `Approved` |
| `Synthetic Data Disclaimer` | Full disclaimer text |
| `Generated At` | ISO 8601 timestamp |

---

### DOCX and PDF Artifact Standards

#### Page Count

- Target: ~1–2 pages.
- Strictly enforced: artifact generation must not exceed 2 pages.
- Content must use concise headings, compact tables, and short narrative paragraphs.
- No padding paragraphs, no repetitive boilerplate beyond the required header and disclaimer.

#### Required Document Sections

Every DOCX/PDF output must include all of the following, in order:

1. **Document Header:** Project ID, Product Name, Phase, Gate, Artifact Name, Version, Status, Date, Synthetic Data Disclaimer.
2. **Executive Summary:** 2–4 sentence summary of the phase outcome and key findings (≤ 100 words).
3. **Key Findings or Results:** Compact table or bulleted list; 3–7 items maximum.
4. **Recommendation (where applicable):** One-sentence gate recommendation or risk call.
5. **Open Actions (where applicable):** Table of open blocking actions with IDs and due dates; omit section if none.
6. **Provenance Statement:** Lists input artifacts used (artifact ID, version) and generation timestamp.

#### Prohibited Content

- Full-length narrative sections (> 2 paragraphs per section)
- Appendices or attachments
- Tables with > 10 rows (use XLSX output for tabular data instead)
- Repeated boilerplate beyond the mandatory disclaimer and header

---

### Mandatory Disclaimer

Every synthetic artifact (inputs and outputs, both XLSX/CSV and DOCX/PDF) must carry the following exact disclaimer text:

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

- For XLSX/CSV: appears in a dedicated `Synthetic Data Disclaimer` metadata field in the header area.
- For DOCX/PDF: appears as bold text at the top of the document (immediately after the document title or in the header area).
- Disclaimer must not be removed, abbreviated, or moved to a footnote.
- Artifact generation wrapper must verify disclaimer presence before emitting any artifact; emit rejected if disclaimer is missing.

---

### Provenance Information (All Artifacts)

Every artifact carries:

| Field | Type | Description |
|---|---|---|
| `artifact_id` | string (UUID) | Unique artifact identifier |
| `artifact_name` | string | Canonical artifact name |
| `artifact_type` | enum | `XLSX`, `CSV`, `DOCX`, `PDF` |
| `source` | enum | `UserUploaded`, `AgentGenerated`, `SyntheticSample` |
| `intake_behavior` | enum | `UP`, `SI`, or `Generated` (for agent outputs) |
| `version` | integer | Sequential version number |
| `phase_id` | integer 0–9 | Phase that owns this artifact |
| `gate_id` | integer 0–9 | Associated gate |
| `input_version_refs` | string[] | Version IDs of inputs used to produce this artifact (for Generated artifacts) |
| `timestamp` | ISO 8601 | UTC timestamp of creation or upload |
| `generated_by` | string | `agent:{phase_agent_id}` or `user_upload` or `system_sample` |
| `disclaimer_present` | boolean | Must always be `true`; write rejected if `false` |

---

### EVINV-POC-STD-001 Standard Labeling

Every reference to EVINV-POC-STD-001 must include one of the following label forms:

- In running text: "(Synthetic POC Standard, not an approved TT or industry standard)"
- In tables: abbreviated label "(POC Std)" with full label in document footer or header
- In check result records: `source_reference` field must include "Synthetic POC Standard" qualifier

The synthetic standard document itself must carry the disclaimer and a statement on its cover page: "This is a synthetic demonstration standard created for EVINV-POC-001. It does not represent an actual TT Electronics or industry standard. Not for use in design, fabrication, certification, or production."

---

### Process: Artifact Generation Wrapper

Every artifact emission (by agent or by system) passes through the artifact generation wrapper:

1. Artifact content is generated or prepared.
2. Wrapper validates:
   - Disclaimer present and correct: `disclaimer_present = true` else reject.
   - XLSX/CSV: row count ≤ 10 meaningful rows; column count 6–10; all required metadata fields present.
   - DOCX/PDF: page count ≤ 2; all required document sections present.
   - All quantitative fields have units.
   - All XLSX row IDs are unique.
3. If validation passes: artifact registered in artifact registry with provenance record; status = `AwaitingReview`.
4. If validation fails: artifact rejected; error returned with specific violation detail; not registered.

---

### Inputs

- Artifact content (generated or uploaded)
- Phase configuration (determines expected format and field requirements)
- Artifact provenance metadata

---

### Outputs

- Validated artifact registered in artifact registry
- Artifact provenance record in `ProjectState.artifactRegistry[]`
- Validation result (passed or rejected with specific issue)

---

### Validation Rules

- Row count for XLSX/CSV: > 10 meaningful rows = `ROW_COUNT_WARNING` (warning, not rejection) for user uploads; `ROW_COUNT_VIOLATION` (rejection) for agent-generated outputs.
- Column count for XLSX/CSV: < 6 or > 10 = `COLUMN_COUNT_VIOLATION`.
- Page count for DOCX/PDF: > 2 pages = `PAGE_COUNT_VIOLATION`.
- Missing disclaimer = `DISCLAIMER_MISSING` (hard rejection; artifact not registered).
- Missing provenance field = `PROVENANCE_FIELD_MISSING` (hard rejection).
- Missing units on quantitative field = `UNITS_MISSING` (hard rejection for agent outputs; `UNITS_WARNING` for user uploads).
- EVINV-POC-STD-001 referenced without synthetic label = `SYNTHETIC_LABEL_MISSING` (hard rejection for agent outputs; warning for uploaded documents).
- Unused column in XLSX/CSV (all values empty) = `UNUSED_COLUMN_VIOLATION` (rejection for agent outputs; warning for user uploads).

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Disclaimer missing from artifact | 422 | `DISCLAIMER_MISSING` | "Artifact rejected: mandatory disclaimer not present. Add: 'Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.'" |
| XLSX row count > 10 (agent generated) | 422 | `ROW_COUNT_VIOLATION` | "Agent-generated XLSX artifact has {n} meaningful rows; maximum is 10. Reduce content." |
| DOCX page count > 2 | 422 | `PAGE_COUNT_VIOLATION` | "DOCX artifact has {n} pages; maximum is 2. Condense content." |
| Standard referenced without synthetic label | 422 | `SYNTHETIC_LABEL_MISSING` | "Reference to EVINV-POC-STD-001 must include 'Synthetic POC Standard' label." |
| Missing required metadata field | 422 | `PROVENANCE_FIELD_MISSING` | "Required provenance field '[field_name]' is missing from artifact." |
| Unused column in agent-generated XLSX | 422 | `UNUSED_COLUMN_VIOLATION` | "Artifact contains unused column '[column_name]'. Remove unused columns from generated outputs." |

---

### API Surface (this feature)

See `Y1-api.md` §Artifacts for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/artifacts/validate` | Validate an artifact against compact artifact standards |
| `POST` | `/api/artifacts/register` | Register a validated artifact in the artifact registry |
| `GET` | `/api/artifacts/{id}` | Get artifact with provenance |
| `GET` | `/api/artifacts/{id}/versions` | Get all versions of an artifact |

---

### Schema Surface (this feature)

Uses `ProjectState.artifactRegistry[]` — see `Y0-schema.md` §Artifact Registry.

---

*FRD-TTCopilot-v1.0 | F08 | Synthetic POC Data Only*
