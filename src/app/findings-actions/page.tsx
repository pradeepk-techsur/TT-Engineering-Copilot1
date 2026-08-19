import { redirect } from 'next/navigation';

// Findings & Actions merged into Audit View — redirect for backwards compatibility
export default function FindingsActionsPage() {
  redirect('/audit?tab=findings');
}
