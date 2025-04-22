CREATE TABLE IF NOT EXISTS "MCP" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" varchar DEFAULT 'sse' NOT NULL,
	"url" text NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"capabilities" json
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "MCP" ADD CONSTRAINT "MCP_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
