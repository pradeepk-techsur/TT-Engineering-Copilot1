---

## F07: Token Optimization and Context Management

**Requirements:** TO-01 to TO-04 | **Priority:** P0

**Description:** The system is designed to minimize LLM token consumption at every invocation by using indexed reference document caching, compact upstream phase summaries, and targeted context assembly. Deterministic calculations run outside the LLM entirely (see F05). This ensures the system remains practical across 10 phases without context-window overload and without repeatedly transmitting large documents.

---

### Terminology

- **Reference Index:** A persistent, pre-computed index of reference document content (standards, checklists, POC rules), built at system initialization and cached for all subsequent agent invocations.
- **Relevant Passage Retrieval:** The process of querying the reference index with a phase-specific query to extract only the applicable sections, clauses, or rows — not the full document.
- **Context Package:** The structured set of information assembled for each agent invocation: active inputs, upstream summaries, open actions, selected checklist items, and selected standard passages.
- **Compact Phase Summary:** See F04 §CompactPhaseSummary Object. A condensed structured record of an approved phase's key outputs and decisions; used in place of the full phase documents.
- **Token Budget:** The target maximum token count for any single agent context invocation. Maintained to avoid context-window overload and to control per-invocation LLM cost.

---

### Sub-features

- Reference document indexing at system initialization (one-time, cached)
- Relevant passage retrieval per agent invocation (query-based, not full-document transmission)
- Context package assembly: active inputs + upstream summaries + open actions + selected items
- Compact approved-phase summaries as upstream context (not full prior-phase documents)
- Output length limits set in prompt construction
- Early stop on output schema completion
- Deterministic checks outside LLM (all five checks in F05)

---

### Process: Reference Document Indexing (System Initialization)

1. At system startup, load all reference documents from the reference document store:
   - EVINV-POC-STD-001 (synthetic standard)
   - Power Supplies Technical Review Checklists — Prelim (Kickoff, SLR, Schematic Review, PCB Layout tabs)
   - Any additional POC-specific rules or policies
2. For each document, extract text by section/clause/row.
3. Build a vector index (or keyword index) over the extracted passages.
4. Cache the index in the reference index store; mark index as `initialized`.
5. Do not reload or re-transmit full documents to agent invocations; query index instead.
6. Log index build event with document IDs and timestamps in audit history.

---

### Process: Context Package Assembly (Per Agent Invocation)

For every agent call, assemble a context package as follows:

1. **Active phase inputs:** Include only the active version summaries (not full document content) of the two logical inputs for the current phase. Provide structured field extracts (e.g., requirement rows, BOM rows) rather than raw document text.
2. **Upstream compact summaries:** For each completed prior phase (phases 0 through n−1), include the `CompactPhaseSummary` from ProjectState. Do not include full prior-phase documents or full prior-phase outputs.
3. **Open actions:** Include all actions with `status != VerifiedClosed` that affect the current phase, drawn from `ProjectState.actions[]`.
4. **Selected checklist items:** For phases with a mapped technical review (0, 1, 3, 4), query the reference index for the applicable checklist tab; retrieve only the most relevant items for the current phase focus (not the entire checklist).
5. **Selected standard passages:** Query the reference index with the current phase's engineering focus (e.g., "HV clearance", "component derating"); retrieve the most relevant clauses from EVINV-POC-STD-001.
6. **Output schema:** Include the output schema for the phase's expected outputs; set a maximum token budget for the output section.
7. **No background narrative repetition:** Do not re-include project background, product description, or ENG 001 overview in every prompt; these are provided once at initialization or referenced by ID.

---

### Compact Phase Summary Schema (see also F04)

| Field | Token Budget Target |
|---|---|
| `phase_id` | negligible |
| `gate_outcome` | negligible |
| `key_decisions` | ≤ 3 bullet points, ≤ 50 tokens each |
| `key_outputs` | ≤ 2 output references, ≤ 30 tokens each |
| `open_actions` | List of action IDs only; detail fetched on demand |
| `findings_summary` | ≤ 1 paragraph, ≤ 100 tokens |
| **Total per phase summary** | **≤ 400 tokens** |

With 10 phases, all upstream summaries ≤ 4,000 tokens total — well within any context window.

---

### Context Selection Rules

| Context Component | Rule | Rationale |
|---|---|---|
| Prior phase documents | NEVER transmitted | Full documents would exceed context budget; use compact summaries |
| Active input documents | Structured field extracts only (not raw text) | Reduces tokens while preserving engineering facts |
| Reference documents | Passage retrieval only (never full document) | Index built once; only relevant sections retrieved |
| Checklist items | Top N most relevant items for current phase focus | Entire checklist would violate artifact-count intent |
| Deterministic check results | Include result record (structured) | Small and precise; no narrative required |
| Background narrative | Include once at project initialization; reference by project_id thereafter | Avoids repetition across invocations |
| Output format schema | Always included in context | Required for schema-constrained generation |

---

### Prompt Construction Rules

- Use compact structured fields (JSON or markdown tables) rather than prose repetition.
- Reference artifacts by ID rather than repeating their full content.
- Set explicit output length limits: `max_tokens = [phase-specific budget]` in each prompt.
- Stop generation once the output schema is complete (use stop sequences aligned with output schema end markers).
- Avoid repeating the product description, project ID, or ENG 001 overview in every invocation.
- Do not ask the LLM to compute values that deterministic tools should compute (clearance, Cpk, derating, traceability completeness).

---

### Inputs

- `phase_id` (integer 0–9): the phase for which context is being assembled
- Reference index (cached, pre-built at startup)
- `ProjectState` (read access): upstream summaries, active inputs, open actions, check results

---

### Outputs

- Context package (structured JSON): assembled and passed to phase agent
- Context package token count: logged for monitoring
- Reference index: cached artifact (not transmitted; queried per invocation)

---

### Validation Rules

- Reference index must be initialized before any phase agent is invoked; if not, reject with `REFERENCE_INDEX_NOT_INITIALIZED`.
- Full prior-phase documents must not appear in any agent context package; enforced by context assembly layer.
- Full reference documents (EVINV-POC-STD-001, checklist) must not be transmitted to agent; only retrieved passages may appear.
- Context package must include `token_count` field; if `token_count > context_token_budget` (configurable, default 8,000 tokens for this POC), context assembly must trim least-relevant passages before invoking agent.
- Deterministic check computations (clearance, derating, Cpk, testability, traceability) must not be delegated to LLM inference; they must run as tool calls.

---

### Error States

| Scenario | HTTP Status | Error Code | Message |
|---|---|---|---|
| Reference index not initialized | 503 | `REFERENCE_INDEX_NOT_INITIALIZED` | "Reference index has not been built. Run system initialization before invoking agents." |
| Context package exceeds token budget | 422 | `CONTEXT_TOKEN_BUDGET_EXCEEDED` | "Assembled context exceeds token budget of {budget}. Trimming applied; review context selection rules." |
| Full document included in context | 500 | `FULL_DOC_IN_CONTEXT` | "Internal error: full reference document transmitted to agent. Context assembly rules violated." |
| Deterministic computation delegated to LLM | 500 | `DETERMINISTIC_DELEGATION_VIOLATION` | "Deterministic check computation must not be delegated to LLM. Use tool call instead." |

---

### API Surface (this feature)

See `Y1-api.md` §Context for full schemas. Summary:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/system/initialize-index` | Build and cache the reference document index |
| `GET` | `/api/system/index-status` | Check reference index initialization status |
| `POST` | `/api/context/assemble` | Assemble context package for a phase invocation (returns package + token count) |
| `GET` | `/api/context/phase/{id}/summaries` | Get compact phase summaries for all prior phases |

---

### Schema Surface (this feature)

Uses `ProjectState.phases[n].compactPhaseSummary`, reference index store (external cache, not in ProjectState) — see `Y0-schema.md` §CompactPhaseSummary.

---

*FRD-TTCopilot-v1.0 | F07 | Synthetic POC Data Only*
