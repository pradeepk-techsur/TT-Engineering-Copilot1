---
status: diagnosed
trigger: "Diagnose UAT failure: No clear way to trigger revised Phase 4 run or view deterministic check results in the UI"
created: 2026-08-18T00:00:00Z
updated: 2026-08-18T00:00:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: CONFIRMED — Three distinct UI gaps, not one: (1) no revised-run button exists, (2) check results are fetched by the Gate 4 API but never rendered by GateReviewWorkspace, (3) "modified design baseline" concept has no UX affordance connecting upload → re-run
test: Read all 5 files + GateReviewWorkspace + TechnicalChecklistWorkspace + execute/run routes
expecting: Exact file:line gaps confirmed
next_action: COMPLETE — returning diagnosis

## Symptoms

expected: User can (1) trigger a revised Phase 4 run with isRevised=true from the UI, (2) view deterministic check results (HV clearance, derating, test-point, cross-artifact) in the UI, (3) understand what "modifications to the design baseline" means
actual: User cannot find any UI element for triggering revised run or viewing deterministic check results
errors: []
reproduction: Navigate to /phase/4 or /gate/4/review — no revised-run button, no check results panel visible
started: UAT discovery — never implemented in UI layer

## Eliminated

- hypothesis: isRevised is only an internal API concept with no UI path at all
  evidence: UpIntakeCard.tsx:43-45 shows the revised upload endpoint IS called automatically when isReady===true — so revised file upload IS plumbed. The gap is that Phase execute still sends no isRevised flag.
  timestamp: 2026-08-18

- hypothesis: Gate 4 review API doesn't fetch check results
  evidence: gates/4/review/route.ts fetches deterministicChecks from DB (line ~40) and includes them in response as `deterministicChecks`. The gap is the UI component.
  timestamp: 2026-08-18

## Evidence

- timestamp: 2026-08-18
  checked: src/app/phase/[id]/page.tsx (100 lines)
  found: Phase workspace contains InputReadinessPanel + static outputs list for phases >2. No mention of checkResults, no "Revised Run" button, no deterministic check panel.
  implication: /phase/4 renders zero check results and has no revised-run trigger.

- timestamp: 2026-08-18
  checked: src/components/intake/InputReadinessPanel.tsx:34-65, 104-113
  found: handleRunPhase() calls POST /api/phases/${phaseId}/execute with NO body at all (line 38: just method:'POST', no body). The Button (line 105-112) is labeled "Run Phase" with no indication of revision state, and never sets isRevised in the body.
  implication: Even after uploading a revised design file, clicking "Run Phase" will ALWAYS send isRevised=false (route.ts line 12: body.isRevised === true fails since body is empty).

- timestamp: 2026-08-18
  checked: src/app/api/phases/4/execute/route.ts:11-12
  found: Route reads isRevised from body JSON (body.isRevised === true). If body is empty (current UI behavior), isRevised is always false.
  implication: The initial and revised runs are indistinguishable from the UI — always produces initial-baseline results.

- timestamp: 2026-08-18
  checked: src/components/intake/UpIntakeCard.tsx:43-45, 133-135
  found: When isReady===true, the drop zone label changes to "Upload Revised Version of {logicalName}" and routes to /upload-revised endpoint. The upload-revised route triggers dependency graph invalidation but does NOT re-execute the phase.
  implication: User sees "Upload Revised Version" label — this IS the "modification" affordance — but there is no subsequent "Run Revised Phase" CTA, and the Run Phase button silently ignores this state.

- timestamp: 2026-08-18
  checked: src/app/api/checks/phase/[id]/run/route.ts (entire file)
  found: Standalone checks route POST /api/checks/phase/4/run exists, accepts isRevised in body, runs all 4 deterministic checks and returns results directly. This route is NEVER called from any UI component.
  implication: A separate, standalone path to run checks with isRevised exists at API level but is completely invisible to users.

- timestamp: 2026-08-18
  checked: src/app/api/gates/4/review/route.ts (entire file)
  found: Gate 4 review API fetches deterministicChecks from DB (checkResults table, eq phaseId=4) and includes it in response as `deterministicChecks` key. Also includes `seededFindings` separately.
  implication: The data IS being fetched server-side. Gap is purely in the consumer component.

- timestamp: 2026-08-18
  checked: src/components/gate/GateReviewWorkspace.tsx (103 lines)
  found: Component fetches /api/gates/${gateId}/review and receives the full response including deterministicChecks. However, the JSX renders only: Inputs Reviewed, Outputs Reviewed, Findings (FindingsSummaryTable), Decision History, AI Recommendation, and Gate Decision. The `deterministicChecks` key from the API response is NEVER rendered — it is silently dropped.
  implication: CONFIRMED ROOT CAUSE #2 — check results are fetched but never displayed. The data exists in the SWR response but `data.deterministicChecks` is never referenced in JSX.

- timestamp: 2026-08-18
  checked: src/components/checklist/TechnicalChecklistWorkspace.tsx (106 lines)
  found: Shows static checklist items (Netlist Integrity, Footprint Mapping, DFM, Thermal Vias, Trace Width) all with hardcoded "Pending" badge. No live check results, no connection to /api/checks/phase/4/results or /run.
  implication: Checklist workspace does not expose deterministic check results either — all badges are static.

- timestamp: 2026-08-18
  checked: All isRevised references across codebase
  found: isRevised is deeply wired through dfmStandardsAgent.ts, outputGenerators.ts, and all 4 check tools (hvClearanceCheck, componentDeratingCheck, testPointCoverageCheck, crossArtifactConsistencyCheck). The tools have complete REVISED_* datasets. The feature is 100% implemented server-side.
  implication: This is purely a UI surface gap — the server-side capability is complete and correct.

## Resolution

root_cause: |
  THREE DISTINCT UI GAPS, all in the UI layer (server-side is complete):

  GAP 1 — No "Run Revised Phase" trigger (MISSING FEATURE):
  InputReadinessPanel.tsx:38 calls POST /api/phases/${phaseId}/execute with an empty body,
  so isRevised is always false regardless of whether a revised file has been uploaded.
  The "Run Phase" button has no mechanism to detect or signal the revised state.
  After a user uploads a "Revised Version" (UpIntakeCard:44, which correctly routes to
  /upload-revised), there is NO subsequent CTA prompting them to re-run with isRevised=true.

  GAP 2 — Check results fetched but never rendered (HIDDEN FEATURE):
  GateReviewWorkspace.tsx receives data.deterministicChecks from /api/gates/4/review
  (which fetches from checkResults table, gate/4/review/route.ts lines ~40) but
  data.deterministicChecks is never referenced anywhere in the JSX (lines 32–99).
  The four check results (HV Clearance, Component Derating, Test-Point Coverage,
  Cross-Artifact Consistency) exist in the SWR response object and are silently dropped.

  GAP 3 — "Modified design baseline" concept is invisible (DOCUMENTATION/UX):
  The UpIntakeCard changes its label to "Upload Revised Version" (line 135) when isReady=true,
  which is the only UX signal that a revised upload is different. But there is:
  - No explanatory text about what "revised" means (design corrections after CDR findings)
  - No connection shown between "upload revised" → "re-run phase" → "check results change"
  - No status indicator showing "running with initial vs revised baseline"

fix: (not applied — diagnose only)
verification: (not applied)
files_changed: []

## Proposed Fixes

### Fix 1 — Run Phase button: detect revision state and set isRevised (HIGH PRIORITY)

File: src/components/intake/InputReadinessPanel.tsx

In handleRunPhase(), detect if the internal input (for Phase 4) has activeVersion > 1,
which indicates a revised upload has occurred. Pass isRevised:true in the body:

```tsx
const isRevised = (readiness.internal?.activeVersion ?? 1) > 1;
const res = await fetch(`/api/phases/${phaseId}/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ isRevised }),
});
```

And update the button label contextually:
- "Run Phase" (initial state)
- "Run Revised Phase" (when activeVersion > 1 and phase previously completed)

### Fix 2 — Render deterministicChecks in GateReviewWorkspace (HIGH PRIORITY)

File: src/components/gate/GateReviewWorkspace.tsx

Add a "Deterministic Check Results" card after the Findings card (line 74), consuming
data.deterministicChecks[]. Each check row shows: check type, status (Pass/Fail badge),
result value, threshold, and source reference. Example structure:

```tsx
{(data.deterministicChecks ?? []).length > 0 && (
  <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
    <CardHeader><CardTitle className="text-sm">Deterministic Check Results</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      {data.deterministicChecks.map((check: any) => (
        <div key={check.checkId} className="flex items-center justify-between text-xs py-1 border-b ...">
          <span>{check.checkType}</span>
          <span className="text-muted">{check.resultValue}</span>
          <Badge className={check.status === 'Pass' ? 'bg-green-500/10 ...' : 'bg-red-500/10 ...'}>
            {check.status}
          </Badge>
        </div>
      ))}
    </CardContent>
  </Card>
)}
```

### Fix 3 — Contextual help text for "revised design baseline" (MEDIUM PRIORITY)

File: src/components/intake/UpIntakeCard.tsx (or InputReadinessPanel.tsx)

When isReady===true AND phase status is 'AwaitingGate' (findings exist), add an
explanatory callout:

```tsx
{isReady && executionComplete && (
  <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-3 text-xs">
    <p className="font-medium text-amber-400">Design Baseline Modification Available</p>
    <p className="text-amber-400/80 mt-1">
      Upload a corrected design file above, then click "Run Revised Phase" to re-evaluate
      HV clearance, component derating, test-point coverage, and cross-artifact consistency
      against the corrected baseline.
    </p>
  </div>
)}
```

## Severity Assessment

| Gap | Type | Severity |
|-----|------|----------|
| No "Run Revised Phase" button / isRevised never sent from UI | Missing feature (server exists, UI missing) | HIGH — core workflow blocked |
| deterministicChecks fetched but never rendered in GateReviewWorkspace | Hidden feature (data arrives, JSX ignores it) | HIGH — key output invisible |
| "Modified design baseline" has no UX explanation | UX/documentation gap | MEDIUM — discoverable with exploration |

Overall: **HIGH** — The revised-run and check-results features are fully implemented
server-side but completely inaccessible through the UI. A user has no path to exercise
them without direct API calls.
