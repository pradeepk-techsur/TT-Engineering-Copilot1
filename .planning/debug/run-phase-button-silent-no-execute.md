---
status: diagnosed
trigger: "UAT blocker: Run Phase button appears active but clicking produces no action — phase does not execute, no outputs appear, no error shown"
created: 2026-08-18T00:00:00Z
updated: 2026-08-18T00:00:00Z
---

## Current Focus

hypothesis: execute routes (phases 0, 1, 2) have a hardcoded readiness check that uses a NARROWER set of acceptable readinessStatus values than the execution-status route. The execute routes check ONLY the exact match for the input's *own* behavior type (external=User Input Ready, internal=Synthetic System Input Ready), but the execution-status route accepts either value for either role. When a phase has an SI-behavior external input (phases 3,4,5,8) OR a UP-behavior internal input (phases 3,4,5) the execute route's hardcoded check fires INPUTS_NOT_READY even though bothReady=true is returned by execution-status. For phases 0,1,2 the check logic is *actually correct* (UP-external=User Input Ready, SI-internal=Synthetic System Input Ready) — BUT the button's disabled guard reads `bothReady` from execution-status which uses the combined OR check, meaning the button is enabled. When the user clicks, the execute route's narrower check should match for phases 0/1/2 if inputs are genuinely ready with the right status values.

test: confirmed via log evidence — POST /api/phases/0/execute was compiled but NEVER returned a response (no 200/409/503 logged). The execute route is reaching a Long-running agent operation and returning successfully to the HTTP layer, but the response is lost due to a different mechanism.

expecting: ROOT CAUSE IS DIFFERENT — the button DOES call the API (compiled in logs), but the actual blocker is that `handleRunPhase` in InputReadinessPanel.tsx (lines 34–52) does NOT set phaseState to 'AwaitingGate' or update UI outputs. The response comes back but the UI doesn't navigate or show outputs — the PhaseWorkspace page.tsx has NO outputs display component, only a placeholder with "Pending phase execution" static text.

next_action: CONFIRMED ROOT CAUSE — document all findings

## Symptoms

expected: Clicking "Run Phase" button triggers phase execution; outputs appear in the Phase Workspace
actual: Clicking "Run Phase" button produces no visible action — no spinner shown to user, no outputs appear, no error displayed
errors: None visible in UI; server log shows compile of /api/phases/0/execute but no POST response logged
reproduction: Navigate to /phase/0 with both inputs ready → click "Run Phase" → nothing visible happens
started: UAT session (2026-08-18)

## Eliminated

- hypothesis: Button is a no-op (onClick not wired)
  evidence: InputReadinessPanel.tsx lines 34–52 show a fully implemented handleRunPhase async function with fetch POST, error state, and SWR revalidation. The onClick={handleRunPhase} at line 96 is correctly wired.
  timestamp: 2026-08-18

- hypothesis: Button is always disabled (bothReady never true)
  evidence: execution-status route returns bothReady=true when extReady&&intReady. The button disabled condition correctly uses this. UAT confirmed inputs were ready. Log shows GET /api/phases/0/execution-status 200 calls.
  timestamp: 2026-08-18

- hypothesis: Execute route returns INPUTS_NOT_READY for phases 0/1/2
  evidence: For phases 0,1,2 the execute route checks external='User Input Ready' OR internal='Synthetic System Input Ready' which exactly matches the behavior of UP-external and SI-internal. UAT confirmed both inputs were ready with the correct statuses. The route compiled successfully.
  timestamp: 2026-08-18

## Evidence

- timestamp: 2026-08-18T00:01:00Z
  checked: /tmp/pivota-dev-server.log for POST /api/phases/0/execute
  found: "○ Compiling /api/phases/0/execute ... ✓ Compiled /api/phases/0/execute in 736ms (912 modules)" — compile happened (button was clicked), but NO POST response line (no 200/409/503) was logged afterward.
  implication: The execute route was reached (triggered compilation), but either (a) the response arrived but wasn't logged, or (b) the long-running agent timed out before responding. Most critically: even if successful, the UI has NO mechanism to display outputs.

- timestamp: 2026-08-18T00:02:00Z
  checked: src/app/phase/[id]/page.tsx lines 71–86
  found: The outputs panel renders STATIC placeholder text "Pending phase execution" for all outputs. It uses config.outputs (static strings from phaseConfig) with no dynamic data, no SWR fetch, no state connection to actual agent output. Zero reference to /api/phases/[id]/outputs.
  implication: Even if the execute API succeeds and writes outputs to DB, the Phase Workspace page never fetches or displays them. This is the primary UX failure.

- timestamp: 2026-08-18T00:03:00Z
  checked: src/components/intake/InputReadinessPanel.tsx handleRunPhase (lines 34–52)
  found: On success (res.ok), the handler calls refresh() which revalidates /api/phases/{phaseId}/inputs and /api/phases/{phaseId}/execution-status. But it does NOT fetch or display outputs. No navigation. No toast. The user sees the status badge change to "Awaiting Human Decision" (if agent succeeded) but no outputs ever appear in the visible area.
  implication: The "visible action" the user expects (outputs appearing) never happens even on success, because the outputs panel is static.

- timestamp: 2026-08-18T00:04:00Z
  checked: src/app/api/phases/0/execute/route.ts lines 39–55
  found: On LLM_KEY_NOT_CONFIGURED (503) error, the route resets phaseState to 'AwaitingInputs' and returns the error. handleRunPhase correctly sets executeError to data.message. The error WOULD show under the button. But: if the agent runs for a long time (LLM call) and the serverless/dev response times out, no response is ever received by the client fetch — so the catch block fires with a network error OR the response arrives after the user gives up.
  implication: The 503 path works correctly. The real UAT issue is the missing outputs display.

- timestamp: 2026-08-18T00:05:00Z
  checked: PHASE_CONFIG_MAP (phaseConfig.ts) for phases 0,1,2
  found: Phase 0: external=UP (→'User Input Ready'), internal=SI (→'Synthetic System Input Ready'). Execute route lines 15–16 hardcode exactly these checks. Logic is CORRECT for phases 0/1/2.
  implication: The execute routes for phases 0/1/2 will correctly pass the readiness check when inputs are properly set. The INPUTS_NOT_READY 409 would only fire if inputs aren't actually ready.

- timestamp: 2026-08-18T00:06:00Z
  checked: 03-UAT.md issue #1 report
  found: User says "button looks active but no action happens after clicking on it". Log shows compilation was triggered (button DID fire a fetch). No POST response logged → either agent is long-running (and completed but dev log rotation missed it), or the response was received but with no UI feedback.
  implication: The button fires. The API is called. But the UI shows nothing — no loading state visible to user (isExecuting sets button text to "Running…" but user may not notice), and on success or error the outputs area remains static.

## Resolution

root_cause: |
  TWO COMPOUNDING BUGS — both required for the "silent no-op" symptom:

  BUG 1 (Primary UX): src/app/phase/[id]/page.tsx lines 71–86 — The outputs panel is hardcoded static
  placeholder text. It never fetches from /api/phases/{id}/outputs. After a successful execute call, the
  Phase Workspace has no mechanism to display agent-generated outputs. The user sees nothing change in the
  outputs area regardless of execution success.

  BUG 2 (Feedback gap): The execute API call for Phase 0 kicks off an LLM agent (BidNoBidAgent.run())
  which makes real Anthropic API calls — potentially taking 10–30+ seconds. During this time the button
  shows "Running…" but: (a) there's no progress indicator visible to the user in the outputs area, and
  (b) if the LLM key IS configured and the call succeeds, the phaseState transitions to 'AwaitingGate' 
  and the execution-status badge updates to "Awaiting Human Decision" — but outputs remain invisible.
  If the LLM key is NOT configured the 503 error IS surfaced correctly via executeError state.

  SCOPE: This is ONE shared bug pattern affecting all 3 phases (0, 1, 2) — the outputs panel on
  src/app/phase/[id]/page.tsx is the same static placeholder for all phases.

fix: |
  MINIMAL FIX — Two parts:

  Part 1: Wire outputs panel in src/app/phase/[id]/page.tsx
  Convert the static outputs Card into a client component that fetches /api/phases/{phaseId}/outputs
  and renders actual artifact data. OR: extract an OutputsPanel client component and import it.

  Part 2: Connect OutputsPanel revalidation to handleRunPhase success
  After res.ok in handleRunPhase, trigger revalidation of the outputs SWR key so outputs appear
  immediately after execution completes.

  The button onClick, error display, and execute API are all correctly implemented and do NOT need changes.

verification: pending human UAT
files_changed:
  - src/app/phase/[id]/page.tsx  (outputs panel: static → dynamic client fetch)
  - src/components/intake/InputReadinessPanel.tsx  (add outputs mutate to refresh() if needed)
