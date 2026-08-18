# Pivota Spec Debug Knowledge Base

Resolved debug sessions. Used by `pivota_spec-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## phase4-revised-run-discoverability — Phase 4 revised run and deterministic check results invisible in UI
- **Date:** 2026-08-18
- **Error patterns:** isRevised, deterministicChecks, Run Phase, check results, HV clearance, derating, test-point, cross-artifact, GateReviewWorkspace, revised design baseline, discoverability
- **Root cause:** Three UI gaps: (1) InputReadinessPanel sends empty POST body so isRevised is always false; (2) GateReviewWorkspace receives data.deterministicChecks from API but never renders it in JSX; (3) no UX explanation connects "Upload Revised Version" → "Re-run Phase" → "Check Results"
- **Fix:** (1) Detect activeVersion>1 in handleRunPhase and send isRevised:true in body; (2) Add DeterministicCheckResults card to GateReviewWorkspace consuming data.deterministicChecks; (3) Add contextual callout explaining revised baseline workflow
- **Files changed:** src/components/intake/InputReadinessPanel.tsx, src/components/gate/GateReviewWorkspace.tsx
---

