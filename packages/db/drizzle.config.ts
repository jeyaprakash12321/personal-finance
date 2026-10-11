import { defineConfig } from "drizzle-kit";

// DATABASE_URL is injected by Render in production.
// Locally it comes from apps/api/.env via dotenv.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://finance:finance@localhost:5433/personal_finance";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
