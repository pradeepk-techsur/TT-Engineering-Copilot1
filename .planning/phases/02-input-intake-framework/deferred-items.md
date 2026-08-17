# Deferred Items — Phase 02-input-intake-framework

## Pre-existing TypeScript errors from 02-01 (out of scope for 02-02)

These errors existed in the 02-01 commit and are not caused by 02-02 changes:

1. `src/server/intake/types.ts` — missing `ValidationIssue` export used by `fileValidator.ts`
2. `src/server/intake/types.ts` — `ValidationResult` missing `warnings` field used by `fileValidator.ts`
3. `src/server/intake/types.ts` — `IntakeEvent` missing snake_case fields (`event_id`, `phase_id`, `event_type`, `logical_input`, `user_action`, `operator_id`, `source_artifact_id`, `normalized_artifact_id`) used by `intakeAudit.ts` and `siHandler.ts`
4. `tests/intake.test.ts` — uses `warnings` field not in `ValidationResult`

**Resolution:** These should be fixed in a gap-closure plan for Phase 02, Plan 01 — the types need to match the FRD 13-field IntakeEvent structure.
