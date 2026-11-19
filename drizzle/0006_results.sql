CREATE TYPE "public"."dispatch_status" AS ENUM('pending', 'packed', 'dispatched', 'delivered');--> statement-breakpoint
CREATE TYPE "public"."result_set_status" AS ENUM('draft', 'approved', 'published', 'withdrawn');--> statement-breakpoint
CREATE SEQUENCE "public"."certificate_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100001 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."roll_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100001 CACHE 1;--> statement-breakpoint
CREATE TABLE "award_dispatches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_set_id" uuid NOT NULL,
	"school_id" uuid,
	"guardian_user_id" uuid,
	"items" jsonb NOT NULL,
	"status" "dispatch_status" DEFAULT 'pending' NOT NULL,
	"address" text,
	"courier" varchar(60),
	"tracking" varchar(80),
	"dispatched_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificate_templates" (
	"competition_id" uuid PRIMARY KEY NOT NULL,
	"heading" varchar(80) NOT NULL,
	"body" text NOT NULL,
	"signatories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"serial" varchar(24) NOT NULL,
	"verify_code" varchar(16) NOT NULL,
	"result_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"student_name" varchar(130) NOT NULL,
	"school_name" varchar(200),
	"grade" smallint NOT NULL,
	"award" varchar(24) NOT NULL,
	"award_label" varchar(60) NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"revoked_by" uuid,
	CONSTRAINT "certificates_serial_unique" UNIQUE("serial"),
	CONSTRAINT "certificates_verify_code_unique" UNIQUE("verify_code"),
	CONSTRAINT "certificates_result_id_unique" UNIQUE("result_id")
);
--> statement-breakpoint
CREATE TABLE "paper_scripts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_item_id" uuid NOT NULL,
	"paper_id" uuid NOT NULL,
	"set_letter" varchar(1) NOT NULL,
	"absent" boolean DEFAULT false NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score" numeric(8, 2) DEFAULT '0' NOT NULL,
	"max_score" integer NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"answered_count" integer DEFAULT 0 NOT NULL,
	"entered_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "paper_scripts_registration_item_id_unique" UNIQUE("registration_item_id")
);
--> statement-breakpoint
CREATE TABLE "result_sets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"status" "result_set_status" DEFAULT 'draft' NOT NULL,
	"award_rules" jsonb NOT NULL,
	"result_count" integer DEFAULT 0 NOT NULL,
	"absent_count" integer DEFAULT 0 NOT NULL,
	"calculated_by" uuid,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"publish_at" timestamp with time zone,
	"published_by" uuid,
	"withdrawn_reason" text,
	"withdrawn_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_set_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"registration_item_id" uuid NOT NULL,
	"school_id" uuid,
	"grade" smallint NOT NULL,
	"source" varchar(8) NOT NULL,
	"absent" boolean DEFAULT false NOT NULL,
	"score" numeric(8, 2),
	"max_score" integer,
	"percent" numeric(5, 2),
	"correct_count" integer,
	"answered_count" integer,
	"time_taken_seconds" integer,
	"rank" integer,
	"cohort_size" integer,
	"rank_in_school" integer,
	"school_cohort_size" integer,
	"award" varchar(24),
	"award_label" varchar(60)
);
--> statement-breakpoint
ALTER TABLE "registration_items" ADD COLUMN "roll_number" varchar(24);--> statement-breakpoint
ALTER TABLE "award_dispatches" ADD CONSTRAINT "award_dispatches_result_set_id_result_sets_id_fk" FOREIGN KEY ("result_set_id") REFERENCES "public"."result_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_dispatches" ADD CONSTRAINT "award_dispatches_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_dispatches" ADD CONSTRAINT "award_dispatches_guardian_user_id_users_id_fk" FOREIGN KEY ("guardian_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_dispatches" ADD CONSTRAINT "award_dispatches_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_result_id_results_id_fk" FOREIGN KEY ("result_id") REFERENCES "public"."results"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_scripts" ADD CONSTRAINT "paper_scripts_registration_item_id_registration_items_id_fk" FOREIGN KEY ("registration_item_id") REFERENCES "public"."registration_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_scripts" ADD CONSTRAINT "paper_scripts_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_scripts" ADD CONSTRAINT "paper_scripts_entered_by_users_id_fk" FOREIGN KEY ("entered_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_sets" ADD CONSTRAINT "result_sets_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_sets" ADD CONSTRAINT "result_sets_calculated_by_users_id_fk" FOREIGN KEY ("calculated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_sets" ADD CONSTRAINT "result_sets_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_sets" ADD CONSTRAINT "result_sets_published_by_users_id_fk" FOREIGN KEY ("published_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "result_sets" ADD CONSTRAINT "result_sets_withdrawn_by_users_id_fk" FOREIGN KEY ("withdrawn_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_result_set_id_result_sets_id_fk" FOREIGN KEY ("result_set_id") REFERENCES "public"."result_sets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_registration_item_id_registration_items_id_fk" FOREIGN KEY ("registration_item_id") REFERENCES "public"."registration_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "award_dispatches_set_idx" ON "award_dispatches" USING btree ("result_set_id");--> statement-breakpoint
CREATE INDEX "certificates_student_idx" ON "certificates" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "result_sets_competition_idx" ON "result_sets" USING btree ("competition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "result_sets_live_idx" ON "result_sets" USING btree ("competition_id") WHERE "result_sets"."status" <> 'withdrawn';--> statement-breakpoint
CREATE UNIQUE INDEX "results_set_student_idx" ON "results" USING btree ("result_set_id","student_id");--> statement-breakpoint
CREATE INDEX "results_student_idx" ON "results" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "results_school_idx" ON "results" USING btree ("result_set_id","school_id");--> statement-breakpoint
ALTER TABLE "registration_items" ADD CONSTRAINT "registration_items_roll_number_unique" UNIQUE("roll_number");