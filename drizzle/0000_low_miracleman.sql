CREATE TABLE IF NOT EXISTS "actions" (
	"action_id" text PRIMARY KEY NOT NULL,
	"source_finding_id" text NOT NULL,
	"source_phase" smallint NOT NULL,
	"source_gate" smallint NOT NULL,
	"description" text NOT NULL,
	"owner_role" text NOT NULL,
	"blocking" boolean DEFAULT false NOT NULL,
	"parallel" boolean DEFAULT false NOT NULL,
	"due_phase" smallint NOT NULL,
	"due_gate" smallint NOT NULL,
	"required_closure_evidence" text NOT NULL,
	"status" text NOT NULL,
	"human_approver" text,
	"closure_evidence_artifact_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "artifact_registry" (
	"artifact_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artifact_name" text NOT NULL,
	"artifact_type" text NOT NULL,
	"source" text NOT NULL,
	"intake_behavior" text NOT NULL,
	"version" integer NOT NULL,
	"phase_id" smallint NOT NULL,
	"gate_id" smallint NOT NULL,
	"input_version_refs" text[] DEFAULT '{}'::text[] NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"generated_by" text NOT NULL,
	"disclaimer_present" boolean DEFAULT true NOT NULL,
	"storage_uri" text NOT NULL,
	"row_count" integer,
	"page_count" integer,
	"file_size_bytes" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_history" (
	"audit_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"phase_id" smallint,
	"description" text NOT NULL,
	"actor" text NOT NULL,
	"related_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "check_results" (
	"check_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"check_type" text NOT NULL,
	"phase_id" smallint NOT NULL,
	"input_version_ids" text[] NOT NULL,
	"formula_or_method" text NOT NULL,
	"threshold" text NOT NULL,
	"threshold_unit" text NOT NULL,
	"result_value" text NOT NULL,
	"result_unit" text NOT NULL,
	"status" text NOT NULL,
	"source_reference" text NOT NULL,
	"limitation" text NOT NULL,
	"items_checked" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"invalidated" boolean DEFAULT false NOT NULL,
	"superseded_by" uuid,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "findings" (
	"finding_id" text PRIMARY KEY NOT NULL,
	"source_phase" smallint NOT NULL,
	"source_gate" smallint NOT NULL,
	"detected_by" text NOT NULL,
	"check_id" uuid,
	"description" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"seeded" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"closed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gate_decisions" (
	"decision_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gate_number" smallint NOT NULL,
	"phase_name" text NOT NULL,
	"ai_recommendation" jsonb NOT NULL,
	"human_disposition" text DEFAULT '' NOT NULL,
	"reviewer_role" text NOT NULL,
	"decision" text NOT NULL,
	"comments" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"artifact_versions_reviewed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"open_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_final" boolean DEFAULT true NOT NULL,
	"supersedes" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "input_versions" (
	"version_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"input_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"artifact_id" uuid,
	"intake_behavior" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"validation_result" jsonb NOT NULL,
	"intake_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"invalidated_by" uuid,
	"rerun_triggered" boolean DEFAULT false NOT NULL,
	"affected_scope" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phase_inputs" (
	"input_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"phase_id" smallint NOT NULL,
	"input_role" text NOT NULL,
	"logical_name" text NOT NULL,
	"intake_behavior" text NOT NULL,
	"system_represented" text,
	"readiness_status" text NOT NULL,
	"validation_issues" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phase_outputs" (
	"output_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"phase_id" smallint NOT NULL,
	"output_name" text NOT NULL,
	"artifact_type" text NOT NULL,
	"size_guidance" text NOT NULL,
	"artifact_id" uuid,
	"version_ref" text NOT NULL,
	"approval_status" text NOT NULL,
	"review_required" boolean DEFAULT false NOT NULL,
	"approved_by" text,
	"approved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "phase_states" (
	"phase_state_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" text NOT NULL,
	"phase_id" smallint NOT NULL,
	"phase_state" text NOT NULL,
	"gate_state" text NOT NULL,
	"ai_recommendation" jsonb,
	"compact_phase_summary" jsonb,
	"execution_started_at" timestamp with time zone,
	"execution_completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_state" (
	"state_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_version" integer DEFAULT 1 NOT NULL,
	"project_id" text DEFAULT 'EVINV-POC-001' NOT NULL,
	"product_name" text NOT NULL,
	"project_type" text DEFAULT 'NPI A' NOT NULL,
	"project_category" text DEFAULT 'Category 1' NOT NULL,
	"current_phase" smallint NOT NULL,
	"current_gate" smallint NOT NULL,
	"current_technical_review" text,
	"project_status" text NOT NULL,
	"synthetic_data_indicator" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_state_project_id_unique" UNIQUE("project_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_source_finding_id_findings_finding_id_fk" FOREIGN KEY ("source_finding_id") REFERENCES "public"."findings"("finding_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_closure_evidence_artifact_id_artifact_registry_artifact_id_fk" FOREIGN KEY ("closure_evidence_artifact_id") REFERENCES "public"."artifact_registry"("artifact_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "findings" ADD CONSTRAINT "findings_check_id_check_results_check_id_fk" FOREIGN KEY ("check_id") REFERENCES "public"."check_results"("check_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "input_versions" ADD CONSTRAINT "input_versions_input_id_phase_inputs_input_id_fk" FOREIGN KEY ("input_id") REFERENCES "public"."phase_inputs"("input_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phase_inputs" ADD CONSTRAINT "phase_inputs_project_id_project_state_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_state"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phase_outputs" ADD CONSTRAINT "phase_outputs_project_id_project_state_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_state"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phase_outputs" ADD CONSTRAINT "phase_outputs_artifact_id_artifact_registry_artifact_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifact_registry"("artifact_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "phase_states" ADD CONSTRAINT "phase_states_project_id_project_state_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."project_state"("project_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_source_finding" ON "actions" USING btree ("source_finding_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_blocking" ON "actions" USING btree ("blocking");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_status" ON "actions" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_actions_due_gate" ON "actions" USING btree ("due_gate");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artifact_registry_phase" ON "artifact_registry" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_artifact_registry_type" ON "artifact_registry" USING btree ("artifact_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_history_event_type" ON "audit_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_history_phase" ON "audit_history" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_history_timestamp" ON "audit_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_results_phase" ON "check_results" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_results_type" ON "check_results" USING btree ("check_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_results_status" ON "check_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_check_results_invalidated" ON "check_results" USING btree ("invalidated");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_phase" ON "findings" USING btree ("source_phase");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_severity" ON "findings" USING btree ("severity");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_status" ON "findings" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_seeded" ON "findings" USING btree ("seeded");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gate_decisions_gate" ON "gate_decisions" USING btree ("gate_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gate_decisions_decision" ON "gate_decisions" USING btree ("decision");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "input_versions_input_version_unique" ON "input_versions" USING btree ("input_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_input_versions_single_active" ON "input_versions" USING btree ("input_id") WHERE active = true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_input_versions_input" ON "input_versions" USING btree ("input_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_input_versions_active" ON "input_versions" USING btree ("input_id","active");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "phase_inputs_unique" ON "phase_inputs" USING btree ("project_id","phase_id","input_role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_inputs_project_phase" ON "phase_inputs" USING btree ("project_id","phase_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_outputs_project_phase" ON "phase_outputs" USING btree ("project_id","phase_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "phase_states_project_phase_unique" ON "phase_states" USING btree ("project_id","phase_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_states_project" ON "phase_states" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_states_phase" ON "phase_states" USING btree ("phase_id");