'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ConditionalAction {
  description: string; ownerRole: string; dueGate: number;
  blocking: boolean; requiredClosureEvidence: string;
}

export function ConditionalPassActionForm({ onActionsChange }: { onActionsChange: (actions: ConditionalAction[]) => void }) {
  const [actions, setActions] = useState<ConditionalAction[]>([{ description: '', ownerRole: '', dueGate: 0, blocking: true, requiredClosureEvidence: '' }]);

  const update = (i: number, field: keyof ConditionalAction, value: any) => {
    const next = [...actions]; (next[i] as any)[field] = value; setActions(next); onActionsChange(next);
  };

  return (
    <div className="space-y-3" data-testid="conditional-pass-action-form">
      <p className="text-[12px] text-fg-muted">
        Define at least one conditional action. Each needs an owner and the
        evidence that will close it.
      </p>
      {actions.map((a, i) => (
        <div key={i} className="space-y-3 rounded-lg border border-line bg-raised/50 p-3">
          <div className="space-y-1.5">
            <Label htmlFor={`cpa-desc-${i}`}>
              Description <span className="text-fail">*</span>
            </Label>
            <Input
              id={`cpa-desc-${i}`}
              value={a.description}
              onChange={e => update(i, 'description', e.target.value)}
              placeholder="What must be done…"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`cpa-owner-${i}`}>
                Owner role <span className="text-fail">*</span>
              </Label>
              <Input
                id={`cpa-owner-${i}`}
                value={a.ownerRole}
                onChange={e => update(i, 'ownerRole', e.target.value)}
                placeholder="e.g. Design Engineer"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`cpa-gate-${i}`}>Due gate</Label>
              <Input
                id={`cpa-gate-${i}`}
                type="number"
                min={0}
                max={9}
                value={a.dueGate}
                onChange={e => update(i, 'dueGate', parseInt(e.target.value))}
                className="tabular-nums"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`cpa-evidence-${i}`}>
              Required closure evidence <span className="text-fail">*</span>
            </Label>
            <Input
              id={`cpa-evidence-${i}`}
              value={a.requiredClosureEvidence}
              onChange={e => update(i, 'requiredClosureEvidence', e.target.value)}
              placeholder="e.g. Revised design drawing showing…"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
