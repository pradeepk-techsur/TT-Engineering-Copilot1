## 5. Security Architecture

### 5.1 Authentication (POC Mode)

**No SSO or production RBAC in POC v1.** Authentication is intentionally omitted to simplify the demonstration scope.

- The `X-Reviewer-Role` HTTP header carries the human reviewer role (e.g., `"Design Engineer"`, `"Manufacturing Engineer"`, `"Quality Manager"`)
- This header is required for all write operations that represent human decisions (gate decisions, action approvals, action closures, phase start/cancel)
- No session tokens, JWTs, or cookies are used in POC
- The server treats the `X-Reviewer-Role` value as a role label string — not an authenticated identity
- **AI actor rejection:** Any POST to a gate decision endpoint checks that `X-Reviewer-Role` is present, non-empty, and not in the `AI_ACTOR_IDENTIFIERS` blocklist (`["AI","LLM","Claude","system","agent","orchestrator"]`). Requests with these values return `403 GATE_AI_PROHIBITED`.

**v2 scope:** Full Entra ID SSO with RBAC; reviewer roles mapped to Entra ID groups; JWT verification on all write endpoints.

---

### 5.2 Human-Gate Authority Enforcement

This is the most critical security invariant in the system. It is enforced at **three independent layers**:

| Layer | Mechanism |
|---|---|
| **API layer** | `POST /api/gates/{id}/decide` validates `X-Reviewer-Role` header; rejects AI actor values; returns `403 GATE_AI_PROHIBITED` |
| **Orchestrator layer** | `stateMachine.ts` gate state transitions (`AwaitingGate → GatePassed/GateConditional/GateFailed`) only accept calls originating from the gate decision endpoint handler; no internal auto-advance code path exists |
| **Database layer** | `gate_decisions` table has `is_final BOOLEAN NOT NULL DEFAULT TRUE`; no UPDATE or DELETE is permitted by the application role; gate state can only advance via explicit INSERT into `gate_decisions` |

**Silent gate approval prohibition:** No code path in the orchestrator, agent wrapper, or any tool function may call the gate decision endpoint or insert a `gate_decisions` record. Only the `POST /api/gates/{id}/decide` handler inserts gate decisions, and only after `X-Reviewer-Role` validation passes.

---

### 5.3 Audit Immutability

The `audit_history` table is append-only. Protection is enforced at two layers:

| Layer | Mechanism |
|---|---|
| **Application layer** | No UPDATE or DELETE operations are issued against `audit_history` anywhere in the service layer; only `INSERT` operations via `auditService.append()` |
| **Database layer** | `REVOKE UPDATE, DELETE ON audit_history FROM application_role;` executed at DB setup |

The AV-09 Audit View is a read-only display. No write controls appear on this view. The UI renders "Immutable Record — Append Only" label at the top.

---

### 5.4 Single Active Version Enforcement

The `input_versions` table enforces the constraint that exactly one version per logical input is active at any time via a partial unique index:

```sql
CREATE UNIQUE INDEX idx_input_versions_single_active
  ON input_versions(input_id)
  WHERE active = TRUE;
```

The DB will reject any INSERT or UPDATE that would result in two rows with `active = TRUE` for the same `input_id`. The application layer also validates this before issuing the write.

---

### 5.5 Artifact Disclaimer Enforcement

The `artifact_registry` table enforces the mandatory disclaimer at the database level:

```sql
disclaimer_present BOOLEAN NOT NULL DEFAULT TRUE CHECK (disclaimer_present = TRUE)
```

A `CHECK` constraint rejects any INSERT where `disclaimer_present = FALSE`. The artifact generation wrapper also verifies disclaimer presence before calling the register endpoint.

---

### 5.6 Synthetic Data Indicator Enforcement

```sql
synthetic_data_indicator BOOLEAN NOT NULL DEFAULT TRUE CHECK (synthetic_data_indicator = TRUE)
```

The `project_state` table's `CHECK` constraint prevents any write of `synthetic_data_indicator = FALSE`. This ensures the POC's synthetic data status cannot be accidentally cleared.

---

### 5.7 Prohibited Label Detection

The intake handler and artifact generation wrapper scan all generated text (UI labels, API responses, generated artifact content) for prohibited connectivity claims:

```typescript
const PROHIBITED_LABELS = [
  /connected to \w+/i,
  /retrieved from \w+/i,
  /live \w+ data/i,
  /real-time \w+/i,
  /replacement input/i,
];
```

If a prohibited label is detected in generated content, the response is rejected with `500 PROHIBITED_LABEL_DETECTED` before being returned to the client.

---

### 5.8 No Live System Credentials

**Requirement (non-negotiable for POC):** No live API keys, tokens, or credentials for any enterprise system (Cora, Salesforce, PLM, ERP, MES, quality system, obsolescence databases) may exist in the codebase or environment configuration.

The `.env` file contains only:

```
ANTHROPIC_API_KEY=sk-ant-...          # Only external key permitted
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STORAGE_PATH=/var/tt-copilot/artifacts
POC_CONTEXT_TOKEN_BUDGET=8000
```

All 23 simulated connectors serve preloaded synthetic sample files from local storage. No outbound HTTP calls to enterprise systems are made.

---

### 5.9 Input Validation and Injection Prevention

- All file uploads are validated for MIME type and parseability before processing
- PostgreSQL queries use parameterized statements exclusively (via the `pg` driver or ORM); no string concatenation in SQL
- User-supplied text fields (comments, descriptions) are stored as plain text; not interpreted as HTML or executed as code
- File storage uses UUID-based paths (`/artifacts/{artifact_id}/{version}/{filename}`); no user-supplied path segments in storage URIs
- `storage_uri` values are only served from the known `STORAGE_PATH` prefix; path traversal prevented by path normalization check

---

### 5.10 Blocking Action Gate Enforcement

When a human selects "Pass" in the Gate Review Workspace:

1. **Client-side:** "Pass" radio button is disabled if the API reported `blocking_actions_open: true`. A message is displayed: "Blocking actions must be closed before recording a Pass outcome."
2. **Server-side (API layer):** `POST /api/gates/{id}/decide` queries `actions` table for `blocking = TRUE AND status != 'VerifiedClosed'` for the gate phase; if any exist, returns `409 BLOCKING_ACTIONS_OPEN`.

Both layers must independently reject the Pass decision when blocking actions are open.

---

*TechArch-TTCopilot-v1.0 | §04-Security | Synthetic POC Data Only*
