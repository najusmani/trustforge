ALTER TABLE "team" ADD COLUMN "paddle_customer_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "paddle_subscription_id" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "subscription_status" text;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "current_period_end" timestamp;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "billing_updated_at" timestamp;