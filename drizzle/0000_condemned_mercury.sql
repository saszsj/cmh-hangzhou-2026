CREATE TABLE "generated_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"spec" jsonb NOT NULL,
	"markdown" text,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "generated_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text NOT NULL,
	"pain" text NOT NULL,
	"slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "generated_pages_slug_idx" ON "generated_pages" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "generated_pages_updated_at_idx" ON "generated_pages" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "submissions_slug_idx" ON "submissions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");