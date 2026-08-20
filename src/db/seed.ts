import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { projectState, phaseStates, phaseInputs } from './schema';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

/**
 * The pool is built here rather than imported from './index' on purpose.
 *
 * ESM hoists imports, so `import { db } from './index'` evaluated that module —
 * and its top-level `new Pool({ connectionString: process.env.DATABASE_URL })` —
 * before this file's `dotenv.config()` had a chance to run. DATABASE_URL was
 * undefined at pool construction, so `npm run db:seed` died with
 * "SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string" for
 * anyone who had not already exported it into their shell. migrate.ts builds
 * its pool after loading dotenv for exactly this reason; seed now matches.
 */
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

const PHASE_CONFIG = [
  { phaseId: 0, phaseName: 'Project Initiation', technicalReview: 'Kickoff' },
  { phaseId: 1, phaseName: 'Concept & Proposal', technicalReview: 'SLR' },
  { phaseId: 2, phaseName: 'Requirements Development', technicalReview: null },
  { phaseId: 3, phaseName: 'Preliminary Design', technicalReview: 'Schematic/PDR' },
  { phaseId: 4, phaseName: 'Detail Design', technicalReview: 'PCB Layout/CDR' },
  { phaseId: 5, phaseName: 'Design Validation', technicalReview: null },
  { phaseId: 6, phaseName: 'Production Preparation & Qualification', technicalReview: null },
  { phaseId: 7, phaseName: 'Transfer & Monitor', technicalReview: null },
  { phaseId: 8, phaseName: 'Manufacture', technicalReview: null },
  { phaseId: 9, phaseName: 'End-of-Life', technicalReview: null },
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

  // Seeded AI recommendations for phases 0–2 — used by Gate Review Workspace tests.
  // Advisory label 'Advisory Only — Human Decision Required' is always set here at seed time
  // and overwritten by the real agent at execute time. SYNTHETIC POC data.
  const SEEDED_AI_RECOMMENDATIONS: Record<number, object> = {
    0: {
      recommendedOutcome: 'Pass',
      rationale: '[SYNTHETIC POC] Commercial assessment complete. EV-INV-800 meets bid/no-bid criteria for Category 1 NPI. Opportunity summary and capability gap matrix produced.',
      findingsCited: [],
      checksCited: [],
      advisoryLabel: 'Advisory Only — Human Decision Required',
    },
    1: {
      recommendedOutcome: 'Pass',
      rationale: '[SYNTHETIC POC] Business case and costed proposal reviewed. Resource schedule milestone alignment acceptable. No critical cost variances detected.',
      findingsCited: [],
      checksCited: [],
      advisoryLabel: 'Advisory Only — Human Decision Required',
    },
    2: {
      recommendedOutcome: 'Conditional Pass',
      rationale: '[SYNTHETIC POC] Requirements definition mostly complete. Finding F2-001 (REQ-THERM-004 non-testable criterion) raised. Conditional pass pending revised thermal criterion.',
      findingsCited: ['F2-001'],
      checksCited: ['RequirementTestability'],
      advisoryLabel: 'Advisory Only — Human Decision Required',
    },
  };

  // Insert all 10 phase_states rows — upsert aiRecommendation so the advisory label
  // is always present in the DB even after a compose restart (volumes persist).
  // All other fields use onConflict no-update to preserve live agent state.
  for (const phase of PHASE_CONFIG) {
    const seededRec = SEEDED_AI_RECOMMENDATIONS[phase.phaseId] ?? null;
    await db.insert(phaseStates).values({
      projectId: 'EVINV-POC-001',
      phaseId: phase.phaseId as unknown as number,
      phaseState: phase.phaseId === 0 ? 'AwaitingInputs' : 'Pending',
      gateState: 'Locked',
      aiRecommendation: seededRec,
    }).onConflictDoUpdate({
      target: [phaseStates.projectId, phaseStates.phaseId],
      // Only set aiRecommendation when it is currently null (preserve agent-set values)
      set: {
        aiRecommendation: sql`CASE WHEN phase_states.ai_recommendation IS NULL THEN ${JSON.stringify(seededRec) as any} ELSE phase_states.ai_recommendation END`,
      },
    });
  }

  // Seed Phase 3 phaseInputs rows — required so POST /api/phases/3/execute does not return
  // 409 INPUTS_NOT_READY. onConflictDoNothing makes this idempotent on container restart.
  await db.insert(phaseInputs).values([
    {
      projectId: 'EVINV-POC-001',
      phaseId: 3 as any,
      inputRole: 'external',
      logicalName: 'Design Rules and Manufacturing Capabilities Package',
      intakeBehavior: 'SI',
      systemRepresented: 'Standards Library, Manufacturing-Capability Repository',
      readinessStatus: 'Synthetic System Input Ready',
      validationIssues: [],
    },
    {
      projectId: 'EVINV-POC-001',
      phaseId: 3 as any,
      inputRole: 'internal',
      logicalName: 'Preliminary Design Package',
      intakeBehavior: 'UP',
      systemRepresented: null,
      readinessStatus: 'User Input Ready',
      validationIssues: [],
    },
  ]).onConflictDoNothing();

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

  // Enforce append-only on audit_history via a trigger — role-agnostic guard that
  // blocks UPDATE/DELETE regardless of which DB role executes the statement.
  // SQLSTATE '45000' = unhandled user-defined exception (ISO/IEC 9075 compliant).
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION audit_history_immutable()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'audit_history is append-only: UPDATE and DELETE are not permitted'
        USING ERRCODE = '45000';
      RETURN NULL;
    END;
    $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_audit_history_immutable'
          AND tgrelid = 'audit_history'::regclass
      ) THEN
        CREATE TRIGGER trg_audit_history_immutable
          BEFORE UPDATE OR DELETE ON audit_history
          FOR EACH ROW EXECUTE FUNCTION audit_history_immutable();
      END IF;
    END
    $$;
  `);

  console.log('Seed complete: EVINV-POC-001 project + 10 phase_states inserted');
  process.exit(0);
}
seed().catch((e) => { console.error(e); process.exit(1); });
