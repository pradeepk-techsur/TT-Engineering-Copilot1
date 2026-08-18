'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
      <div className="space-y-4" data-testid="no-technical-review">
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
          <CardContent className="pt-6">
            <p className="text-sm text-[var(--color-text-muted)] text-center">
              No technical review is mapped to Phase {phaseId}: {config?.phaseName ?? `Phase ${phaseId}`}.
            </p>
            <p className="text-xs text-[var(--color-text-muted)] text-center mt-1">
              Technical reviews are defined for Phases 0, 1, 3, and 4 only per TT Electronics ENG 001 v4.1.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid={`technical-checklist-phase-${phaseId}`}>
      <div className="flex items-center gap-2">
        <Badge className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {(config as any)?.technicalReview ?? 'Technical Review'}
        </Badge>
        <span className="text-xs text-[var(--color-text-muted)]">
          Selected items from TT Electronics Power Supplies Technical Review Checklists — Prelim
        </span>
      </div>

      <div className="space-y-3">
        {checklistItems.map((item, i) => (
          <Card key={i} className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="text-xs bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      {item.category}
                    </Badge>
                    <span className="text-sm font-medium">{item.item}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)]">{item.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Pending
                  </Badge>
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] italic">
                Evidence required: {item.evidenceField}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
