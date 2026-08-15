# Flow-01: Correction Cycle (Finding → Action → Revised Input → Rerun)

**User Stories:** US-3.1, US-3.2, US-6.1–US-6.4, US-9.4
**Personas:** Marcus Webb (Phase 4), Priya Nair (Phase 2), James Okoro (Phase 6)
**Trigger:** Phase execution complete; one or more findings raised with blocking actions

```
[AV-03 Phase Workspace — Findings Section]
    Finding(s) displayed with severity badges
    Blocking action banner: "N blocking action(s) must be closed before Gate Pass"
         │
         ▼
[AV-07 Findings and Actions Workspace]
    Blocking Actions section at top (red banner)
    Finding detail: ID, Phase, Severity, Description, Linked Actions
         │
         ├── Human reviews finding detail
         │
         ▼
    Corrective Action approval form
    Fields: Action ID, Description, Owner Role, Blocking, Due Phase/Gate,
            Required Closure Evidence, Rationale (free text, required)
         │
         ├── Human approves action
         │   Approval recorded with approver role + timestamp
         │
         └── (If UP input): "Upload Revised Version" button enabled in AV-03
             (If SI input): System creates revised synthetic sample →
                            banner appears: "Revised Synthetic System Sample Available — [System]"
                            Status: "Revised Sample Available; Ingest Required"
                                │
                                ├── User clicks "Ingest Revised Sample"
                                │   (same explicit-action requirement as initial ingestion)
                                │   Confirmation dialog → Confirm
                                └── Status: "Synthetic System Input Ready" (new version)

         ┌─────────────────────────────────────────────────┐
         │ FOR USER-PROVIDED REVISED FILE                  │
         │ AV-03: "Upload Revised Version" button visible  │
         │ User uploads revised file                       │
         │   ├── Validation Fail → prior version stays active│
         │   └── Validation Pass → new version active      │
         └─────────────────────────────────────────────────┘
              │
              ▼
    Targeted Rerun triggered automatically
    Only affected checks, findings, outputs rerun
    Unaffected results preserved
         │
         ▼
[AV-05 Artifact Viewer — Comparison Mode]
    Two-column layout: Original Version | Revised Version
    Differences highlighted
    Provenance panel for each version
         │
         ├── Original results: version_ref = prior_version_id (Fail results)
         └── Revised results: version_ref = new_version_id (Pass/Fail results)
         │
         ▼
    If all blocking actions verified closed:
    → AV-08 Gate Review Workspace: Pass radio enabled
    → Human records gate decision (Pass or Conditional Pass)

    If revised result still fails:
    → New finding(s) raised or existing finding remains Open
    → Cycle repeats
```

**Key UX Constraints in this Flow:**

- "Upload Revised Version" — never "Replace Input" or any synonym of "replacement input"
- Prior versions retained in version history; never deleted
- "Ingest Revised Sample" — same explicit action requirement as initial "Ingest Sample"
- Targeted rerun scope: visible in AV-09 Audit View (input version → checks invalidated → checks rerun → timestamp)
- Where evidence materially changed: output gets "Review Required" badge in AV-08
- Corrective action closure requires: closure evidence artifact ID provided by human

---

*UX-Mockup-TTCopilot | Flow-01 | 2026-08-15 | Synthetic POC Data Only*
