# Y1 — Responsive Considerations

---

## Breakpoints

| Breakpoint | Range | Layout strategy |
|------------|-------|----------------|
| Desktop (primary) | ≥1280px | Full sidebar + full content; all columns visible |
| Desktop (compact) | 1024px – 1279px | Sidebar collapsible; full content |
| Tablet | 768px – 1023px | Sidebar hidden (hamburger menu); single-column content; tables horizontally scrollable |
| Mobile | <768px | Out of scope for POC (Web Gate Cockpit, web only) |

> The POC targets desktop-first (≥1024px). The Web Gate Cockpit is an internal engineering tool; mobile is explicitly out of scope per PRD Section 9.

---

## Desktop (≥1280px) — Standard Layout

- Persistent left sidebar (240px) always visible
- Breadcrumb bar below top nav header
- Content area: 3-column grid where applicable (e.g., AV-03: input panel | output panel | AI recommendation)
- Phase summary table (AV-01): all 6 columns visible
- Findings table (AV-07): all 8 columns visible
- Comparison view (AV-05): 50%/50% split columns, fixed-width, always aligned

---

## Desktop (1024px – 1279px) — Compact

- Sidebar collapses to icon-only rail (48px); hover/click expands full sidebar as overlay
- Content area full-width
- AV-03 Phase Workspace: 2-column layout (inputs + execution status | outputs + recommendation)
- AV-07 Findings table: secondary columns (Seeded, Last Action) hidden by default; expandable per row
- Lifecycle view (AV-02): phase nodes in 5-across grid (2 rows of 5); horizontal scroll if viewport clips

---

## Tablet (768px – 1023px)

- Sidebar hidden; accessed via hamburger icon (☰) in top bar
- Breadcrumb: shows only "EV-INV-800 > Phase N > Gate N" (tech review segment omitted on narrow); full breadcrumb on hover/tap
- AV-03 Phase Workspace: single column; input cards stacked vertically; output panel below inputs
- AV-01 Phase Summary Table: columns reduced to Phase | Status | Gate Outcome; secondary columns hidden
- AV-07 Tables: horizontal scroll with sticky first column (ID); row expansion for full detail
- AV-05 Comparison Mode: vertical stacking (v1 above v2) instead of side-by-side; diff highlighted per field
- AV-08 Gate Review: single column; sticky "Human Decision" panel pinned to bottom of viewport
- AV-02 Lifecycle View: horizontal scroll; phase nodes in a single row
- File upload: same behavior (drag-and-drop replaced by button on touch devices)

---

## Specific Responsive Behaviors by View

### AV-01 Project Overview
- Desktop: 3-column health indicators + full 10-row table visible
- Tablet: health indicators stacked; table shows 4 columns (Phase, Status, Gate, Outcome); tap row to expand

### AV-02 Product Lifecycle View
- Desktop: horizontal timeline, all 10 phases visible
- Compact/Tablet: horizontal scroll; phase nodes fixed width; current phase centered in viewport

### AV-03 Phase Workspace
- Desktop: 2-panel layout (Input Readiness | Outputs/AI/Decision)
- Compact: sequential sections; Phase Execution Status always pinned at top
- Tablet: full-page scroll; "Open Gate Review" button floats at page bottom

### AV-05 Artifact Viewer — Comparison Mode
- Desktop: side-by-side 50/50 fixed-column layout (critical: columns must always align by field name)
- Tablet: stacked; v1 on top, v2 below; field labels repeat in each version block

### AV-07 Findings and Actions
- Desktop: full-width table with all columns
- Tablet: Blocking Actions section expands to full width; main table collapses to ID + Status + expand button

### AV-08 Gate Review Workspace
- All breakpoints: Human Decision panel (outcome radios + Record Decision button) sticky at bottom of viewport
- Tablet: content sections collapse to accordions (Inputs Reviewed, Outputs Reviewed, Check Results, Findings, Open Actions, AI Recommendation); Human Decision always expanded

---

## Typography and Spacing Scaling

| Element | Desktop | Compact | Tablet |
|---------|---------|---------|--------|
| Page heading | 24px | 22px | 20px |
| Section heading | 18px | 16px | 15px |
| Body / table | 14px | 13px | 13px |
| Status badges | 12px | 12px | 11px |
| Breadcrumb | 13px | 12px | 11px |
| Input card padding | 24px | 20px | 16px |
| Table row height | 48px | 44px | 40px |

---

## Touch Targets (Tablet)

- All interactive elements minimum 44×44px touch target
- Radio buttons (gate outcome): oversized tap area (full row clickable)
- "Record Decision" button: full-width on tablet (prevents missed tap)
- "Ingest Sample" / "Run Phase N": full-width CTA buttons on tablet

---

*UX-Mockup-TTCopilot | Y1-responsive | 2026-08-15 | Synthetic POC Data Only*
