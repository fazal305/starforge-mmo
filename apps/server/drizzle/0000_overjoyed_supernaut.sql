CREATE TABLE IF NOT EXISTS "battle_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"battle_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"message" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "battles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attacker_fleet_id" uuid NOT NULL,
	"defender_fleet_id" uuid NOT NULL,
	"winner_empire_id" uuid,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"colony_id" uuid NOT NULL,
	"type" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"construction_completes_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"channel" text NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "colonies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empire_id" uuid NOT NULL,
	"planet_id" text NOT NULL,
	"founded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "empires" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"faction" text NOT NULL,
	"credits" bigint DEFAULT 1000 NOT NULL,
	"minerals" bigint DEFAULT 500 NOT NULL,
	"energy" bigint DEFAULT 500 NOT NULL,
	"research_points" bigint DEFAULT 0 NOT NULL,
	"population" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"target_system_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fleets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empire_id" uuid NOT NULL,
	"position_x" real NOT NULL,
	"position_y" real NOT NULL,
	"destination_x" real,
	"destination_y" real,
	"departed_at" timestamp with time zone,
	"eta_ms" bigint,
	"status" text DEFAULT 'IDLE' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research" (
	"id" text PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"name" text NOT NULL,
	"cost_research_points" integer NOT NULL,
	"prerequisite_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "research_progress" (
	"empire_id" uuid NOT NULL,
	"technology_id" text NOT NULL,
	"unlocked_at" timestamp with time zone,
	"progress_points" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "research_progress_empire_id_technology_id_pk" PRIMARY KEY("empire_id","technology_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fleet_id" uuid NOT NULL,
	"hull_type" text NOT NULL,
	"count" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "system_states" (
	"system_id" text PRIMARY KEY NOT NULL,
	"owner_empire_id" uuid,
	"discovery_state" text DEFAULT 'UNKNOWN' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "battle_logs" ADD CONSTRAINT "battle_logs_battle_id_battles_id_fk" FOREIGN KEY ("battle_id") REFERENCES "public"."battles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "buildings" ADD CONSTRAINT "buildings_colony_id_colonies_id_fk" FOREIGN KEY ("colony_id") REFERENCES "public"."colonies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "colonies" ADD CONSTRAINT "colonies_empire_id_empires_id_fk" FOREIGN KEY ("empire_id") REFERENCES "public"."empires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "empires" ADD CONSTRAINT "empires_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fleets" ADD CONSTRAINT "fleets_empire_id_empires_id_fk" FOREIGN KEY ("empire_id") REFERENCES "public"."empires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_progress" ADD CONSTRAINT "research_progress_empire_id_empires_id_fk" FOREIGN KEY ("empire_id") REFERENCES "public"."empires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "research_progress" ADD CONSTRAINT "research_progress_technology_id_research_id_fk" FOREIGN KEY ("technology_id") REFERENCES "public"."research"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ships" ADD CONSTRAINT "ships_fleet_id_fleets_id_fk" FOREIGN KEY ("fleet_id") REFERENCES "public"."fleets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "system_states" ADD CONSTRAINT "system_states_owner_empire_id_empires_id_fk" FOREIGN KEY ("owner_empire_id") REFERENCES "public"."empires"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
