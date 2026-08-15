# Y2 — Accessibility Notes

---

## Color Contrast Requirements

All text meets WCAG 2.1 AA minimum contrast ratios (4.5:1 for body text; 3:1 for large text/UI components):

| Element | Foreground | Background | Ratio target |
|---------|-----------|------------|--------------|
| Body text | #1a1a2e (near-black) | #ffffff | ≥7:1 |
| Status badge text | #ffffff | state color | ≥4.5:1 |
| Blocking action banner | #ffffff | #b91c1c (red-700) | ≥4.5:1 |
| Amber/warning badge | #1a1a2e | #fbbf24 (amber-400) | ≥4.5:1 |
| Green success badge | #ffffff | #15803d (green-700) | ≥4.5:1 |
| Disabled button text | #6b7280 (grey-500) | #f3f4f6 (grey-100) | ≥3:1 |
| Synthetic data banner | #1a1a2e | #fef3c7 (amber-50) | ≥7:1 |
| Diff highlight (changed) | #1a1a2e | #fef08a (yellow-200) | ≥4.5:1 |

**Color is never the sole differentiator.** Status states use both color AND icon/text:
- ✅ Green + "Pass" text
- ❌ Red + "Fail" text
- ⏳ Amber + "Awaiting Decision" text
- 🔶 Orange + "Conditional Pass" text
- ⛔ Red + "Blocked" text

---

## Keyboard Navigation

All interactive elements are reachable and operable via keyboard alone:

| Key | Behavior |
|-----|---------|
| Tab | Move focus forward through interactive elements |
| Shift+Tab | Move focus backward |
| Enter / Space | Activate focused button, link, or radio button |
| Arrow keys | Navigate radio button groups (gate outcome selection) |
| Escape | Close confirmation dialogs without confirming |
| Enter | Confirm dialog (when confirm button has focus) |

### Focus Order (AV-03 Phase Workspace)
1. Breadcrumb links (left to right)
2. Phase Execution Status action button (if available)
3. External input card controls (View, Download, Upload, Ingest Sample)
4. Internal input card controls (View, Download, Upload, Ingest Sample)
5. Output card controls (View, Approve, Request Revision)
6. AI Recommendation (read-only, skip in tab order unless expandable)
7. Findings & Actions (View All link)
8. "Open Gate Review" button

### Focus Order (AV-08 Gate Review Workspace)
1. Breadcrumb
2. Inputs/Outputs reviewed (View links)
3. Check results (View link)
4. Findings (View All link)
5. Open Actions (link to AV-07)
6. AI Recommendation (read-only)
7. Reviewer Comments textarea
8. Gate Outcome radio group (Pass, Conditional Pass, Fail)
9. Conditional Pass Action form (if visible)
10. Record Decision button

### Focus Trap in Confirmation Dialogs
When a confirmation dialog is open:
- Tab cycles only within the dialog (Cancel ↔ Confirm)
- Escape = Cancel
- Focus returns to triggering button on dialog close

---

## Screen Reader Considerations

### ARIA Labels

| Element | ARIA attribute |
|---------|---------------|
| Input readiness "READY" / "NOT READY" indicator | `aria-label="[Artifact Name] input status: Ready"` |
| Radio button group | `role="radiogroup"` + `aria-labelledby="gate-outcome-heading"` |
| Disabled radio ("Pass" when blocking) | `aria-disabled="true"` + `aria-describedby="blocking-actions-message"` |
| Blocking action banner | `role="alert"` + `aria-live="assertive"` |
| Phase Execution Status (when it changes) | `aria-live="polite"` |
| "Record Decision" button (when disabled) | `aria-disabled="true"` + `aria-describedby="no-selection-hint"` |
| Synthetic data disclaimer banner | `role="note"` + `aria-label="Synthetic POC data disclaimer"` |
| Confirmation dialog | `role="dialog"` + `aria-modal="true"` + `aria-labelledby="dialog-title"` |
| Breadcrumb nav | `role="navigation"` + `aria-label="Lifecycle breadcrumb"` |
| Sidebar nav | `role="navigation"` + `aria-label="Main navigation"` |
| Audit View immutable banner | `role="status"` + `aria-label="Immutable record, append only"` |
| Version comparison table | `aria-label="Artifact comparison: version [v1] vs version [v2]"` |

### Dynamic Announcements

| Event | Announcement strategy |
|-------|----------------------|
| File upload validation complete | `aria-live="polite"`: "[Artifact Name] validated. Status: [Pass/Fail]." |
| Sample ingestion complete | `aria-live="polite"`: "[Artifact Name] ingested. Synthetic System Input Ready." |
| Phase execution status change | `aria-live="polite"`: "Phase [N] status: [new status]." |
| Blocking action banner appears | `aria-live="assertive"`: "N blocking actions outstanding. Pass outcome disabled." |
| Gate decision recorded | `aria-live="assertive"`: "Gate [N] decision recorded: [outcome]. Immutable." |
| Confirmation dialog opened | Focus moves to dialog; `aria-modal="true"` |

---

## Alternative Text

| Image/Icon | Alt text |
|-----------|----------|
| ✅ Pass icon | "Pass" |
| ❌ Fail icon | "Fail" |
| ⚠️ Warning icon | "Warning" |
| ⛔ Blocked icon | "Blocked" |
| ⏳ Awaiting Decision icon | "Awaiting human decision" |
| 🔶 Conditional Pass icon | "Conditional Pass" |
| ○ Upcoming icon | "Upcoming" |
| 🔒 Closed icon | "Project closed" |
| [SI] badge | "Simulated External-System Intake" |
| [UP] badge | "User-Provided File" |
| ✦ Seeded badge | "Seeded issue" |

---

## Form Accessibility

- All form fields have associated `<label>` elements (not just placeholder text)
- Required fields marked with `aria-required="true"` and visual asterisk
- Validation errors associated via `aria-describedby` pointing to error message element
- Error messages are programmatically associated with the field that failed
- File upload inputs have descriptive labels: `aria-label="Upload [Artifact Name] (PDF, DOCX, or XLSX)"`

---

## Table Accessibility

- All data tables use `<th>` with `scope="col"` for column headers
- Comparison tables use `<th>` with `scope="row"` for row headers (field names)
- Phase summary table (AV-01) summary row totals labeled with `aria-label`
- Findings/Actions tables use `aria-sort` on sortable columns

---

## Reduced Motion

- All transition animations respect `prefers-reduced-motion` media query
- Progress spinners: static indicator (percentage or step count) as fallback
- Phase Execution Status transitions: instant text update, no animated slide

---

*UX-Mockup-TTCopilot | Y2-accessibility | 2026-08-15 | Synthetic POC Data Only*
