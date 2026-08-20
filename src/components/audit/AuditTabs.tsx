'use client';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTable } from './AuditLogTable';
import { FindingsActionsWorkspace } from '@/components/findings/FindingsActionsWorkspace';

/**
 * `?tab=findings` opens the Findings & Actions tab directly.
 *
 * Risk-score and advisory drill-downs link to a specific finding or action, and
 * without this every one of those links landed on the event log instead — the
 * right page, but not the thing the reader asked to see.
 */
export function AuditTabs() {
  const params = useSearchParams();
  const requested = params.get('tab');
  const initial = requested === 'findings' || params.has('finding') || params.has('action')
    ? 'findings'
    : 'audit';

  return (
    <Tabs defaultValue={initial} className="gap-4">
      <TabsList>
        <TabsTrigger value="audit">Intake &amp; Event Log</TabsTrigger>
        <TabsTrigger value="findings">Findings &amp; Actions</TabsTrigger>
      </TabsList>
      <TabsContent value="audit">
        <AuditLogTable />
      </TabsContent>
      <TabsContent value="findings">
        <FindingsActionsWorkspace />
      </TabsContent>
    </Tabs>
  );
}
