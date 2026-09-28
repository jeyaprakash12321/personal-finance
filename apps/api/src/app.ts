import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import { z } from "zod";

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
import preferenceRoutes from "./routes/preferences.js";
import creditCardRoutes from "./routes/credit-cards.js";
import loanRoutes from "./routes/loans.js";
import insuranceRoutes from "./routes/insurance.js";
import exportRoutes from "./routes/export.js";
import importRoutes from "./routes/import.js";
import bankConnectionRoutes from "./routes/bank-connections.js";
import portfolioRoutes from "./routes/portfolio.js";
import netWorthRoutes from "./routes/net-worth.js";
import intelligenceRoutes from "./routes/intelligence.js";
import recurringRoutes from "./routes/recurring.js";
import notificationRoutes from "./routes/notifications.js";

export async function buildApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: process.env.CORS_ORIGIN || "http://localhost:3000" });
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Wealthly API",
        description: "Personal finance API for accounts, transactions, goals, budgets, and financial planning.",
        version: "1.0.0",
      },
      servers: [{ url: `http://localhost:${process.env.PORT ?? 4000}` }],
      tags: [
        { name: "Authentication", description: "Register, login, and current-user endpoints" },
        { name: "Finance", description: "User-owned financial data endpoints" },
        { name: "System", description: "Health and API metadata" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
    },
  });
  await app.register(dbPlugin);
  await app.register(authPlugin);

  app.setErrorHandler((error, _request, reply) => {
    const isZodError = error instanceof z.ZodError || (
      typeof error === "object" &&
      error !== null &&
      "name" in error &&
      error.name === "ZodError" &&
      "issues" in error
    );
    if (isZodError) {
      const issues = error instanceof z.ZodError
        ? error.issues
        : (error as { issues: z.ZodIssue[] }).issues;
      return reply.code(400).send({
        message: "Invalid request data",
        issues: issues.map((issue) => ({ path: issue.path, message: issue.message })),
      });
    }
    app.log.error(error);
    const message = process.env.NODE_ENV !== "production" && error instanceof Error
      ? `Internal server error: ${error.message}`
      : "Internal server error";
    return reply.code(500).send({ message });
  });

  await app.register(authRoutes);
  await app.register(accountRoutes);
  await app.register(transactionRoutes);
  await app.register(categoryRoutes);
  await app.register(goalRoutes);
  await app.register(goalContributionRoutes);
  await app.register(dashboardRoutes);
  await app.register(budgetRoutes);
  await app.register(preferenceRoutes);
  await app.register(creditCardRoutes);
  await app.register(loanRoutes);
  await app.register(insuranceRoutes);
  await app.register(exportRoutes);
  await app.register(importRoutes);
  await app.register(bankConnectionRoutes);
  await app.register(portfolioRoutes);
  await app.register(netWorthRoutes);
  await app.register(intelligenceRoutes);
  await app.register(recurringRoutes);
  await app.register(notificationRoutes);

  app.get("/health", async () => ({ status: "ok", service: "personal-finance-api" }));
  app.get("/openapi.json", { schema: { hide: true } }, async () => app.swagger());
  app.get("/docs", { schema: { hide: true } }, async (_request, reply) => {
    reply.type("text/html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Wealthly API Docs</title><link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"></head>
<body><div id="swagger-ui"></div><script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script>window.onload=()=>SwaggerUIBundle({url:'/openapi.json',dom_id:'#swagger-ui',deepLinking:true,presets:[SwaggerUIBundle.presets.apis,SwaggerUIBundle.SwaggerUIStandalonePreset]})</script>
</body></html>`);
  });
  return app;
}
