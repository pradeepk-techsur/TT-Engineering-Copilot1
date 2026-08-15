# Technical Architecture Document
## TT Manufacturing and Engineering Copilot

**Document ID:** TechArch-TTCopilot-v1.0
**Project:** EVINV-POC-001
**Product:** EV-INV-800 Demonstration Traction Inverter
**Status:** Active
**Date:** 2026-08-15
**Classification:** Internal POC — Synthetic Data Only
**Built from:** PRD-TTCopilot-v1.0, FRD-TTCopilot-v1.0, PROJECT.md

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## 1. Architectural Overview

### 1.1 Pattern

The TT Engineering Copilot POC follows a **layered server-rendered web application** pattern with a clear separation between:

- **Presentation layer** — Next.js React frontend (Web Gate Cockpit, 9 views)
- **API layer** — Next.js API routes (or Express.js) serving a REST API
- **Orchestration layer** — Gated state-machine orchestrator running server-side TypeScript
- **Tool layer** — Deterministic engineering checks running as pure TypeScript functions (zero LLM involvement)
- **Agent layer** — LLM calls via Anthropic Claude API, hardened wrapper (retries, truncation continuation, cancellation)
- **State layer** — PostgreSQL for durable ProjectState persistence; Redis for reference-doc content cache and per-run context cache
- **Storage layer** — Local file system (dev) or S3-compatible object store (prod) for uploaded artifacts and synthetic sample files

The overarching architectural constraint is the **human-gate primitive**: no phase may advance, no gate may be decided, and no corrective action may close without an explicit human HTTP action from the Web Gate Cockpit. This is enforced at the API layer, the orchestrator, and the database schema — not merely by UI convention.

### 1.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Web Gate Cockpit)                          │
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │  AV-01   │ │  AV-02   │ │  AV-03   │ │  AV-04   │ │  AV-05   │  ...    │
│  │ Overview │ │Lifecycle │ │  Phase   │ │  Intake  │ │ Artifact │         │
│  │          │ │   View   │ │Workspace │ │  Panel   │ │  Viewer  │         │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘         │
│       │             │            │             │            │               │
│  ┌────┴─────────────┴────────────┴─────────────┴────────────┴─────────┐     │
│  │              SSE Stream  +  REST Fetch (Next.js Router)             │     │
│  └─────────────────────────────────────────────────────────────────────┘     │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS
┌───────────────────────────────────▼─────────────────────────────────────────┐
│                          NEXT.JS API LAYER  (/api/*)                        │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   Request Router + Auth Header Check                │   │
│  │          (X-Reviewer-Role enforcement; AI actor rejection)          │   │
│  └───────────┬───────────┬────────────┬──────────────────┬────────────┘   │
│              │           │            │                  │                 │
│  ┌───────────▼──┐ ┌──────▼───┐ ┌─────▼──────┐ ┌────────▼────────┐        │
│  │ Orchestrator │ │  Intake  │ │  Artifact  │ │  Views / Gates  │        │
│  │  Controller  │ │ Handler  │ │  Handler   │ │    Handler      │        │
│  └───────────┬──┘ └──────┬───┘ └─────┬──────┘ └────────┬────────┘        │
│              │           │            │                  │                 │
│  ┌───────────▼───────────▼────────────▼──────────────────▼────────────┐   │
│  │                      SERVICE LAYER (TypeScript)                     │   │
│  │                                                                     │   │
│  │  ┌────────────────────┐   ┌──────────────────────────────────────┐  │   │
│  │  │  State Machine /   │   │    Deterministic Tool Layer          │  │   │
│  │  │  Orchestrator      │   │    (NO LLM)                          │  │   │
│  │  │                    │   │  - CrossArtifactConsistency()        │  │   │
│  │  │  phase transitions │   │  - HVClearanceCheck()                │  │   │
│  │  │  dependency graph  │   │  - ComponentDeratingCheck()          │  │   │
│  │  │  targeted rerun    │   │  - TestPointCoverageCheck()          │  │   │
│  │  │  gate enforcement  │   │  - CpkCalculation()                  │  │   │
│  │  │  pause/resume/     │   │  - TraceabilityCompleteness()        │  │   │
│  │  │  retry/cancel      │   │  - RequirementTestability()          │  │   │
│  │  └────────────────────┘   │  - ActionClosureVerification()       │  │   │
│  │                           │  - CostCalculation()                 │  │   │
│  │  ┌────────────────────┐   └──────────────────────────────────────┘  │   │
│  │  │  LLM Agent Layer   │                                             │  │   │
│  │  │  (Anthropic Claude)│   ┌──────────────────────────────────────┐  │   │
│  │  │                    │   │  Context Assembly Service            │  │   │
│  │  │  Phase 0–9 agents  │   │  - Reference index query (Redis)     │  │   │
│  │  │  Hardened wrapper  │   │  - Compact phase summaries           │  │   │
│  │  │  - retries         │   │  - Token budget enforcement          │  │   │
│  │  │  - continuation    │   │  - Prompt construction               │  │   │
│  │  │  - cancellation    │   └──────────────────────────────────────┘  │   │
│  │  │  - SSE streaming   │                                             │   │
│  │  └────────────────────┘                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────┬───────────────────────┘
                           │                          │
           ┌───────────────▼──────┐    ┌──────────────▼──────────┐
           │     PostgreSQL       │    │   Redis Cache           │
           │                      │    │                         │
           │  project_state       │    │  Reference index        │
           │  phase_states        │    │  (EVINV-POC-STD-001,    │
           │  phase_inputs        │    │   checklists, rules)    │
           │  input_versions      │    │                         │
           │  artifact_registry   │    │  Per-run context cache  │
           │  phase_outputs       │    │  SSE run state          │
           │  check_results       │    └─────────────────────────┘
           │  findings            │
           │  actions             │    ┌─────────────────────────┐
           │  gate_decisions      │    │  File Storage           │
           │  audit_history       │    │  (Local / S3-compat.)   │
           └──────────────────────┘    │                         │
                                       │  Uploaded artifacts     │
                                       │  Synthetic samples      │
                                       │  Generated outputs      │
                                       └─────────────────────────┘
```

### 1.3 Deployment Topology

**POC deployment:** Single-server Node.js process with all layers co-located.

```
┌───────────────────────────────────────────────────────┐
│   POC Server (Node.js / Next.js)                      │
│                                                       │
│   Port 3000 — Next.js (frontend + API routes)        │
│   PostgreSQL — localhost:5432 (or managed instance)  │
│   Redis — localhost:6379 (or managed instance)       │
│   File storage — /var/tt-copilot/artifacts/          │
│                                                       │
│   Environment vars:                                   │
│     ANTHROPIC_API_KEY=sk-ant-...                      │
│     DATABASE_URL=postgresql://...                     │
│     REDIS_URL=redis://localhost:6379                  │
│     STORAGE_PATH=/var/tt-copilot/artifacts            │
│     POC_CONTEXT_TOKEN_BUDGET=8000                     │
└───────────────────────────────────────────────────────┘
```

**No external enterprise system connections in POC v1.** All 23 simulated connectors are preloaded synthetic sample files served from local storage.

### 1.4 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js (React) | Full-stack TypeScript; API routes co-located; SSR for initial load |
| Backend API | Next.js API routes (or Express.js) | Simplicity for POC; same language as frontend |
| Primary state store | PostgreSQL | Relational integrity for audit immutability; UNIQUE index enforces single active version |
| Reference cache | Redis | Low-latency retrieval of indexed passages; prevents cold-start per invocation |
| LLM provider | Anthropic Claude (claude-sonnet or claude-opus) | Single provider; hardened wrapper handles retries and continuation |
| Streaming | Server-Sent Events (SSE) | One-directional; simpler than WebSockets for phase execution streaming |
| Deterministic tools | Pure TypeScript functions (no LLM) | Correctness, repeatability, auditability |
| Authentication | None (POC) — reviewer role in `X-Reviewer-Role` header | Single-user demo; no Entra ID in POC scope |
| File storage | Local filesystem (dev); S3-compatible (prod) | Configurable via `STORAGE_PATH` / `STORAGE_BUCKET` env var |
| Artifact format | JSON state + binary file storage | ProjectState in PostgreSQL; file content in storage; URL pointer in `artifact_registry.storage_uri` |

---

*TechArch-TTCopilot-v1.0 | §00-Overview | Synthetic POC Data Only*
