CREATE TYPE "public"."competition_kind" AS ENUM('olympiad', 'activity');--> statement-breakpoint
CREATE TYPE "public"."competition_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('pending_payment', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE SEQUENCE "public"."registration_ref_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100001 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."school_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 101 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."student_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100001 CACHE 1;--> statement-breakpoint
CREATE TABLE "bulk_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"uploaded_by" uuid,
	"file_name" varchar(200) NOT NULL,
	"status" varchar(16) DEFAULT 'previewed' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"duplicate_rows" integer DEFAULT 0 NOT NULL,
	"imported_rows" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(120) NOT NULL,
	"code" varchar(8) NOT NULL,
	"kind" "competition_kind" DEFAULT 'olympiad' NOT NULL,
	"accent" varchar(12) DEFAULT 'blue' NOT NULL,
	"icon" varchar(16) DEFAULT 'book' NOT NULL,
	"summary" varchar(240) DEFAULT '' NOT NULL,
	"grade_from" smallint,
	"grade_to" smallint,
	"modes" text[] DEFAULT ARRAY['online','paper']::text[] NOT NULL,
	"levels" smallint DEFAULT 1 NOT NULL,
	"duration_minutes" smallint,
	"fee_pkr" integer,
	"registration_closes" date,
	"exam_date" date,
	"status" "competition_status" DEFAULT 'draft' NOT NULL,
	"sort_order" smallint DEFAULT 0 NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competitions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "competitions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "import_rows" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"import_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"data" jsonb NOT NULL,
	"errors" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" varchar(12) NOT NULL,
	"student_id" uuid
);
--> statement-breakpoint
CREATE TABLE "registration_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"grade" smallint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(24) NOT NULL,
	"school_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"mode" varchar(8) NOT NULL,
	"status" "registration_status" DEFAULT 'pending_payment' NOT NULL,
	"fee_pkr" integer NOT NULL,
	"student_count" integer NOT NULL,
	"total_pkr" integer NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "registrations_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"campus_id" uuid,
	"code" varchar(16) NOT NULL,
	"first_name" varchar(60) NOT NULL,
	"last_name" varchar(60) NOT NULL,
	"gender" varchar(8),
	"date_of_birth" date NOT NULL,
	"grade" smallint NOT NULL,
	"section" varchar(20),
	"guardian_name" varchar(120) NOT NULL,
	"guardian_phone" varchar(20) NOT NULL,
	"guardian_email" varchar(254),
	"archived" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "students_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "bulk_imports" ADD CONSTRAINT "bulk_imports_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bulk_imports" ADD CONSTRAINT "bulk_imports_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_import_id_bulk_imports_id_fk" FOREIGN KEY ("import_id") REFERENCES "public"."bulk_imports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_rows" ADD CONSTRAINT "import_rows_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_items" ADD CONSTRAINT "registration_items_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_items" ADD CONSTRAINT "registration_items_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_items" ADD CONSTRAINT "registration_items_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitions_status_idx" ON "competitions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_rows_import_idx" ON "import_rows" USING btree ("import_id","row_number");--> statement-breakpoint
CREATE UNIQUE INDEX "registration_items_unique_idx" ON "registration_items" USING btree ("competition_id","student_id");--> statement-breakpoint
CREATE INDEX "registrations_school_idx" ON "registrations" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "registrations_competition_idx" ON "registrations" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "students_school_grade_idx" ON "students" USING btree ("school_id","grade");--> statement-breakpoint
CREATE UNIQUE INDEX "students_dedupe_idx" ON "students" USING btree ("school_id",lower("first_name"),lower("last_name"),"date_of_birth");