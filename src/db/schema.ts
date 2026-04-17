import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { DemoSpec } from "@/lib/demoSpec";

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    industry: text("industry").notNull(),
    pain: text("pain").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("submissions_slug_idx").on(t.slug),
    createdAtIdx: index("submissions_created_at_idx").on(t.createdAt),
  }),
);

export type { DemoSpec } from "@/lib/demoSpec";

export const generatedPages = pgTable(
  "generated_pages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    spec: jsonb("spec").$type<DemoSpec>().notNull(),
    markdown: text("markdown"),
    model: text("model"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("generated_pages_slug_idx").on(t.slug),
    updatedAtIdx: index("generated_pages_updated_at_idx").on(t.updatedAt),
  }),
);

