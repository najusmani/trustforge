CREATE TABLE "usage_event" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text,
	"job_id" text,
	"cost_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "actor_id" text;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "billed_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "budget_cents" integer;--> statement-breakpoint
ALTER TABLE "job" ADD COLUMN "cost_open" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "limit_daily_cents" integer;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "limit_weekly_cents" integer;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "limit_monthly_cents" integer;--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_event" ADD CONSTRAINT "usage_event_job_id_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "usage_event_member_idx" ON "usage_event" USING btree ("team_id","user_id","created_at");--> statement-breakpoint
ALTER TABLE "job" ADD CONSTRAINT "job_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_actor_open_idx" ON "job" USING btree ("actor_id","cost_open");