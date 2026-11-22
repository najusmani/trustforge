CREATE TABLE "usage_topup" (
	"id" text PRIMARY KEY NOT NULL,
	"team_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"paid_cents" integer NOT NULL,
	"credit_cents" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "usage_event" ADD COLUMN "topup_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_topup" ADD CONSTRAINT "usage_topup_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "usage_topup_txn_idx" ON "usage_topup" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "usage_topup_team_idx" ON "usage_topup" USING btree ("team_id");