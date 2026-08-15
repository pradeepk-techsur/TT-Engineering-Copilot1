---

## F03: Input Versioning and Dependency-Aware Revision

**Requirements:** IV-01 to IV-04 | **Priority:** P0

**Description:** Only one version of each logical input is active at any time. When a revised version is provided (either by user upload or by revised synthetic sample availability), the system creates a new version record, preserves all prior versions, makes the new version active, identifies all affected checks, findings, and outputs via the dependency graph, invalidates only the affected items, reruns them, and stores both original and revised results side by side. Human re-review is required wherever evidence materially changes.

---

### Terminology

- **Active Version:** The version of a logical input that is currently used by phase agents, checks, and the Gate Review Workspace. Exactly one per logical input at all times.
- **Historical Version:** A prior version of a logical input that has been superseded; retained in ProjectState for traceability, comparison, audit, and reproduction.
- **Version Record:** A structured record in ProjectState capturing version number, artifact ID, intake behavior, provenance, validation result, timestamp, and active flag.
- **Dependency Graph:** Directed acyclic graph stored in ProjectState mapping each logical input to the checks, findings, and outputs that depend on it.
- **Affected Scope:** The set of checks, findings, and outputs identified by traversing the dependency graph from the revised input node.
- **Invalidated Item:** A check result, finding, or output that depended on the prior version and must be rerun with the new version.
- **Upload Revised Version:** The workflow label for providing a new version of a user-provided file. The term "replacement input" is prohibited in all contexts.
- **Revised Synthetic System Sample Available:** The workflow notification and label for a new version of a synthetic sample.

---

### Sub-features

- Single active version enforcement per logical input
- Prior version retention for traceability and comparison
- Upload Revised Version workflow for user-provided files
- Revised Synthetic System Sample Available workflow for simulated inputs
- Dependency graph traversal to compute affected scope
- Targeted invalidation: only affected items marked `Invalidated`
- Targeted rerun: only invalidated items rerun
- Side-by-side result preservation: original and revised results both stored
- Human re-review flagging when evidence materially changes

---

### Process: Revised User-Provided File

1. Phase Workspace (AV-03) displays "Upload Revised Version" button once an input is in `User Input Ready` status.
2. User submits a revised file via the "Upload Revised Version" control.
3. System creates a new `InputVersion` record: `version = prior_version + 1`, `active = false` (pending validation).
4. System runs all UP validation rules (see F02) on the revised file.
5. If validation fails: new version record marked `validation_failed`; prior version remains active. User must correct and re-upload.
6. If validation passes: new version record marked `active = true`; prior version record set `active = false` (retained).
7. System traverses the dependency graph from this logical input node to compute affected scope.
8. All items in affected scope are marked `Invalidated` in ProjectState.
9. Orchestrator is notified; initiates targeted rerun for the invalidated items.
10. Rerun executes affected checks, regenerates affected findings and outputs.
11. New results stored under `version_ref = new_version_id`; original results retain `version_ref = prior_version_id`.
12. For each affected output where evidence materially changed: output `review_required` flag set to `true`; Gate Review Workspace highlights items requiring re-review.
13. Intake event record written to `ProjectState.auditHistory[]` with `user_action = "revised_version_uploaded"`.

---

### Process: Revised Synthetic System Sample

1. When a revised synthetic sample becomes available (e.g., after Phase 4 correction cycle), the system creates a new `InputVersion` record for the SI input with `status = available`, `active = false`.
2. Phase Workspace displays notification: "Revised Synthetic System Sample Available — [System Represented]."
3. Status indicator for the input changes to `Revised Sample Available; Ingest Required`.
4. User explicitly clicks "Ingest Revised Sample" (same explicit-action requirement as initial ingestion).
5. System validates and normalizes the revised sample.
6. If validation passes: new version made active; prior version retained.
7. System traverses dependency graph; computes and invalidates affected scope.
8. Targeted rerun executed; results stored with version reference.
9. Intake event written with `user_action = "revised_sample_ingested"`.

---

### Dependency Graph Structure

The dependency graph is maintained in `ProjectState.dependencyGraph` as an adjacency list:

- **Nodes:** logical inputs, deterministic checks, findings, phase outputs
- **Edges:** directed edges from input → check, input → finding (where finding is detected from input content), check → finding, finding → output, input → output
- **Traversal:** on revision of input X, perform breadth-first traversal from X; collect all reachable nodes; these form the affected scope

Example dependency chain for Phase 4 external input revision:
```
Phase4.ExternalInput → CrossArtifactConsistencyCheck
Phase4.ExternalInput → HVClearanceCheck
Phase4.ExternalInput → DeratingCheck
Phase4.ExternalInput → TestPointCoverageCheck
HVClearanceCheck → Finding[F4-001]
DeratingCheck → Finding[F4-002]
CrossArtifactConsistencyCheck → Finding[F4-004]
Phase4.ExternalInput → Output[DFM_Audit]
```

---

### Version Record Schema

Each logical input maintains a `versions[]` array in ProjectState:

| Field | Type | Description |
|---|---|---|
| `version_id` | string (UUID) | Unique version identifier |
| `version_number` | integer | Sequential (1, 2, 3, …) |
| `artifact_id` | string | Reference to artifact in artifact registry |
| `intake_behavior` | enum | `UP` or `SI` |
| `active` | boolean | True for exactly one version at any time |
| `validation_result` | object | `{passed: bool, issues: ValidationIssue[]}` |
| `intake_timestamp` | ISO 8601 | UTC timestamp of intake |
| `invalidated_by` | string \| null | `version_id` of version that superseded this one |
| `rerun_triggered` | boolean | Whether this version triggered a targeted rerun |
| `affected_scope` | string[] | List of check/finding/output IDs invalidated by this version |

---

### Inputs

- `phase_id` (integer 0–9, required): lifecycle phase of the input being revised
- `input_type` (enum: `external` | `internal`, required): which logical input is being revised
- `file` (binary, required for UP revision): the revised file
- (For SI revision, no file input — system generates revised sample automatically)

---

### Outputs

- New `InputVersion` record created and made active
- Prior `InputVersion` record retained with `active = false`
- `dependencyGraph` traversal result: `affected_scope[]` list
- Invalidated check results marked in `ProjectState.checkResults[]`
- Invalidated finding results marked in `ProjectState.findings[]`
- Invalidated outputs marked in `ProjectState.phases[n].outputs[]`
- Rerun results written with `version_ref` pointing to new version
- Intake audit event appended to `ProjectState.auditHistory[]`

---

### Validation Rules

- Exactly one `InputVersion` record per logical input may have `active = true` at any time; enforced at write level.
- Prior versions must never be deleted; only `active` flag may change (from true to false).
- The term "replacement input" must not appear in any UI label, API response, or audit record.
- Revised version must pass all validation rules (same rules as initial intake) before being made active.
- If revised version fails validation, the prior active version remains active and unchanged.
- Targeted rerun must only invalidate items in the computed `affected_scope`; it must not invalidate unrelated checks from other inputs.
- Original results (from prior version) must be stored with their `version_ref` intact after rerun.
- Human `review_required` flag must be set on any output where key evidence fields changed between original and revised results.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Revised file fails validation | 422 | `REVISION_VALIDATION_FAILED` | "Revised version did not pass validation: [specific issue]. Prior version remains active." |
| Two active versions detected (data integrity) | 500 | `VERSION_INTEGRITY_VIOLATION` | "Internal error: more than one active version detected for input [id]. Contact system administrator." |
| Dependency graph traversal fails | 500 | `DEPENDENCY_GRAPH_ERROR` | "Dependency graph traversal failed for input [id]. Targeted rerun cannot proceed." |
| Revised sample ingest attempted without availability | 409 | `REVISED_SAMPLE_NOT_AVAILABLE` | "No revised synthetic sample is available for this input." |
| Prior version accessed for read after supersession | 200 | — | (read-only access to historical version succeeds; no error) |

---

### API Surface (this feature)

See `Y1-api.md` §Versioning for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/phases/{id}/inputs/{type}/versions` | List all versions (active + historical) for a logical input |
| `GET` | `/api/phases/{id}/inputs/{type}/versions/{vid}` | Get a specific version record |
| `POST` | `/api/phases/{id}/inputs/{type}/upload-revised` | Upload revised user-provided file |
| `POST` | `/api/phases/{id}/inputs/{type}/ingest-revised` | Ingest revised synthetic sample |
| `GET` | `/api/phases/{id}/inputs/{type}/affected-scope` | Compute and return affected scope for current active version |
| `GET` | `/api/project/dependency-graph` | Get full dependency graph |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[n].externalInput.versions[]`, `ProjectState.phases[n].internalInput.versions[]`, `ProjectState.dependencyGraph`, `ProjectState.checkResults[]`, `ProjectState.findings[]` — see `Y0-schema.md` §Versioning and §Dependency Graph.

---

*FRD-TTCopilot-v1.0 | F03 | Synthetic POC Data Only*
