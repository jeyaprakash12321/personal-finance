import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";

import dbPlugin from "./plugins/db.js";
import authPlugin from "./plugins/auth.js";

import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/accounts.js";
import transactionRoutes from "./routes/transactions.js";
import categoryRoutes from "./routes/categories.js";
import goalRoutes from "./routes/goals.js";
import goalContributionRoutes from "./routes/goal-contributions.js";
import dashboardRoutes from "./routes/dashboard.js";
import budgetRoutes from "./routes/budgets.js";

const app = Fastify({
  logger: true,
});

await app.register(cors, {
  origin: "http://localhost:3000",
});

await app.register(dbPlugin);
await app.register(authPlugin);

await app.register(authRoutes);
await app.register(accountRoutes);
await app.register(transactionRoutes);
await app.register(categoryRoutes);
await app.register(goalRoutes);
await app.register(goalContributionRoutes);
await app.register(dashboardRoutes);
await app.register(budgetRoutes);

app.get("/health", async () => {
  return {
    status: "ok",
    service: "personal-finance-api",
  };
});

app.get("/test-db", async () => {
  const result = await app.db.execute(
    "SELECT current_database() as database"
  );

  return result;
});

const port = Number(
  process.env.PORT ?? 4000
);

console.log(
  `Starting API on port ${port}...`
);

try {
  await app.listen({
    port,
    host: "0.0.0.0",
  });

  console.log(
    `API running at http://localhost:${port}`
  );
} catch (error) {
  console.error(
    "Failed to start API:",
    error
  );

  process.exit(1);
}