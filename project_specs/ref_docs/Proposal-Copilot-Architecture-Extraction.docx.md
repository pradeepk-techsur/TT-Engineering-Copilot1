<!-- Text extracted by Pivota from Proposal-Copilot-Architecture-Extraction.docx (Word document). The original file is alongside this one. -->

# Proposal-Copilot-Architecture-Extraction.docx

Proposal Copilot → Manufacturing & Digital Engineering Copilot

Architecture extraction for Pivota. Distilled from the Proposal Copilot codebase (twin-agentic) and mapped onto TT Electronics' Product Lifecycle Process (ENG 001 v4.1) and the TechSur GenAI proposal. Purpose: reuse the proven skeleton, not re-derive it.

The two products are structurally the same shape:

A multi-agent, gated, human-in-the-loop pipeline. Agents run in a fixed dependency order; each produces versioned artifacts; humans review at gates and Approve / Revise / Reject; nothing advances without a human decision.

Proposal Copilot runs RFP/RFI response through color-team gates (Go/No-Go → Gate 1 → Gate 2 → Gate 3 → Final QA → Red/White-Glove). The Engineering Copilot runs a product through Gates G0–G9. The mapping below is nearly 1:1, which is why this port is low-risk.

0. The domain mapping (read this first)

Case (one RFP/RFI response) | Project (one product lifecycle, G0–G9) | Cora is the system of record instead of the local case folder
solicitation_type = RFP | RFI | project_type = NPI A/B/C/D | Make-to-Print | NTI | CI | Drives which spine/agents run — see §3.2
Color-team stages + gates | Phases 0–9 + Gates G0–G9 | ENG 001 §2.1
Gate decision: Approve / Revise / Reject | Gate outcome: Pass / Conditional Pass / Fail | Conditional Pass is a NEW third state — see §6 lesson
solicitation_cache (facts written once by Compliance) | Shared design/requirements cache (facts written once by a Requirements/Extraction agent) | Same silent-propagation risk (§5)
Artifacts (A1_Compliance_Matrix, Integrated_Draft, …) | Gate packs / checklists (PDR pack, CDR pack, DFM audit, MRL/PPAP pack) | TechSur proposal Appendix A IS this dependency graph
Per-agent skill file (skills/*.md) | Per-agent skill file + digitized gate exit-criteria checklist | Externalized config (§4.1)
KB layering (style guides, boilerplate, past perf) | Standards library (AS9100, IPC, MIL-STD, ISO 2768) + TT DFM rules + CAPA/yield history | Citation-critical → stronger RAG (§7)
Excel/docx export, White Glove submission doc | Write-back to Cora (checklists, RAIL, approvals) + gate-review pack | Bidirectional, governed
Copilot-gated agents (requires_copilot) | Connector-gated agents (need CAD/PLM/ERP/MES access) | Skip cleanly when connector absent (§4.5)
Web frontend / PipelineTab | Web Gate Cockpit (+ Cora side-panel, CAD plugin, Teams, Outlook as channels) | Same "one platform, many surfaces" idea

1. Architectural patterns (the reusable skeleton)

1.1 Orchestrator as a gated state machine

flows/orchestrator.py is a _BaseOrchestrator that walks stages in fixed order and pauses at human gates. Two entry modes:

run() — start-to-finish, driven by _run_* / _run_gate* methods.

_dispatch_stage(stage) — resume into any stage by name (the state machine is addressable, so a crashed/paused run restarts at the right place).

Port as-is. Replace the RFP _run_* methods with _run_phase0 … _run_phase9 and the gates with _run_gate0 … _run_gate9. The revise/reject/approve branch structure is identical.

1.2 Two structural patterns cause ~90% of all failure modes

From the codebase's own ARCHITECTURE.md — internalize these before building:

The shared cache — one blob, written once, read by many. A gap in it propagates silently to every consumer.

The artifact dependency chain — agents read upstream outputs; a stale/wrong upstream artifact corrupts everything downstream.

Everything in §5 (lessons) traces back to these two.

1.3 Agent = narrow role + external skill + robust LLM wrapper

agents/base.py::BaseAgent is the single most reusable file. Every agent:

Declares skill_name → loads instructions/model/effort from skills/<name>.md.

Builds a prompt from state + upstream artifacts + KB.

Calls _invoke() → the hardened streaming/continuation/retry core.

Writes versioned artifacts and returns text.

The _invoke → _generate → _stream_with_continuation stack handles, transparently: prompt caching, per-model input-window gating, truncation continuation, network retries (incl. 429/529 overload), tool-use round trips, empty-output guard, and cancellation. This wrapper is gold — port it wholesale. It is the difference between "demo" and "survives a real 40-minute generation."

1.4 Per-run context cache (kill redundant token spend)

tools/pipeline_context.py::PipelineContext is one in-memory cache per run. The same solicitation (~75k tokens) is read 6+ times, KB 8+ times — the cache eliminates ~60–70% of input tokens and also serves compressed artifact summaries to agents that only need the gist. For engineering, the big shared inputs are the requirements spec, the standards clauses, and the extracted CAD/BOM feature graph — cache those once per run.

1.5 State as the single source of truth

tools/state.py::CaseState holds stage, artifact registry (versioned refs), gate iteration counts, the shared cache, human notes, and run-shaping flags (target_artifacts, skip_artifacts). It is now thread-safe (per-case RLock + atomic tmp + os.replace save) — required the moment any work runs in parallel (§3.4).

2. Workflows (control flow worth copying)

2.1 The gate loop (the human-in-the-loop primitive)

flows/human_gate.py::run_gate(state, gate_name, artifact_keys, description) → GateDecision. It shows the reviewer the artifacts, collects Approve/Revise/Reject, records the decision to an audit folder, and returns notes for upstream re-run. The orchestrator's gate methods then branch:

Approve → advance.

Revise → capture notes into sme_answers, invalidate downstream cached artifacts, re-run from the relevant agent, re-enter the gate (bounded by MAX_REVISIONS).

Reject → close (no-bid).

For Engineering: this is exactly the Cockpit's "review the AI-drafted pack, sign or send back" loop. Add Conditional Pass as a fourth outcome (proceed + tracked actions in the RAIL) — see §6.

2.2 Gate "revise" invalidation + re-run rules

Because of the shared cache, you cannot fix a downstream artifact by re-running only that agent — it re-reads the same stale cache. Gate revise already does the right thing: invalidate downstream, regenerate from the gate. Design this in from day one; it is the supported way to re-flow part of the pipeline.

2.3 Idempotent resume

skip_completed + _artifacts_already_produced() let an interrupted run restart and no-op through work already on disk instead of regenerating it. Gate "revise" turns skipping OFF from that gate forward (inputs changed → must regenerate). For months-long engineering projects this matters far more than for a day-long proposal.

2.4 Targeted / partial runs

state.target_artifacts = "run the dependency prefix and stop once these exist." Maps cleanly to "generate the Gate 4 CDR pack and stop" without a hand-maintained dependency graph — the ordered pipeline + a halt check does it.

2.5 Plan-driven spine forking (the most important pattern for you)

flows/rfi_plan.py::build_plan() decides — before any agent runs — which steps are enabled for this request, expands hard dependencies, and produces a pruned canonical subset the executor follows. Proposal Copilot uses it to run a different agent set for RFI vs RFP.

This is precisely how you tailor the pipeline to Project Type & Category. ENG 001 defines NPI A/B/C/D, Make-to-Print, NTI (with its own TRL-gated variant flow), CI, and Cat 1/2/3 with per-gate criteria marked Mandatory/Optional/Informational. Build a build_plan(project_type, category) that emits the enabled gates/agents/criteria — a Make-to-Print project skips conceptual design agents; an NTI project runs the TRL-check variant; Cat 3 downgrades "Mandatory" checks to "Informational." One executor, many tailored spines. Do not build a separate app per project type (see §5.6).

2.6 Parallel lanes on one shared case

The pricing lane forks a long sub-pipeline onto a daemon thread at an early gate and joins later, so a slow-but-independent workstream doesn't block the main lane — while staying in one case for collaboration. Engineering analog: run the long DFM/standards audit or the historical-yield predictor in parallel with gate-pack drafting. Requires the thread-safe state (§1.5) and lane-tagged events so the UI doesn't garble.

3. Reusable components (port these modules ~directly)

Hardened LLM call core | agents/base.py (_invoke/_generate/_stream_with_continuation) | Retries, truncation, tool-use, cancel, per-model gating — domain-agnostic
Skill loader (config-as-markdown) | agents/skill_loader.py | Per-agent model/effort/max_tokens + prompt-cache blocks, hot-editable
Per-run content cache | tools/pipeline_context.py | Token savings + artifact summaries + invalidation
Thread-safe versioned state | tools/state.py | Stage machine, artifact registry, atomic save, RLock
Human gate primitive | flows/human_gate.py | Approve/Revise/Reject + recorded decision
Orchestrator skeleton | flows/orchestrator.py | Stage machine + _dispatch_stage resume
Plan builder | flows/rfi_plan.py | Project-type/category tailoring (§2.5)
Web runner + SSE streaming | backend/pipeline_runner.py | Event stream, pause/resume/cancel, lane tagging
Tool-use dispatch | tools/agent_tools.py | Where deterministic engineering checks (DRC, tolerance, BOM lookups) plug in as tools
Connector-gated agent pattern | requires_copilot flag + skip logic | Becomes CAD/PLM/ERP connector gating
Doc/Excel builders | tools/docx_builder.py, volume_ii.py, workbook_ops.py | Gate-pack and checklist generation

4. Best practices baked into the codebase

Externalize all agent instructions + config to skill files. Model, thinking, effort, and max_tokens live in skills/*.md frontmatter — tune per agent without touching Python or redeploying code paths. Store gate exit-criteria checklists the same way (data, not code).

One shared cache, written once, read many — but treat the writer (Compliance / Requirements-Extraction) as the #1 quality gate and reconcile against authoritative sources (§5.1).

Cache the big shared inputs per run (PipelineContext) instead of re-sending them.

Wrap every LLM call in the retry/truncation/empty-output/cancel machinery; set the SDK client to a long timeout + max_retries=0 and own the retry loop yourself (§5.3).

Graceful degradation: a missing KB file / absent connector → the agent flags the gap in its output rather than crashing the run.

Version every artifact and keep a decision/audit record at every gate (maps directly to the proposal's NIST-AI-RMF + immutable-audit-log requirement).

Right-size `effort` per agent. effort:max on heavy agents caused kills/hangs; effort is the dominant driver of run time.

Keep one case/project as the source of truth. Collaboration comes from shared state, not forked pipelines.

Thread-safe state before any parallelism — RLock + atomic write, or you get torn reads and lost registrations.

5. Lessons learned (hard-won — these are the expensive ones)

5.1 Silent cache-gap propagation (the "CLIN bug")

Compliance under-extracted the CLIN list (5 of 7); RFP Pricing and Technical both inherited the same gap silently, and it only surfaced at a late cross-check. Mitigation that shipped: treat the authoritative source as truth (SF-1449 §B over the PWS) and add verification agents (Compliance Verification, Gov Evaluation) that compare artifacts against the raw source late in the flow.

Engineering translation: a dropped requirement, a missing BOM line, or a mis-read GD&T callout will propagate to every gate pack silently. Build the DFM/Standards audit and a requirements-traceability check as cross-verifiers against the authoritative CAD/BOM/spec, not just as generators.

5.2 Re-run discipline

Fixing a downstream pack by re-running one agent re-reads stale inputs. Always re-run from the cache writer forward. Bake invalidation into gate-revise so humans can't get this wrong.

5.3 The token/stall pattern

Heavy agent + too-small max_tokens → output truncates → continuation loop re-sends the full input each turn → looks like a 30-minute hang. Also, the SDK's default ~10-min timeout was killing long generations and its built-in retries stacked on top of the app's retries. Fix: timeout=1800s, max_retries=0 on the client; own the retry loop; raise max_tokens on output-heavy agents. Engineering packs (CDR, PPAP) are long — size for it.

5.4 Don't maintain two execution paths

The web runner's patched_run_agent is a hand-maintained mirror of the orchestrator's _run_agent; a signature change to one silently broke the other (a kwarg crashed every web run until patched). Lesson: prefer a single execution path; if you must mirror, test the real (web) path, not just the CLI. For Pivota, aim for one runner.

5.5 Structural heuristics break on real documents

Page-limit enforcement detected front-matter by headings — until running headers/repeated titles broke heading detection; the fix was to detect by body prose. Lesson: real engineering drawings/specs/BOMs are messier than samples; don't over-trust layout heuristics — validate on authentic TT documents early.

5.6 A separate pipeline hurts collaboration

A pricing-only pipeline was fully built, then discarded because splitting work across two cases broke collaboration. The parallel-lane-on-one-case design replaced it. Lesson for the multi-project-type Copilot: tailor via the plan builder (§2.5), not via forked apps.

5.7 Single-buffer UI garble under concurrency

Two lanes streaming into one text pane garbled it. Fix: tag events by lane and suppress the secondary stream. Relevant the moment the Cockpit shows more than one agent at once.

5.8 Environment/state hygiene

DB WAL/SHM sidecars, running-backend dirtying the tree, etc. — small things that bite CI and commits. Decide state-file tracking policy up front.

6. What to design fresh for the engineering domain (don't just copy)

Binary/structured inputs need a feature-extraction front end. Proposal Copilot is text-centric (_read_intake). CAD (SolidWorks/NX/Creo), BOM, GD&T, netlists require a parse→feature-graph stage (the proposal's Layer 3) before agents can reason. This is net-new.

Prefer deterministic tools over LLM generation for checkable facts. Tolerance stack-ups, DRC, BOM obsolescence lookups (SiliconExpert/IHS), Cpk math — run these as tools (via the agent_tools dispatch path) and have the LLM orchestrate + narrate + cite. LLM-generating a tolerance result is a bug, not a feature.

Standards RAG must be citation-exact and versioned. AS9100 rev, IPC class, MIL-STD method numbers — every finding cites a specific clause. Proposal Copilot's layered KB is the seed but needs stronger grounding + version pinning than proposal boilerplate did.

Bidirectional, governed system-of-record write-back (Cora). Proposal Copilot mostly writes files + optional export; the SharePoint/OneDrive sync tools are the closest analog. Cora is the approval engine — the Cockpit federates, writes back checklists/RAIL/approvals, and must not become a second workflow engine.

Add "Conditional Pass." ENG 001 gates can Pass, Conditional Pass (proceed with tracked actions), or Fail. Proposal Copilot only has approve/revise/reject — model the conditional-proceed-with-open-actions state and thread it into the RAIL.

Long-lived state + baselining. Projects span months–years (EOL radar looks 18–36 months out). Resume, versioning, and Cora baselines (at load / proposal / PO) matter far more than in a day-long proposal — lean hard on §2.3 and the versioned artifact registry.

RBAC / governance is first-class. Entra ID SSO, per-gate approver roles mirroring Cora, immutable audit log, NIST AI RMF posture. Proposal Copilot has a lighter role/permission model (proposal-manager, admin-delete) — extend it, don't assume it.

7. Suggested build order for Pivota (mirrors what de-risked Proposal Copilot)

State + artifact registry + gate primitive (thread-safe from day one) — the spine.

BaseAgent LLM wrapper + skill loader — port and adapt; it's domain-agnostic.

Plan builder keyed on project type/category — so tailoring is a config concern, not branching code.

One or two agents end-to-end through one gate (recommend the Gate 3/4 DFM/Standards flagship — clearest ROI, per the proposal) to prove the loop, including the CAD feature-extraction front end and deterministic-tool path.

Web Gate Cockpit + SSE runner — reuse the streaming/pause/resume/cancel machinery.

Cora federation + governed write-back, RBAC, audit log.

Verification/cross-check agents against authoritative sources (§5.1) before trusting any generated pack.

Bottom line: the orchestrator, the hardened agent-LLM wrapper, the skill-file config model, the per-run cache, the human-gate primitive, the plan-driven spine forking, and the resume/targeted-run machinery are all directly reusable. The genuinely new engineering work is upstream (CAD/BOM feature extraction), sideways (deterministic engineering tools + citation-exact standards RAG), and downstream (governed Cora write-back) — plus the Conditional-Pass gate state and heavier RBAC/audit posture.

8. Sample handoff to Pivota

Everything below is ready to paste into Pivota to bootstrap the Manufacturing & Digital Engineering Copilot. It encodes the reuse decisions above as a concrete starting spec.

8.1 The brief (paste into Pivota as the project context)

Build: an internal-only, multi-agent, human-in-the-loop Manufacturing & Digital Engineering Copilot that walks a product through TT Electronics' Product Lifecycle Process (ENG 001 v4.1) — Phases 0–9, Gates G0–G9. The AI drafts, checks, and packages gate work; a human reviews and signs every gate. Nothing advances without a human decision.

Reuse this proven architecture (from TechSur's Proposal Copilot): a gated orchestrator state machine; agents whose instructions/model/effort live in external skill files; a hardened LLM call wrapper (retries, truncation-continuation, cancellation, per-model input gating); a per-run in-memory content cache; a thread-safe versioned state/artifact registry; a recorded human-gate primitive (Approve/Revise/Reject → here Pass/Conditional Pass/Fail); a plan-builder that tailors which agents/gates run per project type; and idempotent resume + targeted ("run to Gate N and stop") execution.

One agent per gate (roster in §8.2), each mapped to that gate's exit criteria. Every consequential output requires human sign-off. Ground every finding in a cited source (RAG over the standards library + TT DFM rules + CAPA/yield history) — no ungrounded claims. Cora is the system of record: the Copilot federates with Cora and writes checklists, the RAIL, and approvals back to it — it does not become a second workflow engine.

Tailor, don't fork: a single executor runs different agent/gate subsets per Project Type (NPI A/B/C/D, Make-to-Print, NTI, CI) and Category (Cat 1/2/3), decided up front by a build_plan() (§8.3). Do NOT build a separate app per project type.

Design fresh (net-new vs. the proposal codebase): a CAD/BOM/GD&T feature-extraction front end; deterministic engineering checks (tolerance stack-up, DRC, obsolescence lookups, Cpk) run as TOOLS with the LLM orchestrating and citing; version-pinned, clause-exact standards RAG; governed bidirectional Cora write-back; a "Conditional Pass" gate outcome; Entra-ID RBAC + immutable audit log (NIST AI RMF posture).

Start with the flagship: build the Gate 3/Gate 4 DFM & Standards Audit agent end-to-end first (highest ROI, easiest to demo), including the CAD feature-extraction front end and the deterministic-tool path, to prove the whole loop on one real pilot part.

8.2 Starter agent roster (G0–G9)

One agent per gate; each backed by a skills/<name>.md file (model/effort/max_tokens + instructions + that gate's digitized exit-criteria checklist). Inputs/outputs from the TechSur proposal Appendix A; "Reuses" points at the closest Proposal Copilot analog to port.

G0 | Bid/No-Bid Copilot | RFQ/SOW, export-control lists, Salesforce, capability & win/loss history | Opportunity summary, capability/spec-gap, export screen, 1-page Bid/No-Bid brief | Screener + Objectives (Go/No-Go)
G1 | Proposal & Cost Agent | Requirements/spec, supplier quotes, parametric cost models, historical proposals | Costed proposal/business case, resource+schedule plan, Cora baseline, NTI starting-TRL note | RFP Pricing + Solution
G2 | Requirements Agent | Customer specs, applicable standards, prior requirement libraries | Decomposed direct/derived reqs, traceability matrix, testability audit | Compliance (writes the shared cache)
G3 | PDR + Early DFM Agent | Concept CAD, prelim BOM, prior-gate RAIL, historical yield | Trade-off analysis, early DFM/DFA screen, Risk & Issues register, PDR pack | Outline + Solution
G4 | DFM/Standards Audit (flagship) | Frozen CAD+GD&T, released BOM/PLM, TT DFM rules, CAPA/yield, standards | Risk-scored, source-cited DFM/DFA + standards audit; BOM health; CDR pack; provisional production docs | Compliance Verification (cross-verifier) + White Glove (vision)
G5 | V&V Test-Plan Agent | Test-method standards, traceability matrix, DFMEA, historical failures | V&V test matrix, pre-compliance environmental prediction, Gate 5 evidence pack | Technical/Management draft agents
G6 | MRL/PPAP Agent | PPAP/APQP conventions, PFMEA, FAI/Cpk data, Cora cost/baseline | MRL score, PPAP-precursor package, control plan/PFMEA, Gate 6 pack | QA/Packaging + Excel forms
G7 | Lessons-Learned Agent | Cora gate minutes & RAIL, early-production MES yield/scrap, CAPA | Structured lessons-learned, production anomaly flags, transfer audit, CI candidates | Gov Evaluation (retrospective)
G8 | Yield & Obsolescence Radar | Supplier PCN/PDN & EOL, distributor stock, obsolescence DBs, MES/ERP | Yield/quality Q&A, 18–36-mo obsolescence forecast, CRB support, anomaly alerts | Research agent (external-service wrapper)
G9 | EOL & Memory Agent | Customer EOL/last-time-buy, EHS/retention regs, ERP status, project archive | EOL notices & last-time-buy packs, redevelopment business case, retention/ERP audit, memory asset | Assembler + docx builder

8.3 build_plan sketch (project-type × category tailoring)

Port flows/rfi_plan.py to this shape — decide the enabled spine before any agent runs:

def build_plan(project_type: str, category: str) -> Plan:
    """Return the enabled gates/agents + per-criterion severity for this project.
    One executor follows the pruned plan — no per-type app, no branching in agents."""
    plan = Plan(gates=ALL_GATES)                      # G0..G9 canonical order

    if project_type == "make_to_print":
        plan.disable_agents(["PDR_EarlyDFM"])         # customer owns the design
        plan.enable_output("DFM_Standards", "make_to_print_manufacturability_advisory")
    elif project_type == "NTI":
        plan.use_variant("NTI")                        # TRL-3 check before G1; G2..G4 = TRL4->6
    elif project_type.startswith("NPI_"):
        pass                                           # full spine

    # Category tunes each gate's exit-criteria severity (Mandatory/Optional/Informational),
    # exactly as ENG 001 §6 marks them per project Type A/B/C/D.
    plan.apply_criteria_severity(load_gate_checklists(project_type, category))

    plan.expand_hard_dependencies()                   # e.g. V&V needs the traceability matrix
    return plan.pruned()

8.4 Skill-file template (one per agent)

Mirrors skills/*.md in the proposal codebase — instructions and tuning as data, not code:

---
name: dfm-standards-audit
description: Gate 3/4 DFM/DFA + standards audit; produces a risk-scored, source-cited report.
model: claude-opus-4-8
effort: high            # dominant driver of run time — right-size per agent
max_tokens: 32000       # raise for output-heavy packs (CDR); too small → truncation stall
requires_connectors: [cad, plm, standards_rag, capa_yield]   # skip cleanly if absent
tools: [tolerance_stackup, drc_check, bom_obsolescence, cpk_lookup]  # deterministic checks
---

You are the DFM & Standards Audit agent for TT Electronics' Gate 3 (light screen) and
Gate 4 (deep audit). Extract features from the CAD/BOM, run the declared deterministic
tools, and produce ONE consolidated, risk-scored report where EVERY finding cites its
source clause (AS9100 / ASME Y14.5 / ISO 2768 / IPC / MIL-STD), TT DFM rule, or CAPA/yield
record. Auto-fill the Cora gate checklist. Never pass a gate — surface findings for the
engineer to review and sign. Flag any missing input as a gap rather than guessing.

8.5 Suggested first sprint

Port state + gate primitive + BaseAgent wrapper + skill loader (domain-agnostic spine).

Stand up the CAD/BOM feature-extraction front end + 2–3 deterministic tools.

Build the G4 DFM/Standards flagship agent end-to-end through one gate, on one real pilot part, with a cross-verifier against the authoritative CAD/BOM/spec.

Wrap it in the Web Gate Cockpit (reuse the SSE runner: stream, pause, resume, cancel).

Add Cora federation + write-back, Entra RBAC, audit log.

Then fan out the remaining G0–G3, G5–G9 agents against the same skeleton.
