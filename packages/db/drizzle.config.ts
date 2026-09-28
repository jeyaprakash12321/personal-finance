import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "drizzle-kit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const apiEnvPath = resolve(
  __dirname,
  "../../apps/api/.env"
);

config({
  path: apiEnvPath,
  override: true,
});

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