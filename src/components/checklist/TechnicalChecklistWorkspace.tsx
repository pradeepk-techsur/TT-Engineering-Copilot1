'use client';
import { ClipboardList, FileCheck2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { StatusPill } from '@/components/ui/status-pill';
import { EmptyState } from '@/components/ui/empty-state';
import { TechReviewBadge } from '@/components/lifecycle/TechReviewBadge';
import { checkStatusStyle, styleFor } from '@/lib/status';
import { TECHNICAL_REVIEW_PHASES, PHASE_CONFIG_MAP } from '@/shared/constants/phaseConfig';

// Selected checklist items from TT Power Supplies Technical Review Checklists — Prelim
// Mapped to phases per build requirement (Phase 0→Kickoff, Phase 1→SLR, Phase 3→Schematic, Phase 4→CDR/PCB Layout)
const CHECKLIST_ITEMS: Record<number, { category: string; item: string; description: string; evidenceField: string }[]> = {
  0: [  // Kickoff Checklist (Phase 0)
    { category: 'Management', item: 'Resources Allocation', description: 'Has all the resources been assigned?', evidenceField: 'Resource assignment record or Cora entry' },
    { category: 'Programmatic', item: 'Milestones', description: 'Are all the major program milestones been confirmed & agreed upon?', evidenceField: 'Milestone schedule' },
    { category: 'Programmatic', item: 'Deliverables', description: 'Has all the major program deliverables been confirmed & agreed upon?', evidenceField: 'Deliverables register' },
    { category: 'Technical', item: 'Communication', description: 'Has the internal Technical Stand-ups been assigned dates & times?', evidenceField: 'Meeting schedule' },
    { category: 'Programmatic', item: 'Part Numbers', description: 'Has part numbers been created for top level & Subsystems?', evidenceField: 'Part number register' },
  ],
  1: [  // System Level Review (Phase 1)
    { category: 'Requirements', item: 'Requirements Completeness', description: 'Are all functional and non-functional requirements clearly defined and documented?', evidenceField: 'Requirements document' },
    { category: 'Architecture', item: 'Block Diagram', description: 'Is a complete and accurate system block diagram available?', evidenceField: 'System block diagram' },
    { category: 'Power', item: 'Power Budget', description: 'Is a complete system power budget calculated for all modes?', evidenceField: 'Power budget document' },
    { category: 'Thermal', item: 'Cooling Strategy', description: 'Is cooling strategy defined (passive, active, conduction)?', evidenceField: 'Thermal concept document' },
    { category: 'Programmatic', item: 'Cost Targets', description: 'Are cost targets realistic and defined?', evidenceField: 'Cost estimate' },
  ],
  3: [  // Schematic Review (Phase 3)
    { category: 'Architecture', item: 'Requirements Traceability', description: 'Does the schematic fully implement all system requirements and specifications?', evidenceField: 'RTM cross-reference' },
    { category: 'Power', item: 'Protection Features', description: 'Are OVP, UVLO, OCP, SCP, OTP implemented where required?', evidenceField: 'Schematic protection circuit review' },
    { category: 'Components', item: 'Voltage Rating', description: 'Are all components rated above maximum operating voltage?', evidenceField: 'Component ratings table' },
    { category: 'Components', item: 'Derating', description: 'Is proper derating applied (voltage, current, power)?', evidenceField: 'Derating analysis' },
    { category: 'Any Gotchas', item: 'Floating Nets', description: 'Are there any unintended floating nets or pins?', evidenceField: 'ERC check report' },
  ],
  4: [  // PCB Layout Review / CDR (Phase 4)
    { category: 'Schematic', item: 'Netlist Integrity', description: 'Does the PCB netlist exactly match the schematic without missing or extra connections?', evidenceField: 'Netlist comparison report' },
    { category: 'Schematic', item: 'Footprint Mapping', description: 'Are all footprints correctly assigned and verified against datasheets?', evidenceField: 'Footprint verification log' },
    { category: 'DFM', item: 'Trace/Space Limits', description: 'Does the design meet fab minimum trace/space rules?', evidenceField: 'DRC check report' },
    { category: 'Thermal', item: 'Thermal Vias', description: 'Are thermal vias used effectively under power devices?', evidenceField: 'Thermal via placement review' },
    { category: 'Current', item: 'Trace Width', description: 'Are all traces sized according to expected current using validated methods?', evidenceField: 'Trace width calculation' },
  ],
};

interface TechnicalChecklistWorkspaceProps {
  phaseId: number;
}

export function TechnicalChecklistWorkspace({ phaseId }: TechnicalChecklistWorkspaceProps) {
  const config = PHASE_CONFIG_MAP[phaseId as keyof typeof PHASE_CONFIG_MAP];
  const hasTechnicalReview = TECHNICAL_REVIEW_PHASES.has(phaseId);
  const checklistItems = CHECKLIST_ITEMS[phaseId] ?? [];

  // No technical review invented for Phase 2 or Phases 5–9
  if (!hasTechnicalReview) {
    return (
      <div data-testid="no-technical-review">
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={`No technical review is mapped to Phase ${phaseId}: ${config?.phaseName ?? `Phase ${phaseId}`}.`}
            description="Technical reviews are defined for Phases 0, 1, 3, and 4 only per TT Electronics ENG 001 v4.1."
          />
        </Card>
      </div>
    );
  }

  // Group by category so related checks sit together instead of repeating the
  // category chip on every one of five identical-looking cards.
  const grouped = checklistItems.reduce<Record<string, typeof checklistItems>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  const pending = styleFor(checkStatusStyle, 'Pending');

  return (
    <div className="space-y-4" data-testid={`technical-checklist-phase-${phaseId}`}>
      <div className="flex flex-wrap items-center gap-2.5">
        <TechReviewBadge review={(config as any)?.technicalReview ?? 'Technical Review'} />
        <span className="text-[12px] text-fg-muted">
          Selected items from TT Electronics Power Supplies Technical Review Checklists — Prelim
        </span>
        <span className="ml-auto text-[12px] text-fg-muted tabular-nums">
          {checklistItems.length} items · 0 complete
        </span>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <section key={category}>
            <h3 className="mb-2 text-[11px] font-semibold tracking-[0.07em] text-fg-muted uppercase">
              {category}
            </h3>
            <Card className="py-0">
              <ul className="divide-y divide-line">
                {items.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-4 px-4 py-3 transition-colors hover:bg-hover"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-fg">{item.item}</p>
                      <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-2">
                        {item.description}
                      </p>
                      <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-fg-muted">
                        <FileCheck2 size={11} strokeWidth={2} className="shrink-0" />
                        Evidence required:
                        <span className="text-fg-2">{item.evidenceField}</span>
                      </p>
                    </div>
                    <StatusPill tone={pending.tone} dot size="sm" className="mt-0.5">
                      {pending.label}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>
    </div>
  );
}
