import { db } from './index';
import { projectState, phaseStates } from './schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const PHASE_CONFIG = [
  { phaseId: 0, phaseName: 'Commercial Assessment', technicalReview: 'Kickoff' },
  { phaseId: 1, phaseName: 'Business Case', technicalReview: 'SLR' },
  { phaseId: 2, phaseName: 'Requirements Definition', technicalReview: null },
  { phaseId: 3, phaseName: 'Preliminary Design', technicalReview: 'Schematic/PDR' },
  { phaseId: 4, phaseName: 'Detailed Design', technicalReview: 'PCB Layout/CDR' },
  { phaseId: 5, phaseName: 'Verification & Validation', technicalReview: null },
  { phaseId: 6, phaseName: 'Manufacturing Readiness', technicalReview: null },
  { phaseId: 7, phaseName: 'Transfer & Lessons Learned', technicalReview: null },
  { phaseId: 8, phaseName: 'Production & Sustaining', technicalReview: null },
  { phaseId: 9, phaseName: 'End of Life', technicalReview: null },
];

async function seed() {
  // Upsert the single project row
  await db.insert(projectState).values({
    projectId: 'EVINV-POC-001',
    productName: 'EV-INV-800 Demonstration Traction Inverter',
    projectType: 'NPI A',
    projectCategory: 'Category 1',
    currentPhase: 0,
    currentGate: 0,
    currentTechnicalReview: 'Kickoff',
    projectStatus: 'Active',
    syntheticDataIndicator: true,
  }).onConflictDoNothing();

  // Insert all 10 phase_states rows
  for (const phase of PHASE_CONFIG) {
    await db.insert(phaseStates).values({
      projectId: 'EVINV-POC-001',
      phaseId: phase.phaseId as unknown as number,
      phaseState: phase.phaseId === 0 ? 'AwaitingInputs' : 'Pending',
      gateState: 'Locked',
    }).onConflictDoNothing();
  }

  // Revoke UPDATE/DELETE on audit_history from app_role (run as superuser)
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_role') THEN
        CREATE ROLE app_role;
      END IF;
    END
    $$;
  `);

  // Revoke UPDATE/DELETE on audit_history from app_role (append-only enforcement)
  // Revoking a privilege never granted is a no-op in PostgreSQL — idempotent on every boot
  await db.execute(sql`
    REVOKE UPDATE, DELETE ON audit_history FROM app_role;
  `);

  console.log('Seed complete: EVINV-POC-001 project + 10 phase_states inserted');
  process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
