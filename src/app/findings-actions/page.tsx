import { redirect } from 'next/navigation';

// Findings & Actions merged into Audit & Findings tab — redirect
export default function FindingsActionsPage() {
  redirect('/audit');
}
