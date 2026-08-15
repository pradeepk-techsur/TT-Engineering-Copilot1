---

## Y2: Cross-Feature Error Catalog

**Document:** Complete error catalog for TT Engineering Copilot POC (EVINV-POC-001).

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

### Error Response Format

All API error responses use the following JSON structure:

```json
{
  "error_code": "ERROR_CODE_CONSTANT",
  "message": "Human-readable message",
  "details": {
    "field": "optional field name",
    "value": "optional value that caused the error",
    "context": "optional contextual information"
  },
  "timestamp": "2026-08-15T14:30:00Z",
  "request_id": "uuid"
}
```

---

### §Gate Authority Errors (F0, F10)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `GATE_AI_PROHIBITED` | 403 | F0, F10 | Gate decision submitted by AI actor or without human reviewer role | "Gate decisions must be made by an authorized human reviewer. AI cannot approve any gate." | Human must explicitly perform the gate decision action. |
| `GATE_OUTCOME_INVALID` | 400 | F0, F10 | Gate outcome value not in {Pass, Conditional Pass, Fail} | "Gate outcome must be Pass, Conditional Pass, or Fail." | Correct the decision value and resubmit. |
| `GATE_LOCKED` | 409 | F0, F10 | Gate decision attempted before phase reaches AwaitingGate | "Gate {n} is locked. Phase must complete execution before gate review." | Wait for phase execution to complete. |
| `GATE_ALREADY_DECIDED` | 409 | F0, F10 | Gate decision on a gate that is already in Decided state | "Gate {n} has already been decided. Use the retry workflow to re-evaluate." | Use POST /api/orchestrator/phase/{id}/retry to re-open. |
| `BLOCKING_ACTIONS_OPEN` | 409 | F10 | Pass decision with open blocking actions | "Cannot record Pass: blocking action(s) {ids} must be verified closed first." | Close all blocking actions, then re-attempt gate decision. |
| `CONDITIONAL_ACTIONS_REQUIRED` | 400 | F10 | Conditional Pass without at least one conditional action | "Conditional Pass requires at least one conditional action to be defined." | Add at least one conditional action before submitting. |
| `REVIEWER_ROLE_MISSING` | 400 | F0, F9, F10 | Gate decision or human action submitted without reviewer role | "Reviewer role is required for all gate decisions and human-controlled actions." | Include reviewer_role in request body and X-Reviewer-Role header. |

---

### §Orchestrator State Errors (F0)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `INPUTS_NOT_READY` | 409 | F0, F2 | Phase execution attempted before both inputs are ready | "Both inputs must be validated and ready before phase execution can begin." | Complete input intake for all pending inputs. |
| `INVALID_STATE_TRANSITION` | 409 | F0 | Phase transition not permitted in current state | "Cannot perform that operation in the current phase state ({current_state})." | Review allowed transitions for current state. |
| `RUN_TO_GATE_INVALID` | 400 | F0 | run_to_gate target gate ≤ current phase | "Target gate must be ahead of the current phase (current: {current})." | Specify a target gate number greater than the current phase. |
| `INPUT_NOT_FOUND` | 404 | F0, F3 | targeted_rerun with unknown input_id | "The specified logical input ID does not exist in ProjectState." | Verify input_id against GET /api/phases/{id}/inputs. |

---

### §Artifact Count Errors (F1)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `ARTIFACT_COUNT_VIOLATION` | 409 | F1 | Attempt to add second external or second internal input, or third output | "Phase {n} already has [one external input / one internal input / two outputs]. Maximum count exceeded." | Do not add additional artifacts; revise the existing artifact instead. |
| `GATE_PACK_PROHIBITED` | 409 | F1 | Gate-pack artifact registered as a phase output | "Gate-pack artifacts must not be registered as phase outputs. Use the Gate Review Workspace (AV-08)." | Remove from outputs[]; render from ProjectState in Gate Review Workspace. |

---

### §Input Intake Errors (F2)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `FILE_TYPE_INVALID` | 400 | F2 | Uploaded file has unsupported extension | "File type not accepted. Supported formats: {list}." | Upload a file in one of the supported formats. |
| `FILE_NOT_PARSEABLE` | 400 | F2 | Uploaded file is corrupted, empty, or password-protected | "The uploaded file could not be parsed. Check the file and try again." | Verify file integrity and re-upload. |
| `PROJECT_ID_MISMATCH` | 422 | F2 | Project ID field in uploaded file ≠ EVINV-POC-001 | "Project ID in file does not match EVINV-POC-001." | Correct the Project ID field and re-upload. |
| `PRODUCT_NAME_MISMATCH` | 422 | F2 | Product name field in file ≠ EV-INV-800 | "Product name in file does not match EV-INV-800 Demonstration Traction Inverter." | Correct the product name and re-upload. |
| `PHASE_MISMATCH` | 422 | F2 | Phase field in file ≠ current phase | "Phase field in file does not match Phase {n}." | Correct the phase field and re-upload. |
| `REVISION_MISSING` | 422 | F2 | Revision field absent or empty | "Revision field is missing or empty. All versioned documents must include a revision level." | Add revision field and re-upload. |
| `UNITS_MISSING` | 422 | F2 | Quantitative field lacks units | "Field '{field}' contains a numeric value without units. Add units to all quantitative fields." | Add units to all numeric fields. |
| `DUPLICATE_IDENTIFIERS` | 422 | F2 | Duplicate row IDs in XLSX/CSV | "Duplicate identifier '{id}' found in rows {rows}. Row identifiers must be unique." | Remove duplicate rows or assign unique IDs. |
| `REQUIRED_SECTION_MISSING` | 422 | F2 | Required section or field absent from uploaded file | "Required section '{section}' not found in uploaded file." | Add the required section and re-upload. |
| `DATA_CONSISTENCY_ERROR` | 422 | F2 | Cross-field consistency check failure | "Data consistency error: {description}." | Correct the inconsistency and re-upload. |
| `INGEST_WITHOUT_REVIEW` | 409 | F2 | Ingest Sample clicked without prior View or Download | "Please view or download the synthetic sample before ingesting." | Click View or Download before clicking Ingest Sample. |
| `AUTO_INGEST_PROHIBITED` | 403 | F2 | Programmatic auto-ingestion attempt | "Automatic sample ingestion is prohibited. User must explicitly click Ingest Sample." | Require explicit user action to ingest. |
| `PROHIBITED_LABEL_DETECTED` | 500 | F2 | Generated content contains prohibited connectivity claim | "Generated content contains a prohibited connectivity claim ('Connected to…', 'Retrieved from…', 'Live…'). Content rejected." | Regenerate content using permitted labels. |

---

### §Versioning Errors (F3)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `REVISION_VALIDATION_FAILED` | 422 | F3 | Revised file fails validation | "Revised version did not pass validation: {issue}. Prior version remains active." | Correct the validation issue and re-upload the revised version. |
| `VERSION_INTEGRITY_VIOLATION` | 500 | F3 | Two active versions detected for same input | "Internal error: more than one active version detected for input {id}." | Contact system administrator. |
| `DEPENDENCY_GRAPH_ERROR` | 500 | F3 | Dependency graph traversal fails | "Dependency graph traversal failed for input {id}. Targeted rerun cannot proceed." | Check dependency graph integrity via GET /api/project/dependency-graph. |
| `REVISED_SAMPLE_NOT_AVAILABLE` | 409 | F3 | Revised SI sample ingest attempted when no revised sample available | "No revised synthetic sample is available for this input." | Wait for revised sample to become available, then retry. |

---

### §Deterministic Check Errors (F5)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `NO_ACTIVE_INPUT_VERSION` | 409 | F5 | Check run with no active input version | "Cannot run check: no active version for input '{logical_name}'." | Complete input intake before running checks. |
| `REQUIRED_CHECKS_NOT_RUN` | 409 | F5 | Gate review before mandatory checks run | "Phase {n} gate review requires all mandatory checks. Missing: {check_types}." | Run all mandatory checks via POST /api/checks/phase/{id}/run. |
| `DETERMINISTIC_INTEGRITY_VIOLATION` | 500 | F5 | LLM inference detected in deterministic check result | "Check result contains LLM-generated content. Deterministic checks must not use LLM inference." | Fix check implementation to use code-only calculation. |
| `SYNTHETIC_LABEL_MISSING` | 422 | F5, F8 | EVINV-POC-STD-001 referenced without synthetic label | "Reference to EVINV-POC-STD-001 must include 'Synthetic POC Standard' label." | Add synthetic label to all standard references. |

---

### §Seeded Issue Errors (F6)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `HUMAN_APPROVAL_REQUIRED` | 403 | F6 | Corrective action auto-closed without human approval | "Corrective action closure requires human approval." | Human must explicitly approve and close the action. |
| `AUDIT_INTEGRITY_VIOLATION` | 500 | F6, F4 | Original check results deleted after correction | "Original check results must not be deleted. Correction cycle preserves both results." | Restore original results; contact system administrator. |
| `SEEDED_FLAG_MISSING` | 422 | F6 | Seeded finding created without seeded=true | "Seeded issue finding must have seeded=true in the finding record." | Set seeded=true on all seeded demonstration findings. |

---

### §Token Optimization Errors (F7)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `REFERENCE_INDEX_NOT_INITIALIZED` | 503 | F7 | Agent invoked before reference index built | "Reference index has not been built. Run system initialization first." | POST /api/system/initialize-index, then retry. |
| `CONTEXT_TOKEN_BUDGET_EXCEEDED` | 422 | F7 | Assembled context exceeds token budget | "Assembled context exceeds token budget of {budget} tokens. Trimming applied." | Review context selection rules; reduce passage retrieval scope. |
| `FULL_DOC_IN_CONTEXT` | 500 | F7 | Full reference document transmitted to agent | "Internal error: full reference document transmitted to agent. Context assembly rules violated." | Fix context assembly layer to use passage retrieval only. |
| `DETERMINISTIC_DELEGATION_VIOLATION` | 500 | F7 | Deterministic computation delegated to LLM | "Deterministic check computation must not be delegated to LLM. Use tool call instead." | Implement calculation as a deterministic tool call. |

---

### §Compact Artifact Errors (F8)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `DISCLAIMER_MISSING` | 422 | F8 | Artifact lacks mandatory disclaimer | "Artifact rejected: mandatory disclaimer not present." | Add disclaimer text to artifact before submission. |
| `ROW_COUNT_VIOLATION` | 422 | F8 | Agent-generated XLSX has > 10 meaningful rows | "Agent-generated XLSX has {n} rows; maximum is 10." | Reduce to ≤ 10 representative rows. |
| `ROW_COUNT_WARNING` | 200 (warning) | F8 | User-uploaded XLSX has > 10 rows | "Uploaded file has {n} rows; recommended maximum is 10. Processing continues." | Consider condensing to most representative rows. |
| `PAGE_COUNT_VIOLATION` | 422 | F8 | DOCX/PDF has > 2 pages | "DOCX/PDF has {n} pages; maximum is 2." | Condense document to ≤ 2 pages. |
| `COLUMN_COUNT_VIOLATION` | 422 | F8 | XLSX/CSV has < 6 or > 10 columns | "XLSX/CSV has {n} columns; required range is 6–10." | Add or remove columns to comply. |
| `PROVENANCE_FIELD_MISSING` | 422 | F8 | Required provenance field absent from artifact | "Required provenance field '{field}' is missing." | Add all required provenance fields. |
| `UNUSED_COLUMN_VIOLATION` | 422 | F8 | Agent-generated XLSX has unused columns | "Artifact contains unused column '{column}'. Remove unused columns." | Remove or populate all columns. |

---

### §Application View Errors (F9)

| Error Code | HTTP Status | Source Feature | Trigger | Message | Retry Guidance |
|---|---|---|---|---|---|
| `NO_CHECKLIST_MAPPED` | 404 | F9 | Checklist workspace requested for Phase 2 or 5–9 | "No technical review is mapped to Phase {n}. Checklist Workspace is not available." | No action; this is expected behavior for unmapped phases. |
| `AUDIT_IMMUTABLE` | 403 | F9 | Edit or delete attempted on audit record | "Audit records are immutable. No modifications are permitted." | No action; audit records cannot be changed by design. |
| `OUTPUT_COUNT_NOT_VALIDATED` | 409 | F1, F9 | Phase execution before output count validated | "Phase outputs have not been validated for count compliance." | Validate artifact counts before proceeding. |

---

### §Terminology Enforcement

These are not runtime API errors but enforcement rules verified by automated text scan:

| Prohibited String | Correct String | Enforcement Point |
|---|---|---|
| "replacement input" | "revised version" or "Upload Revised Version" | UI labels, API response bodies, generated text, audit records |
| "Connected to [SYSTEM]" | "Simulated Connector" | UI labels, API response bodies |
| "Retrieved from [SYSTEM]" | "Preloaded Synthetic Sample" | UI labels, API response bodies |
| "Live [SYSTEM] Data" | "Synthetic System Input" | UI labels, API response bodies |
| "Real-time [SYSTEM]" | "Simulated [SYSTEM] data" | UI labels, API response bodies |

---

*FRD-TTCopilot-v1.0 | Y2-Errors | Synthetic POC Data Only*
