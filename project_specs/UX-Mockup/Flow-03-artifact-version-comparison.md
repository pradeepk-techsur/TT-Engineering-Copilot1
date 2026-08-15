# Flow-03: Artifact Version Comparison (Side-by-Side)

**User Stories:** US-3.3, US-5.1–US-5.4, US-8.3
**Personas:** Marcus Webb, James Okoro
**Trigger:** Revised input version created; targeted rerun complete; both original and revised results stored

```
[AV-05 Artifact Viewer — Entry Points]
    From AV-03: Output card "View" button
    From AV-04: Version history row → "View" or "Compare"
    From AV-08: Artifact row "View" button
         │
         ▼
[AV-05 Single Version Mode]
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ SYNTHETIC POC DATA — Not for Design, Fabrication,       │
│    Certification, Procurement, or Production                │
├─────────────────────────────────────────────────────────────┤
│ Artifact: [Name]                    Version: v[N] (Active)  │
│ Phase: N | Gate: N | Type: XLSX/DOCX/PDF                    │
│ Source: [UserUploaded / AgentGenerated / SyntheticSample]   │
│ Intake Behavior: [UP / SI]                                  │
│ System Represented: [if SI]     Generated: [timestamp]      │
├──────────────────────────┬──────────────────────────────────┤
│ Version History          │ Content Preview                  │
│ ┌──────────────────────┐ │                                  │
│ │v3 (Active) ✓ Current │ │ [rendered XLSX table or         │
│ │v2 ○ 2026-08-12       │ │  DOCX/PDF page view]            │
│ │v1 ○ 2026-08-10       │ │                                  │
│ └──────────────────────┘ │                                  │
│ [Compare two versions]   │                                  │
│ [Download this version]  │                                  │
└──────────────────────────┴──────────────────────────────────┘
         │
         ├── User selects "Compare two versions"
         │   Version selector: v1 ↔ v2 (or any two)
         │
         ▼
[AV-05 Comparison Mode]
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ SYNTHETIC POC DATA — Not for Design, Fabrication, ...    │
├──────────────────────────┬───────────────────────────────────┤
│ Version v1 (Original)    │ Version v2 (Revised)              │
│ 2026-08-10 · Fail        │ 2026-08-12 · Pass                 │
│ Input ref: [v1_id]       │ Input ref: [v2_id]                │
├──────────────────────────┼───────────────────────────────────┤
│ [Field / Row]  [Value]   │ [Field / Row]    [Value]          │
│ ─────────────────────    │ ──────────────────────────        │
│ VBUS+ to GND  6.2 mm ❌  │ VBUS+ to GND    9.1 mm ✅        │← highlighted diff
│ C_BULK_3      4.4%   ❌  │ C_BULK_3        52.2%  ✅        │← highlighted diff
│ DIAG_TEMP     No TP  ❌  │ DIAG_TEMP       TP-IGBT ✅       │← highlighted diff
│ C_HV_1 foot   0805   ❌  │ C_HV_1 foot     1206   ✅        │← highlighted diff
├──────────────────────────┴───────────────────────────────────┤
│ [Download v1]                        [Download v2]           │
└──────────────────────────────────────────────────────────────┘
```

**Provenance Panel (always visible in AV-05):**

| Field | Description |
|-------|-------------|
| Artifact ID | Unique stable identifier |
| Artifact Name | Logical name |
| Type | XLSX / DOCX / PDF |
| Source | UserUploaded / AgentGenerated / SyntheticSample |
| Intake Behavior | UP / SI |
| System Represented | (SI only) e.g., "Salesforce / Cora" |
| Generation / Intake Timestamp | UTC |
| Phase | N |
| Gate | N |
| Input Version References | IDs of input versions used to generate this artifact |
| Disclaimer Present | Always true |

**Deterministic Check Result Panel (when viewing check results, not file artifacts):**

```
┌──────────────────────────────────────────────────────────────────┐
│ Check: HV Clearance | Phase 4 | v1 (Initial) → v2 (Revised)     │
├────────────────────┬─────────────────────────────────────────────┤
│ Field              │ v1 (Initial)     │ v2 (Revised)             │
├────────────────────┼──────────────────┼──────────────────────────┤
│ Net Pair           │ VBUS+ to GND_SH  │ VBUS+ to GND_SH         │
│ Clearance Type     │ Air              │ Air                      │
│ Measured (mm)      │ 6.2              │ 9.1                      │
│ Threshold (mm)     │ 8.0              │ 8.0                      │
│ Margin (mm)        │ −1.8             │ +1.1                     │
│ Status             │ ❌ FAIL          │ ✅ PASS                  │
├────────────────────┴──────────────────┴──────────────────────────┤
│ Source: EVINV-POC-STD-001 §3.1 — HV Clearance Requirements       │
│         (Synthetic POC Standard, not an approved TT or           │
│          industry standard)                                       │
│ Limitation: Clearance values from design data; not extracted      │
│             directly from CAD files in POC                        │
└───────────────────────────────────────────────────────────────────┘
```

---

*UX-Mockup-TTCopilot | Flow-03 | 2026-08-15 | Synthetic POC Data Only*
