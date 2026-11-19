CREATE TABLE "student_guardians" (
	"student_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"relationship" varchar(20) DEFAULT 'parent' NOT NULL,
	"linked_via" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_guardians_student_id_user_id_pk" PRIMARY KEY("student_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "registrations" ALTER COLUMN "school_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "school_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "guardian_user_id" uuid;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "school_name" varchar(200);--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "added_by_guardian" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(24);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "student_id" uuid;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_guardians" ADD CONSTRAINT "student_guardians_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "student_guardians_user_idx" ON "student_guardians" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_guardian_user_id_users_id_fk" FOREIGN KEY ("guardian_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_added_by_guardian_users_id_fk" FOREIGN KEY ("added_by_guardian") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "registrations_guardian_idx" ON "registrations" USING btree ("guardian_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "students_individual_dedupe_idx" ON "students" USING btree ("added_by_guardian",lower("first_name"),lower("last_name"),"date_of_birth") WHERE "students"."school_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "users_student_idx" ON "users" USING btree ("student_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_payer_check" CHECK (("registrations"."school_id" is null) <> ("registrations"."guardian_user_id" is null));