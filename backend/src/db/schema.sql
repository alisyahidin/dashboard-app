CREATE TYPE "report_history_kind" AS ENUM('created', 'status', 'edited');
CREATE TYPE "report_status" AS ENUM('pending', 'approved', 'rejected');
CREATE TABLE "invites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE,
  "token" varchar(64) NOT NULL UNIQUE,
  "invited_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "used_at" timestamp with time zone
);

CREATE TABLE "permissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "name" varchar(100) NOT NULL UNIQUE,
  "description" text
);

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

CREATE TABLE "role_permissions" (
  "role_id" uuid,
  "permission_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY("role_id","permission_id")
);

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "name" varchar(50) NOT NULL UNIQUE,
  "description" text
);

CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "user_id" uuid NOT NULL,
  "ip_address" varchar(45),
  "user_agent" text,
  "expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone,
  "deleted_at" timestamp with time zone,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "passwordHash" text,
  "role_id" uuid
);

CREATE INDEX "report_history_report_id_idx" ON "report_history" ("report_id");
CREATE INDEX "reports_status_idx" ON "reports" ("status");
CREATE INDEX "reports_created_by_idx" ON "reports" ("created_by");
CREATE INDEX "reports_created_at_idx" ON "reports" ("created_at");
CREATE INDEX "sessions_user_id_idx" ON "sessions" ("user_id");
CREATE INDEX "users_role_id_idx" ON "users" ("role_id");
ALTER TABLE "invites" ADD CONSTRAINT "invites_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "invites" ADD CONSTRAINT "invites_invited_by_users_id_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETESET NULL;
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_report_id_reports_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE;
ALTER TABLE "report_history" ADD CONSTRAINT "report_history_actor_id_users_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id")ON DELETE RESTRICT;
ALTER TABLE "reports" ADD CONSTRAINT "reports_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETERESTRICT;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;