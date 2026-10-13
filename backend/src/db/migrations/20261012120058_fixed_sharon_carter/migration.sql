CREATE TYPE "report_history_kind" AS ENUM('created', 'status', 'edited');--> statement-breakpoint
CREATE TYPE "report_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "report_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"report_id" uuid NOT NULL,
	"kind" "report_history_kind" NOT NULL,
	"from_status" "report_status",
	"to_status" "report_status" NOT NULL,
	"actor_id" uuid NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"changes" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"number" integer UNIQUE GENERATED ALWAYS AS IDENTITY (sequence name "reports_number_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1001 CACHE 1),
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"status" "report_status" DEFAULT 'pending'::"report_status" NOT NULL,
	"created_by" uuid NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "report_history_report_id_idx" ON "report_history" ("report_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" ("status");--> statement-breakpoint
CREATE INDEX "reports_created_by_idx" ON "reports" ("created_by");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" ("created_at");--> statement-breakpoint
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_report_id_reports_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;