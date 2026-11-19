CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."exam_session_status" AS ENUM('scheduled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."paper_status" AS ENUM('draft', 'final');--> statement-breakpoint
CREATE TYPE "public"."question_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."question_status" AS ENUM('draft', 'review', 'approved', 'retired');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('single', 'multiple', 'true_false', 'numeric', 'short');--> statement-breakpoint
CREATE SEQUENCE "public"."paper_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1001 CACHE 1;--> statement-breakpoint
CREATE SEQUENCE "public"."question_code_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 100001 CACHE 1;--> statement-breakpoint
CREATE TABLE "attempt_answers" (
	"attempt_id" uuid NOT NULL,
	"paper_question_id" uuid NOT NULL,
	"response" jsonb NOT NULL,
	"flagged" boolean DEFAULT false NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	"correct" boolean,
	"marks_awarded" numeric(6, 2),
	CONSTRAINT "attempt_answers_attempt_id_paper_question_id_pk" PRIMARY KEY("attempt_id","paper_question_id")
);
--> statement-breakpoint
CREATE TABLE "exam_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"paper_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"question_order" jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL,
	"submitted_at" timestamp with time zone,
	"submitted_reason" varchar(12),
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"score" numeric(8, 2),
	"max_score" integer NOT NULL,
	"correct_count" integer,
	"focus_lost" integer DEFAULT 0 NOT NULL,
	"last_saved_at" timestamp with time zone,
	"ip" "inet",
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "exam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"status" "exam_session_status" DEFAULT 'scheduled' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_sessions_window_check" CHECK ("exam_sessions"."opens_at" < "exam_sessions"."closes_at")
);
--> statement-breakpoint
CREATE TABLE "manual_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" uuid NOT NULL,
	"method" varchar(16) NOT NULL,
	"reference" varchar(80) NOT NULL,
	"amount_pkr" integer NOT NULL,
	"received_on" date NOT NULL,
	"recorded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paper_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paper_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"question_id" uuid NOT NULL,
	"question_version" integer NOT NULL,
	"snapshot" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "papers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(20) NOT NULL,
	"competition_id" uuid NOT NULL,
	"title" varchar(160) NOT NULL,
	"grade_from" smallint NOT NULL,
	"grade_to" smallint NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"instructions" text,
	"negative_percent" smallint DEFAULT 0 NOT NULL,
	"shuffle_questions" boolean DEFAULT true NOT NULL,
	"shuffle_options" boolean DEFAULT true NOT NULL,
	"print_sets" smallint DEFAULT 1 NOT NULL,
	"blueprint" jsonb NOT NULL,
	"seed" integer NOT NULL,
	"total_marks" integer DEFAULT 0 NOT NULL,
	"status" "paper_status" DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"finalised_by" uuid,
	"finalised_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "papers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "question_versions" (
	"question_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "question_versions_question_id_version_pk" PRIMARY KEY("question_id","version")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(16) NOT NULL,
	"competition_id" uuid NOT NULL,
	"grade_from" smallint NOT NULL,
	"grade_to" smallint NOT NULL,
	"level" smallint DEFAULT 1 NOT NULL,
	"type" "question_type" NOT NULL,
	"stem" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"explanation" text,
	"topic" varchar(80) NOT NULL,
	"difficulty" "question_difficulty" NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"marks" smallint DEFAULT 1 NOT NULL,
	"status" "question_status" DEFAULT 'draft' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"source" varchar(12) DEFAULT 'manual' NOT NULL,
	"review_note" text,
	"created_by" uuid,
	"updated_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "questions_code_unique" UNIQUE("code"),
	CONSTRAINT "questions_grades_check" CHECK ("questions"."grade_from" <= "questions"."grade_to")
);
--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_exam_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."exam_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attempt_answers" ADD CONSTRAINT "attempt_answers_paper_question_id_paper_questions_id_fk" FOREIGN KEY ("paper_question_id") REFERENCES "public"."paper_questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_session_id_exam_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."exam_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_payments" ADD CONSTRAINT "manual_payments_registration_id_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_payments" ADD CONSTRAINT "manual_payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_questions" ADD CONSTRAINT "paper_questions_paper_id_papers_id_fk" FOREIGN KEY ("paper_id") REFERENCES "public"."papers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paper_questions" ADD CONSTRAINT "paper_questions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "papers" ADD CONSTRAINT "papers_finalised_by_users_id_fk" FOREIGN KEY ("finalised_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_versions" ADD CONSTRAINT "question_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "exam_attempts_student_idx" ON "exam_attempts" USING btree ("competition_id","student_id");--> statement-breakpoint
CREATE INDEX "exam_attempts_session_idx" ON "exam_attempts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "exam_sessions_competition_idx" ON "exam_sessions" USING btree ("competition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "paper_questions_unique_idx" ON "paper_questions" USING btree ("paper_id","question_id");--> statement-breakpoint
CREATE INDEX "paper_questions_paper_idx" ON "paper_questions" USING btree ("paper_id","position");--> statement-breakpoint
CREATE INDEX "questions_pick_idx" ON "questions" USING btree ("competition_id","status","level");