---

## F02: Input Intake Framework

**Requirements:** II-01 to II-21, UP-01 to UP-05, SE-01 to SE-05, IR-01 to IR-03 | **Priority:** P0

**Description:** Every input has a predetermined intake behavior — either USER-PROVIDED FILE (UP) or SIMULATED EXTERNAL-SYSTEM INTAKE (SI) — defined in the phase configuration. The system never prompts the user to select an intake mode. The two intake workflows are fully distinct in their UI presentation, validation logic, status labeling, and audit recording. Intake events are permanently recorded with full provenance.

---

### Terminology

- **USER-PROVIDED FILE (UP):** Intake behavior requiring the user to upload a file; system validates it.
- **SIMULATED EXTERNAL-SYSTEM INTAKE (SI):** Intake behavior using a preloaded synthetic sample representing an enterprise system; user must explicitly ingest the sample.
- **Ingest Sample:** The explicit user action required to accept a synthetic sample into the intake pipeline; automatic ingestion without user action is prohibited.
- **System Represented:** The label identifying which enterprise system (Salesforce, Cora, MES, ERP, etc.) the simulated connector represents.
- **Intake Event:** The immutable audit record written at the completion of any intake action (upload accepted, sample ingested).
- **Upload Revised Version:** The workflow for providing a new version of a user-provided file; prior version is retained. Term "replacement input" is prohibited.
- **Revised Synthetic System Sample Available:** The workflow notification when a new synthetic sample is available; user must ingest explicitly.

---

### Sub-features

- Predetermined intake behavior per input (configured in phase config; not user-selectable)
- USER-PROVIDED FILE workflow: display, upload, validate, confirm, status transition
- SIMULATED EXTERNAL-SYSTEM INTAKE workflow: display, label, ingest action, normalize, record
- Input readiness panel on every Phase Workspace (AV-03)
- Phase Execution Status display with all six states
- Intake event audit record for every intake action
- Prohibited labels and terminology enforced

---

### User-Provided File Workflow (UP)

#### Process

1. System reads phase configuration; determines input requires USER-PROVIDED FILE intake.
2. Phase Workspace (AV-03) Input Readiness Panel displays:
   - **Artifact Name:** e.g., "Customer Opportunity Package"
   - **Required Content Description:** bullet list of required sections/fields
   - **Supported Formats:** accepted file types (e.g., PDF, DOCX, XLSX, CSV)
   - **Size Guidance:** e.g., "~10 rows for XLSX; 1–2 pages for DOCX/PDF"
   - **Sample/Template Link:** optional; if available, shows "Download Sample" link
   - **Upload Prompt:** "Upload [Artifact Name]" button
   - **Status:** `Awaiting User Input`
3. User selects file and submits via upload control.
4. System validates the uploaded file (see Validation Rules below).
5. **If validation fails:** System displays the specific validation failure message. Upload button remains active. Phase execution remains blocked. Status remains `Awaiting User Input`. System does NOT substitute synthetic data.
6. **If validation passes:** System writes artifact record to ProjectState with provenance. Status transitions to `User Input Ready`. Confirmation message displayed: "[Artifact Name] received and validated. Version [n] active."
7. Upload control changes to "Upload Revised Version" after successful intake.
8. Intake event record written to `ProjectState.auditHistory[]`.

#### Validation Rules (User-Provided Files)

- `file_type`: Must match one of the configured accepted formats for this input (e.g., `.pdf`, `.docx`, `.xlsx`, `.csv`). Reject with `FILE_TYPE_INVALID`.
- `parseability`: File must be parseable (not corrupted, not password-protected, not empty). Reject with `FILE_NOT_PARSEABLE`.
- `project_id_field`: If artifact contains a Project ID field, it must match `EVINV-POC-001`. Reject with `PROJECT_ID_MISMATCH`.
- `product_name_field`: If artifact contains a product name field, it must match `EV-INV-800`. Reject with `PRODUCT_NAME_MISMATCH`.
- `phase_field`: If artifact contains a phase field, it must match the current lifecycle phase. Reject with `PHASE_MISMATCH`.
- `revision_field`: Must be present and non-empty for versioned documents. Reject with `REVISION_MISSING`.
- `unit_presence`: Numerical values must have associated units (e.g., kW, VDC, °C). Reject with `UNITS_MISSING`.
- `identifier_uniqueness`: Row identifiers (IDs) within XLSX/CSV must be unique. Reject with `DUPLICATE_IDENTIFIERS`.
- `row_count_guidance`: XLSX/CSV must not exceed ~10 meaningful rows (header excluded). Display warning (not rejection) if exceeded: `ROW_COUNT_WARNING`.
- `page_count_guidance`: DOCX/PDF should be ≤2 pages. Display warning (not rejection) if exceeded: `PAGE_COUNT_WARNING`.
- `data_consistency`: Cross-field consistency checks (e.g., referenced IDs exist, date ranges valid). Reject with `DATA_CONSISTENCY_ERROR`.
- `required_sections`: Document must contain all required sections/fields defined in phase config for this input. Reject with `REQUIRED_SECTION_MISSING`.

#### Status States (UP Workflow)

| Status | Condition |
|---|---|
| `Awaiting User Input` | No file uploaded yet, or prior upload failed validation |
| `Validation In Progress` | File submitted; system is validating |
| `User Input Ready` | File validated successfully; artifact registered |

---

### Simulated External-System Intake Workflow (SI)

#### Process

1. System reads phase configuration; determines input requires SIMULATED EXTERNAL-SYSTEM INTAKE.
2. Phase Workspace (AV-03) Input Readiness Panel displays:
   - **Artifact Name:** e.g., "Capability & Opportunity Assessment Package"
   - **System Represented:** label identifying which enterprise system is simulated (e.g., "Salesforce / Cora / capability library")
   - **Simulated Connector label:** "Simulated Connector — No live connection"
   - **Sample label:** "Preloaded Synthetic Sample"
   - **Synthetic disclaimer:** displayed prominently
   - **View button:** opens artifact viewer for the preloaded sample
   - **Download button:** downloads the preloaded sample file
   - **Ingest Sample button:** the explicit action required to proceed; disabled until user views or downloads
   - **Status:** `Waiting for Synthetic Sample Ingestion`
3. User reviews the synthetic sample (via View or Download).
4. User explicitly clicks "Ingest Sample." System does not auto-ingest.
5. System validates and normalizes the synthetic sample (structural validation; format normalization).
6. System registers provenance: source artifact ID, represented system, intake behavior = `SI`, intake timestamp.
7. System writes intake event record to `ProjectState.auditHistory[]`.
8. Status transitions to `Synthetic System Input Ready`.
9. Confirmation displayed: "[Artifact Name] (Synthetic System Input) ingested from [System Represented]. Version [n] active."

#### Prohibited Labels (SI Workflow)

The following strings must never appear in any UI label, API response, or generated artifact text:

| Prohibited | Use Instead |
|---|---|
| "Connected to [SYSTEM]" | "Simulated Connector" |
| "Retrieved from [SYSTEM]" | "Preloaded Synthetic Sample" |
| "Live [SYSTEM] Data" | "Synthetic System Input" |
| "Real-time [SYSTEM]" | "Simulated [SYSTEM] data" |

#### Status States (SI Workflow)

| Status | Condition |
|---|---|
| `Waiting for Synthetic Sample Ingestion` | Preloaded sample available; user has not yet ingested |
| `Ingesting` | System is validating and normalizing after user clicks "Ingest Sample" |
| `Synthetic System Input Ready` | Sample ingested, validated, and registered |

---

### Intake Event Record Schema

Every intake action (UP or SI) writes one immutable intake event record to `ProjectState.auditHistory[]`:

| Field | Type | Description |
|---|---|---|
| `event_id` | string (UUID) | Unique intake event identifier |
| `event_type` | enum | `USER_FILE_UPLOAD` or `SIMULATED_INTAKE` |
| `phase_id` | integer 0–9 | TT lifecycle phase |
| `logical_input` | string | Name of the logical input (e.g., "Customer Opportunity Package") |
| `intake_behavior` | enum | `UP` or `SI` |
| `user_action` | string | Action taken: "file_uploaded", "sample_ingested", "revised_version_uploaded" |
| `system_represented` | string \| null | Enterprise system label (SI only); null for UP |
| `status` | enum | `User Input Ready` or `Synthetic System Input Ready` |
| `source_artifact_id` | string | Original file/sample artifact ID |
| `normalized_artifact_id` | string | Normalized/validated artifact ID stored in registry |
| `version` | integer | Version number (1 = first; 2 = revised, etc.) |
| `validation_result` | object | `{passed: bool, issues: ValidationIssue[]}` |
| `timestamp` | ISO 8601 datetime | UTC timestamp of intake completion |
| `operator_id` | string | System or user identifier who performed the action |

---

### Input Readiness Panel (Phase Workspace — Both Inputs)

The Phase Workspace (AV-03) must display the following for each of the two logical inputs:

| Field | Description |
|---|---|
| **Artifact Name** | Logical name of this input as defined in phase configuration |
| **Intake Behavior** | `User-Provided File` or `Simulated External-System Intake` |
| **System Represented** | Enterprise system label (SI inputs only; blank for UP) |
| **Format** | Accepted file types |
| **Size Guidance** | Row count or page count guidance |
| **Active Artifact** | Name/ID of the currently active artifact (or "None") |
| **Active Version** | Version number of the active artifact |
| **Validation Status** | Pass/Fail/Pending with validation issue detail if failed |
| **Required User Action** | Next action the user must take (e.g., "Upload file", "Click Ingest Sample") |
| **Ready Indicator** | `Ready` (green) or `Not Ready` (amber/red) |

---

### Phase Execution Status

Displayed prominently on the Phase Workspace, transitions in order:

| Status | Trigger |
|---|---|
| `Waiting for User Input` | UP input not yet uploaded |
| `Waiting for Synthetic Sample Ingestion` | SI input not yet ingested |
| `Ready to Run` | Both inputs validated and ready; awaiting human to initiate execution |
| `Processing` | Phase agent running |
| `Awaiting Human Decision` | Phase execution complete; gate open |
| `Complete` | Gate decided (Pass, Conditional Pass, or Fail recorded) |

Note: If a phase has one UP and one SI input, the status reflects the one that is blocking (not yet ready).

---

### Validation Rules (Framework-Level)

- Intake behavior for every input is defined in phase configuration; runtime selection by user is prohibited.
- Silent substitution of synthetic data for missing user input is prohibited.
- Automatic ingestion of synthetic samples (without explicit user "Ingest Sample" action) is prohibited.
- Phase execution (`Running`) is blocked until both inputs are in `Ready` status.
- Every intake action produces an immutable audit event; no intake action may occur without producing an audit record.
- Prohibited label strings must be absent from all UI strings, API response bodies, and generated artifact text; enforce via automated text scan.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| File upload with unsupported format | 400 | `FILE_TYPE_INVALID` | "File type not accepted. Supported formats: [list]." |
| File not parseable (corrupted/empty) | 400 | `FILE_NOT_PARSEABLE` | "The uploaded file could not be parsed. Please check the file and try again." |
| Project ID mismatch in file | 422 | `PROJECT_ID_MISMATCH` | "Project ID in file does not match EVINV-POC-001." |
| Required section missing | 422 | `REQUIRED_SECTION_MISSING` | "Required section '[section name]' not found in uploaded file." |
| Ingest Sample called without prior view/download | 409 | `INGEST_WITHOUT_REVIEW` | "Please view or download the synthetic sample before ingesting." |
| Auto-ingest attempt (programmatic) | 403 | `AUTO_INGEST_PROHIBITED` | "Automatic sample ingestion is prohibited. User must explicitly click Ingest Sample." |
| Phase execution attempted before both inputs ready | 409 | `INPUTS_NOT_READY` | "Both inputs must be ready before phase execution can begin." |
| Prohibited label string detected in generated text | 500 | `PROHIBITED_LABEL_DETECTED` | "Generated content contains a prohibited connectivity claim. Content rejected." |

---

### API Surface (this feature)

See `Y1-api.md` §Intake for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/inputs` | Get input readiness status for both inputs |
| `POST` | `/api/phases/{id}/inputs/external/upload` | Upload user-provided external input file |
| `POST` | `/api/phases/{id}/inputs/internal/upload` | Upload user-provided internal input file |
| `POST` | `/api/phases/{id}/inputs/external/ingest` | Ingest synthetic external sample (explicit user action) |
| `POST` | `/api/phases/{id}/inputs/internal/ingest` | Ingest synthetic internal sample (explicit user action) |
| `POST` | `/api/phases/{id}/inputs/external/upload-revised` | Upload revised version of external input |
| `POST` | `/api/phases/{id}/inputs/internal/upload-revised` | Upload revised version of internal input |
| `GET` | `/api/phases/{id}/execution-status` | Get Phase Execution Status |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[n].externalInput`, `ProjectState.phases[n].internalInput`, `ProjectState.auditHistory[]` (intake event records), `PhaseConfig.intakeBehavior` — see `Y0-schema.md` §Input Intake.

---

*FRD-TTCopilot-v1.0 | F02 | Synthetic POC Data Only*
