import { z } from "zod";
import { randomUUID } from "node:crypto";
import { db, eq, and, bankConnections, accounts } from "@personal-finance/db";
import { encryptSecret } from "../lib/secrets.js";

const connectBankSchema = z.object({
  institutionName: z.string().min(1).max(100),
  accountsToCreate: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["checking", "savings", "credit_card", "investment", "cash"]).default("checking"),
      initialBalance: z.number().default(0),
    })
  ).optional(),
});

export default async function bankConnectionRoutes(app: any) {
  // Get all bank connections for user
  app.get(
    "/bank-connections",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;
      return await db
        .select({
          id: bankConnections.id,
          institutionName: bankConnections.institutionName,
          status: bankConnections.status,
          lastSyncedAt: bankConnections.lastSyncedAt,
          createdAt: bankConnections.createdAt,
        })
        .from(bankConnections)
        .where(eq(bankConnections.userId, userId));
    }
  );

  // Connect new bank (simulates secure Open Banking / Aggregator flow)
  app.post(
    "/bank-connections",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const { institutionName, accountsToCreate } = connectBankSchema.parse(request.body);

      // Generate secure mock provider token (OAuth / Aggregator Token)
      const providerToken = encryptSecret(`agg_tok_${randomUUID()}`);

      const [connection] = await db
        .insert(bankConnections)
        .values({
          userId,
          institutionName,
          providerToken,
          status: "connected",
          lastSyncedAt: new Date(),
        })
        .returning();

      // Optionally create linked financial accounts under Wealthly accounts
      const createdAccounts = [];
      if (accountsToCreate && accountsToCreate.length > 0) {
        for (const acc of accountsToCreate) {
          const [newAcc] = await db
            .insert(accounts)
            .values({
              userId,
              name: `${institutionName} - ${acc.name}`,
              type: acc.type,
              initialBalance: acc.initialBalance.toString(),
              currency: "INR",
              isActive: true,
            })
            .returning();
          createdAccounts.push(newAcc);
        }
      }

      const publicConnection = {
        id: connection.id,
        institutionName: connection.institutionName,
        status: connection.status,
        lastSyncedAt: connection.lastSyncedAt,
        createdAt: connection.createdAt,
      };

      return reply.code(201).send({
        connection: publicConnection,
        createdAccounts,
        message: "Demo bank connection created. No real bank provider is connected.",
      });
    }
  );

  // Sync transactions & balances
  app.post(
    "/bank-connections/:id/sync",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [connection] = await db
        .select()
        .from(bankConnections)
        .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));

      if (!connection) {
        return reply.code(404).send({ message: "Bank connection not found" });
      }

      // Update last synced time
      const [updated] = await db
        .update(bankConnections)
        .set({
          lastSyncedAt: new Date(),
          status: "connected",
        })
        .where(eq(bankConnections.id, id))
        .returning();

      return reply.send({
        connection: {
          id: updated.id,
          institutionName: updated.institutionName,
          status: updated.status,
          lastSyncedAt: updated.lastSyncedAt,
          createdAt: updated.createdAt,
        },
        syncedTransactionsCount: Math.floor(Math.random() * 3),
        message: "Demo sync completed. No external bank transactions were imported.",
      });
    }
  );

  // Reconnect bank token
  app.post(
    "/bank-connections/:id/reconnect",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [connection] = await db
        .select()
        .from(bankConnections)
        .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));

      if (!connection) {
        return reply.code(404).send({ message: "Bank connection not found" });
      }

      const newToken = encryptSecret(`agg_tok_reauth_${randomUUID()}`);

      const [updated] = await db
        .update(bankConnections)
        .set({
          providerToken: newToken,
          status: "connected",
          lastSyncedAt: new Date(),
        })
        .where(eq(bankConnections.id, id))
        .returning();

      return reply.send({
        connection: {
          id: updated.id,
          institutionName: updated.institutionName,
          status: updated.status,
          lastSyncedAt: updated.lastSyncedAt,
          createdAt: updated.createdAt,
        },
        message: "Demo bank connection token rotated.",
      });
    }
  );

  // Disconnect bank connection
  app.delete(
    "/bank-connections/:id",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [connection] = await db
        .select()
        .from(bankConnections)
        .where(and(eq(bankConnections.id, id), eq(bankConnections.userId, userId)));

      if (!connection) {
        return reply.code(404).send({ message: "Bank connection not found" });
      }

      await db.delete(bankConnections).where(eq(bankConnections.id, id));

      return reply.send({ message: "Bank disconnected successfully." });
    }
  );
}
