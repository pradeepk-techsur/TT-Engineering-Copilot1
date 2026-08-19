'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTable } from './AuditLogTable';
import { FindingsActionsWorkspace } from '@/components/findings/FindingsActionsWorkspace';

export function AuditTabs() {
  return (
    <Tabs defaultValue="audit" className="space-y-4">
      <TabsList className="bg-[var(--color-surface)]">
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
