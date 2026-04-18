import { defineConfig } from "drizzle-kit";

import { withPgSslModeExplicit } from "./src/db/pgConnectionString";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: withPgSslModeExplicit(process.env.DATABASE_URL ?? ""),
  },
});

