ALTER TABLE "homework" ADD COLUMN "time_limit_minutes" integer;--> statement-breakpoint
ALTER TABLE "homework_assignments" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "homework" ADD CONSTRAINT "homework_time_limit_range" CHECK ("homework"."time_limit_minutes" is null or "homework"."time_limit_minutes" between 1 and 600);