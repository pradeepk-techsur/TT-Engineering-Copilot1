'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
      <p className="text-xs text-[var(--color-text-muted)]">Define at least one conditional action:</p>
      {actions.map((a, i) => (
        <div key={i} className="space-y-2 rounded-md border border-[var(--color-border)] p-3">
          <div><Label className="text-xs">Description *</Label>
            <Input value={a.description} onChange={e => update(i, 'description', e.target.value)} placeholder="What must be done..." className="text-xs mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Owner Role *</Label>
              <Input value={a.ownerRole} onChange={e => update(i, 'ownerRole', e.target.value)} placeholder="e.g. Design Engineer" className="text-xs mt-1" /></div>
            <div><Label className="text-xs">Due Gate</Label>
              <Input type="number" min={0} max={9} value={a.dueGate} onChange={e => update(i, 'dueGate', parseInt(e.target.value))} className="text-xs mt-1" /></div>
          </div>
          <div><Label className="text-xs">Required Closure Evidence *</Label>
            <Input value={a.requiredClosureEvidence} onChange={e => update(i, 'requiredClosureEvidence', e.target.value)} placeholder="e.g. Revised design drawing showing..." className="text-xs mt-1" /></div>
        </div>
      ))}
    </div>
  );
}
