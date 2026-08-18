---
status: diagnosed
trigger: "UAT blocker: Run Phase button on Phase 3 fires but Phase 3 outputs never appear — POST /api/phases/3/execute returns INPUTS_NOT_READY 409"
created: 2026-08-18T00:00:00Z
updated: 2026-08-18T12:00:00Z
---

## Current Focus

hypothesis: Phase 3 has THREE compounding bugs that together cause the silent failure:
  BUG 1 (BLOCKER): Seed never inserts phase_inputs rows for Phase 3. The execute route
  does a DB lookup and finds nothing → extReady=false, intReady=false → 409 immediately,
  before any agent runs. The button IS enabled (execution-status returns bothReady=false
  too, so it should be disabled) but the error IS surfaced via executeError — the user
  just doesn't see the real cause.
  BUG 2 (BLOCKER): The execute route's readiness check checks the WRONG status string for
  Phase 3's external input. The external input is SI-behavior, so its status is
  'Synthetic System Input Ready' — and the route checks for exactly that. CORRECT.
  But the internal input is UP-behavior, so its status is 'User Input Ready' — and the
  route checks for exactly that. ALSO CORRECT. So the readiness string check logic is
  actually right for Phase 3, IF inputs exist in DB.
  BUG 3 (UX BLOCKER): Even if execution succeeded, src/app/phase/[id]/page.tsx line 79
  hard-gates OutputsPanel to phaseId <= 2. Phase 3 gets a static string list from
  config.outputs — NOT the live OutputsPanel component. The /api/phases/3/outputs route
  exists and is correctly implemented, but is never called from the page. Outputs would
  never appear even after a successful agent run.

test: confirmed via code reading — seed.ts inserts only projectState + phaseStates, never
  phaseInputs. The execute route queries phaseInputs for phaseId=3, gets [], returns 409.

expecting: ROOT CAUSE CONFIRMED — document all findings with file:line evidence.

next_action: DIAGNOSIS COMPLETE — return structured findings to UAT caller.

## Symptoms

expected: Clicking Run Phase on Phase 3 triggers agent execution and outputs appear in the Phase Workspace
actual: POST /api/phases/3/execute returns 409 INPUTS_NOT_READY; Phase 3 outputs never appear even hypothetically
errors: {"error_code":"INPUTS_NOT_READY","message":"Both inputs must be ready before phase execution."}
reproduction: Fresh seed → navigate to /phase/3 → click Run Phase → INPUTS_NOT_READY 409
started: UAT session (2026-08-18)

## Eliminated

- hypothesis: The readiness status strings in execute route don't match what the intake handlers write
  evidence: route.ts line 15 checks 'Synthetic System Input Ready' for external (SI) — siHandler.ts line 99
    writes exactly 'Synthetic System Input Ready'. Line 16 checks 'User Input Ready' for internal (UP) —
    upHandler.ts line 99 writes exactly 'User Input Ready'. Strings match. Logic is correct IF rows exist.
  timestamp: 2026-08-18

- hypothesis: The execute route applies a phase-gating check (currentPhase must be >= 3)
  evidence: route.ts lines 10–20 show NO currentPhase check. Only phaseInputs readiness. No sequential
    gating enforced at the execute route level.
  timestamp: 2026-08-18

- hypothesis: The Run Phase button is disabled so the API is never called at all
  evidence: InputReadinessPanel.tsx line 73: bothReady comes from execStatus?.bothReady. The execution-status
    route (lines 53) sets bothReady = extReady && intReady, where extReady/intReady are true if ANY of
    'User Input Ready' OR 'Synthetic System Input Ready'. With NO rows in phaseInputs, BOTH are false,
    so bothReady=false and the button IS disabled. Meaning the 409 the UAT prompt describes is from a
    manually invoked cURL/test call, not from the actual button click (button would be disabled).
  timestamp: 2026-08-18

## Evidence

- timestamp: 2026-08-18T12:01:00Z
  checked: src/db/seed.ts lines 1–131 (entire file)
  found: seed() inserts only projectState (line 22) and phaseStates (line 66). There is NO insert into
    phaseInputs anywhere in the file. The phaseInputs table is EMPTY after a fresh seed.
  implication: Every execute route, execution-status route, and inputs route that queries phaseInputs
    for phase 3 will get zero rows. The execute route will always return 409 INPUTS_NOT_READY after a
    fresh seed until a user explicitly ingests the SI sample (external) AND uploads a UP file (internal).

- timestamp: 2026-08-18T12:02:00Z
  checked: src/app/api/phases/3/execute/route.ts lines 10–20
  found: Lines 11–12 query phaseInputs for projectId='EVINV-POC-001', phaseId=3.
    Line 15: extReady = inputs.find(i=>i.inputRole==='external')?.readinessStatus === 'Synthetic System Input Ready'
    Line 16: intReady = inputs.find(i=>i.inputRole==='internal')?.readinessStatus === 'User Input Ready'
    Line 18: if (!extReady || !intReady) → 409.
    With empty inputs[], both find() calls return undefined, .readinessStatus is undefined, === check is
    false, extReady=false, intReady=false → 409 always.
  implication: The 409 is the correct early response given the empty DB state. The root cause is the
    missing seed data, not a logic error in the execute route.

- timestamp: 2026-08-18T12:03:00Z
  checked: src/app/api/phases/[id]/execution-status/route.ts lines 20–53
  found: Also queries phaseInputs. With zero rows: extInput=undefined, intInput=undefined, extReady=false,
    intReady=false, bothReady=false. The status falls into the SI branch (line 45/47):
    'Waiting for Synthetic Sample Ingestion'. This is actually CORRECT behavior — it accurately reports
    what the user must do. The button will be DISABLED (bothReady=false). The UAT 409 must have been
    triggered by a direct API call or an older session where inputs were partially set.
  implication: The UI button is not clickable in a fresh-seed state. The real UAT gap is:
    (1) a user who ingested SI-external but not UP-internal would get bothReady=false and a disabled button,
    OR a user who has both ready and clicks gets the 409 only if the execute route has a stricter check
    than execution-status. In Phase 3 the checks are EQUIVALENT, so if bothReady=true, execute would pass.
    The PRIMARY UAT scenario is: user never ingested inputs at all → sees disabled button and no feedback
    explaining WHAT to ingest.

- timestamp: 2026-08-18T12:04:00Z
  checked: src/app/phase/[id]/page.tsx lines 79–90
  found: Line 79: `{phaseId <= 2 ? (<OutputsPanel phaseId={phaseId} />) : (<ul>...config.outputs...</ul>)}`
    The conditional hard-codes phaseId <= 2 as the boundary for the live OutputsPanel component.
    Phase 3 (phaseId=3) renders the else branch: a static <ul> of strings from config.outputs.
    The config.outputs for phase 3 (phaseConfig.ts line 28) = ['PDR Readiness Summary',
    'Early DFM/DFA Findings and Risk Register']. These are just labels — no download links, no
    approval status, no artifact IDs.
  implication: Even if the Phase 3 agent runs successfully and writes two rows to phaseOutputs,
    the page NEVER fetches /api/phases/3/outputs. The live OutputsPanel component is never mounted.
    Outputs are permanently invisible from the Phase 3 workspace page.

- timestamp: 2026-08-18T12:05:00Z
  checked: src/app/api/phases/3/outputs/route.ts (entire file)
  found: A fully implemented GET handler exists. Queries phaseOutputs for phaseId=3, joins phaseStates,
    returns {phaseId, phaseState, gateState, aiRecommendation, outputs[]}. Correct implementation.
  implication: The API exists and works. The page.tsx just never calls it for Phase 3.

- timestamp: 2026-08-18T12:06:00Z
  checked: src/shared/constants/phaseConfig.ts Phase 3 intake config
  found: externalIntake: { behavior: 'SI', logicalName: 'Design Rules and Manufacturing Capabilities Package',
    systemRepresented: 'Standards Library, Manufacturing-Capability Repository' }
    internalIntake: { behavior: 'UP', logicalName: 'Preliminary Design Package', format: 'XLSX/PDF/ZIP' }
    The SI handler (siHandler.ts line 99) sets readinessStatus='Synthetic System Input Ready' for external.
    The UP handler (upHandler.ts line 99/131) sets readinessStatus='User Input Ready' for internal.
    These exactly match what execute route.ts lines 15–16 check. Logic is CORRECT — just needs rows.
  implication: No code logic error in the readiness check. It's a MISSING SEED DATA problem for the
    UAT scenario where we want Phase 3 to be immediately executable without manual intake steps.

- timestamp: 2026-08-18T12:07:00Z
  checked: src/server/intake/siHandler.ts lines 83–103 and src/server/intake/upHandler.ts lines 83–132
  found: Both handlers use get-or-create: if phaseInputs row doesn't exist, insert it first. Rows are
    created on first intake action, not at seed time. This is correct for production but requires manual
    steps (SI ingest + UP file upload) before Phase 3 can execute.
  implication: For UAT to jump straight to "Run Phase 3", seed must pre-populate phaseInputs with
    ready statuses, OR the test script must call the ingest endpoints first.

## Resolution

root_cause: |
  THREE COMPOUNDING BUGS for the Phase 3 "Run Phase does nothing / no outputs appear" UAT failure:

  BUG 1 — PRIMARY BLOCKER (Data issue): src/db/seed.ts NEVER inserts any phase_inputs rows.
  After a fresh seed, the phaseInputs table is empty. The execute route at
  src/app/api/phases/3/execute/route.ts lines 11–19 queries phaseInputs for phaseId=3, gets [],
  resolves extReady=false + intReady=false, and returns 409 INPUTS_NOT_READY immediately.
  The execution-status route similarly gets [] and returns bothReady=false — the Run Phase
  button is DISABLED in a fresh-seed state.

  BUG 2 — SECONDARY BLOCKER (Code issue): src/app/phase/[id]/page.tsx line 79 has a hardcoded
  `phaseId <= 2` condition that gates the live OutputsPanel component to phases 0–2 ONLY.
  Phase 3 always renders a static string list from config.outputs. The /api/phases/3/outputs
  route exists and is correctly implemented but is never fetched. Even after a successful
  Phase 3 agent run, outputs are permanently invisible on the Phase 3 workspace page.

  BUG 3 — LATENT (Code issue): The comment on page.tsx line 72-73 says "Route handlers exist
  for phases 0–2; for later phases show config outputs list." This is STALE — routes also exist
  for phases 3 and 4 (confirmed: /api/phases/3/outputs/route.ts, /api/phases/4/outputs/route.ts).
  The condition should be `phaseId <= 4` or ideally route-existence-aware, but the simplest
  correct fix is to remove the condition and always use OutputsPanel (it handles empty gracefully
  with "Pending phase execution" text).

fix: |
  FIX 1 (Seed — data fix, required for UAT immediate executability):
  Add phase_inputs rows for Phase 3 in src/db/seed.ts with readinessStatus already marked ready.
  Since Phase 3 UAT should be self-contained, seed both inputs as ready:
    - phaseId=3, inputRole='external', intakeBehavior='SI', readinessStatus='Synthetic System Input Ready'
    - phaseId=3, inputRole='internal', intakeBehavior='UP', readinessStatus='User Input Ready'
  Use onConflictDoNothing() for idempotency. This unblocks the execute route AND enables the
  Run Phase button (bothReady will be true from execution-status).

  FIX 2 (Page — code fix, required for outputs to appear):
  In src/app/phase/[id]/page.tsx line 79, change the condition from `phaseId <= 2` to
  cover phases 3 and 4 as well (since output routes exist for 0–4). Simplest fix:
    Change: `{phaseId <= 2 ? (<OutputsPanel phaseId={phaseId} />)`
    To:     `{phaseId <= 4 ? (<OutputsPanel phaseId={phaseId} />)`
  This causes Phase 3 to mount the live OutputsPanel which polls /api/phases/3/outputs
  every 3 seconds (refreshInterval) and will display agent-written outputs as they appear.

  These two fixes together resolve the UAT failure completely:
  - After FIX 1: button is enabled, clicking POSTs successfully, 202 accepted, agent runs.
  - After FIX 2: OutputsPanel polls, finds the two written rows, renders them with Download links.

verification: pending human UAT
files_changed:
  - src/db/seed.ts  (add phaseInputs inserts for phase 3 with ready statuses)
  - src/app/phase/[id]/page.tsx  (change phaseId <= 2 to phaseId <= 4 for OutputsPanel)
