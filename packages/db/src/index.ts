import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, gte, sql } from "drizzle-orm";

import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema,
});

export {
  users,
  accounts,
  transactions,
  categories,
  goals,
  goalContributions,
  budgets,
} from "./schema.js";

export {
  and,
  eq,
  gte,
  sql,
} from "drizzle-orm";