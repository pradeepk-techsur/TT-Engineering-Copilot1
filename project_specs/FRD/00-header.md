# Functional Requirements Document
## TT Manufacturing and Engineering Copilot

**Document ID:** FRD-TTCopilot-v1.0
**Project:** EVINV-POC-001
**Product:** EV-INV-800 Demonstration Traction Inverter
**Status:** Active
**Date:** 2026-08-15
**Classification:** Internal POC — Synthetic Data Only
**Built from:** PRD-TTCopilot-v1.0, PROJECT.md, REQUIREMENTS.md

> **Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production.**

---

## Scope

This document specifies the functional behavior of every feature in the TT Manufacturing and Engineering Copilot POC (EVINV-POC-001). It covers Features F0–F10, including inputs, outputs, validation rules, process steps, error states, API surface, and state schema. It is the authoritative implementation reference for all developers building the Web Gate Cockpit and backend orchestration. PRD-TTCopilot-v1.0 contains the product vision; this FRD contains the behavioral contract.

---

## Table of Contents

| Chunk File | Feature | Title |
|---|---|---|
| F00-orchestration.md | F0 | Lifecycle Orchestration and Gated State Machine |
| F01-artifact-count.md | F1 | Artifact-Count Discipline |
| F02-input-intake.md | F2 | Input Intake Framework |
| F03-input-versioning.md | F3 | Input Versioning and Dependency-Aware Revision |
| F04-project-state.md | F4 | Shared ProjectState |
| F05-deterministic-checks.md | F5 | Deterministic Engineering Checks |
| F06-seeded-issues.md | F6 | Seeded Issues and Correction Cycles |
| F07-token-optimization.md | F7 | Token Optimization and Context Management |
| F08-compact-artifacts.md | F8 | Compact Artifact Standards |
| F09-application-views.md | F9 | Application Views — Nine-View Web Gate Cockpit |
| F10-gate-review.md | F10 | Gate Review Model |
| Y0-schema.md | — | Database / State Schema (DDL) |
| Y1-api.md | — | REST API Endpoint Catalog |
| Y2-errors.md | — | Cross-Feature Error Catalog |
| Y3-integrations.md | — | External Integration Points |

---

## Document Conventions

- **Feature IDs:** F0–F10 correspond to PRD feature numbers.
- **Requirement IDs:** LC-nn, AC-nn, II-nn, UP-nn, SE-nn, IR-nn, IV-nn, OP-nn, CA-nn, DP-nn, SI-nn, TO-nn, PS-nn, AV-nn, GR-nn, SS-nn trace back to REQUIREMENTS.md.
- **Phase numbers (TT lifecycle):** Phase 0–9 = TT Electronics ENG 001 v4.1 lifecycle phases.
- **Phase numbers (dev roadmap):** Software development phases referenced in REQUIREMENTS.md Traceability section — these are distinct from TT lifecycle phases.
- **Gate numbers:** Gate 0–9 correspond 1:1 to lifecycle phases (Gate N exits Phase N).
- **Intake behavior codes:** `UP` = User-Provided File; `SI` = Simulated External-System Intake.
- **Status states:** `Awaiting User Input`, `User Input Ready`, `Synthetic System Input Ready`, `Waiting for Synthetic Sample Ingestion`, `Ready to Run`, `Processing`, `Awaiting Human Decision`, `Complete`.
- **Gate outcomes:** `Pass`, `Conditional Pass`, `Fail` — exactly three, human-selected only.
- **Breadcrumb states:** `Completed`, `Current`, `Awaiting Human Decision`, `Conditional Pass`, `Blocked`, `Upcoming`, `Closed`.
- **Terminology enforcement:** The term "replacement input" is prohibited everywhere. Use "revised version". The labels "Connected to [SYSTEM]", "Retrieved from [SYSTEM]", "Live [SYSTEM] Data" are prohibited. Use "Simulated Connector", "Preloaded Synthetic Sample", "Synthetic System Input".
- **Disclaimer (mandatory on every synthetic artifact):** "Synthetic POC Data. Not TT Electronics Product Data. Not for Design, Fabrication, Certification, Procurement, or Production."
- **EVINV-POC-STD-001:** Synthetic POC standard, not an approved TT or industry standard. Label every use accordingly.

---

## Cross-Cutting Terminology

| Term | Definition |
|---|---|
| **EV-INV-800** | Fictional EV traction inverter product used as the demonstration subject |
| **EVINV-POC-001** | Project ID for the EV-INV-800 demonstration |
| **ENG 001 v4.1** | TT Electronics Product Lifecycle Process; defines Phase 0–9 and Gate 0–9 |
| **EVINV-POC-STD-001** | Synthetic engineering standard defining POC thresholds (clearance, derating, Cpk); not a real standard |
| **ProjectState** | Single versioned object that is the source of truth across all phases |
| **Orchestrator** | Gated state-machine controller that manages phase progression and enforces human gate authority |
| **Phase Workspace** | Per-phase UI view (AV-03) containing input readiness panel, output panel, findings, AI recommendation, human decision |
| **Gate Review Workspace** | AV-08 view built dynamically from ProjectState; no separate artifact emitted |
| **Web Gate Cockpit** | The primary human-in-the-loop web application with nine structured views |
| **Intake Behavior** | Predetermined mode for each input: USER-PROVIDED FILE (UP) or SIMULATED EXTERNAL-SYSTEM INTAKE (SI) |
| **Simulated Connector** | Label indicating a simulated (not live) connection to an enterprise system |
| **Revised Version** | A new version of an existing input; prior versions preserved; term "replacement input" prohibited |
| **Dependency Graph** | Directed graph in ProjectState tracking which outputs depend on which inputs and check results |
| **Compact Phase Summary** | Structured summary of an approved phase stored in ProjectState for use as upstream context by downstream agents |
| **NPI A / Cat 1** | New Product Introduction Type A, Category 1 — the product type for this POC; all gates mandatory |
| **Seeded Issue** | An intentionally embedded engineering problem in synthetic POC data, detectable by a deterministic check or rule |
| **Correction Cycle** | The workflow: issue detected → finding raised → human approves corrective action → revised input → rerun → result preserved |
| **Happy-Path Storyline** | The canonical gate sequence: G0 Pass → G1 Pass → G2 Pass (after clarification) → G3 Conditional Pass → G4 Pass (after correction) → G5 Pass (after correction) → G6 Pass (after correction) → G7 Pass → G8 Pass (to initiate EOL) → G9 Pass (project closed) |
| **Technical Review** | Formal review meeting mapped to specific phases: Kickoff (P0), SLR (P1), Schematic/PDR (P3), PCB Layout/CDR (P4) |
| **Deterministic Check** | An engineering calculation or consistency check that runs outside the LLM, producing reproducible results |
| **Artifact Registry** | Table in ProjectState listing every artifact with its provenance, version, phase, and status |
| **Finding** | A structured record of a detected engineering issue; not counted as a phase output |
| **Action** | A structured corrective or parallel task linked to a finding; tracked to closure; not counted as a phase output |
| **Blocking Action** | An action that must be closed before the associated gate can be approved |

---

*FRD-TTCopilot-v1.0 | Generated: 2026-08-15 | Synthetic POC Data Only*
