CREATE TABLE "placement_interviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "placement_interviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"student_id" integer NOT NULL,
	"interviewed_on" date NOT NULL,
	"scores" jsonb NOT NULL,
	"oral_level" text NOT NULL,
	"final_level" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "placement_interviews_studentId_unique" UNIQUE("student_id")
);
--> statement-breakpoint
ALTER TABLE "placement_interviews" ADD CONSTRAINT "placement_interviews_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;