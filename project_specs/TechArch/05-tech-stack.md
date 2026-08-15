## 6. Technology Stack

### 6.1 Stack Table

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend framework** | Next.js | 14.x (App Router) | React SSR + API routes; co-located frontend and backend |
| **UI library** | React | 18.x | Component model for 9 Web Gate Cockpit views |
| **UI components** | shadcn/ui + Tailwind CSS | Latest stable | Accessible, styled component primitives |
| **State management** | React Server Components + SWR | — | Server-driven data; client-side revalidation |
| **SSE client** | `EventSource` (browser native) | — | Phase execution real-time progress streaming |
| **Backend runtime** | Node.js | 20.x LTS | Server runtime for Next.js API routes |
| **Language** | TypeScript | 5.x | Full-stack type safety; shared interfaces between frontend and backend |
| **Primary database** | PostgreSQL | 15.x | Durable ProjectState persistence; relational integrity; partial unique index for single-active-version enforcement |
| **PostgreSQL client** | `pg` + `pg-types` | 8.x | Parameterized queries; type-safe PostgreSQL access |
| **Migrations** | `node-postgres-migrate` or `db-migrate` | Latest stable | Schema versioning |
| **Cache / Reference index** | Redis | 7.x | Reference document index (EVINV-POC-STD-001, checklists); per-run SSE cancel flags; context cache |
| **Redis client** | `ioredis` | 5.x | Redis connection pool |
| **LLM provider** | Anthropic Claude API | claude-sonnet-4-6 / claude-opus-4 | Phase agent LLM calls |
| **Anthropic SDK** | `@anthropic-ai/sdk` | Latest stable | Typed Claude API client |
| **File uploads** | `busboy` or Next.js built-in | — | Multipart form-data parsing for artifact uploads |
| **File storage** | Local filesystem (dev) / S3-compatible (prod) | — | Uploaded artifacts, synthetic samples, generated outputs |
| **S3 client** | `@aws-sdk/client-s3` | 3.x | S3-compatible storage access |
| **XLSX parsing** | `xlsx` (SheetJS) | Latest stable | Parse and generate XLSX artifacts |
| **PDF parsing** | `pdf-parse` | Latest stable | Parse uploaded PDF artifacts for validation |
| **DOCX parsing** | `mammoth` | Latest stable | Parse uploaded DOCX artifacts |
| **DOCX generation** | `docx` | Latest stable | Generate DOCX output artifacts |
| **Testing** | `jest` + `@testing-library/react` | Latest stable | Unit tests for deterministic tools; integration tests for API routes |
| **E2E testing** | `playwright` | Latest stable | End-to-end UI tests; gate decision flow verification |
| **Linting** | ESLint + Prettier | Latest stable | Code quality; formatting |
| **Environment config** | `dotenv` | — | `.env` file loading; no live system credentials |

### 6.2 Key Dependency Rationale

| Dependency | Rationale |
|---|---|
| PostgreSQL (not SQLite/JSON file) | Partial unique index (`WHERE active = TRUE`) enforces single-active-version at DB level. `REVOKE UPDATE DELETE ON audit_history` provides immutability without application trust. ACID transactions prevent race conditions on state writes. |
| Redis (not in-memory Map) | Reference index survives Node.js process restarts. Per-run SSE cancel flags are accessible across multiple requests. Context cache reduces LLM cost on rerun. |
| TypeScript (strict mode) | Shared interfaces for `CheckResult`, `AuditEvent`, `GateDecision`, etc. prevent runtime type mismatches between frontend, API, and DB layers. |
| `@anthropic-ai/sdk` | Official SDK handles API versioning, streaming, and error types. Hardened wrapper adds retry/continuation/cancellation on top. |
| SheetJS (`xlsx`) | Most capable open-source XLSX parser; handles both read (validation) and write (generation) of compact XLSX artifacts. |
| `playwright` | Gate decision UI tests require browser automation; playwright verifies confirmation dialog, radio button state, and SSE progress display. |

### 6.3 Directory Structure

```
tt-copilot/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # AV-01 Project Overview
│   ├── lifecycle/page.tsx        # AV-02 Product Lifecycle View
│   ├── phase/[id]/
│   │   ├── page.tsx              # AV-03 Phase Workspace
│   │   ├── intake/page.tsx       # AV-04 Input Intake Panel
│   │   └── checklist/page.tsx    # AV-06 Technical Checklist Workspace
│   ├── artifacts/[id]/page.tsx   # AV-05 Artifact Viewer
│   ├── findings-actions/page.tsx # AV-07 Findings & Actions Workspace
│   ├── gate/[id]/review/page.tsx # AV-08 Gate Review Workspace
│   └── audit/page.tsx            # AV-09 Audit View
│
├── app/api/                      # Next.js API routes
│   ├── orchestrator/             # Orchestrator endpoints
│   ├── phases/                   # Phase config, artifact count, intake
│   ├── project/                  # ProjectState, dependency graph
│   ├── checks/                   # Deterministic check endpoints
│   ├── findings/                 # Findings endpoints
│   ├── actions/                  # Actions endpoints
│   ├── gates/                    # Gate review and decision endpoints
│   ├── artifacts/                # Artifact registry endpoints
│   ├── system/                   # Index initialization, status
│   ├── context/                  # Context assembly endpoints
│   ├── views/                    # View data aggregation endpoints
│   └── sse/                      # SSE streaming endpoint
│
├── src/
│   ├── server/
│   │   ├── orchestrator/         # State machine + commands
│   │   ├── intake/               # UP and SI workflow handlers + validators
│   │   ├── tools/                # Deterministic check functions (no LLM)
│   │   ├── agents/               # Phase agents + hardened Claude wrapper
│   │   ├── context/              # Context assembly service
│   │   ├── referenceIndex/       # Reference doc indexing and query
│   │   ├── artifacts/            # Artifact validation, registration, storage
│   │   ├── sse/                  # SSE stream management
│   │   └── db/                   # PostgreSQL connection pool, query helpers
│   │
│   ├── shared/
│   │   ├── types/                # TypeScript interfaces (ProjectState, etc.)
│   │   ├── constants/            # Phase configuration (immutable)
│   │   └── errors/               # Error code constants
│   │
│   └── components/               # React components for 9 views
│       ├── layout/               # Breadcrumbs, shell, nav
│       ├── views/                # Per-view components (AV-01 through AV-09)
│       ├── intake/               # UP and SI intake panel components
│       ├── gate/                 # Gate Review Workspace components
│       └── shared/               # Artifact viewer, findings table, etc.
│
├── prisma/ or db/migrations/     # PostgreSQL migrations
├── public/samples/               # Preloaded synthetic sample files (23 connectors)
├── scripts/                      # DB seed, index initialization
└── tests/                        # Jest unit tests + Playwright E2E
```

### 6.4 Synthetic Sample Files

All 23 simulated connector synthetic samples are static files committed to the repository under `public/samples/`:

```
public/samples/
  phase0-ext-salesforce-cora-capability.xlsx
  phase1-ext-cora-historical-cost.xlsx
  phase2-ext-requirements-repo-icr.xlsx
  phase3-int-standards-library-mfg-capability.xlsx
  phase4-int-dfm-standards-supplier-risk.xlsx
  phase4-int-dfm-standards-supplier-risk-revised.xlsx   ← for SI-04 correction
  phase5-ext-test-methods-customer-acceptance.xlsx
  phase6-ext-mes-quality-capability.xlsx
  phase6-ext-mes-quality-capability-revised.xlsx         ← for SI-06 correction
  phase7-ext-cora-mes-capa-transfer.xlsx
  phase8-ext-supplier-distributor-obsolescence.xlsx
  phase8-int-erp-mes-plm-crb.xlsx
  phase9-ext-erp-tooling-archive.xlsx
  ... (additional per-connector files as needed)
```

Each file complies with compact artifact standards: ≤ 10 meaningful rows, 6–10 columns, mandatory disclaimer, provenance metadata in header row.

---

*TechArch-TTCopilot-v1.0 | §05-TechStack | Synthetic POC Data Only*
