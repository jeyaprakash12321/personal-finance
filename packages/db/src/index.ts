import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, gte, lte, sql } from "drizzle-orm";

import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const client = postgres(connectionString);

export const db = drizzle(client, {
  schema,
});

export async function closeDb() {
  await client.end({ timeout: 1 });
}

export {
  users,
  accounts,
  transactions,
  categories,
  goals,
  goalContributions,
  budgets,
  userPreferences,
  themeEnum,
  accentEnum,
  creditCards,
  cardStatusEnum,
  loans,
  loanTypeEnum,
  insurancePolicies,
  policyTypeEnum,
  bankConnections,
  connectionStatusEnum,
  portfolioHoldings,
  assetTypeEnum,
  netWorthSnapshots,
  recurringTransactions,
  recurringFrequencyEnum,
} from "./schema.js";

export {
  and,
  eq,
  gte,
  lte,
  sql,
} from "drizzle-orm";
