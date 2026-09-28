import { z } from "zod";
import { db, eq, and, recurringTransactions, transactions, accounts, categories } from "@personal-finance/db";

const createRecurringSchema = z.object({
  accountId: z.string().uuid(),
  title: z.string().min(1).max(100),
  amount: z.number().positive(),
  type: z.enum(["income", "expense"]).default("expense"),
  category: z.string().default("Subscriptions"),
  frequency: z.enum(["weekly", "monthly", "annual"]).default("monthly"),
  nextDate: z.string().datetime(),
});

const updateRecurringSchema = z.object({
  accountId: z.string().uuid().optional(),
  title: z.string().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  category: z.string().min(1).max(100).optional(),
  frequency: z.enum(["weekly", "monthly", "annual"]).optional(),
  nextDate: z.string().datetime().optional(),
});

export default async function recurringRoutes(app: any) {
  app.get(
    "/recurring",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;
      return await db
        .select()
        .from(recurringTransactions)
        .where(eq(recurringTransactions.userId, userId));
    }
  );

  app.post(
    "/recurring",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const body = createRecurringSchema.parse(request.body);

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)));

      if (!account) {
        return reply.code(404).send({ message: "Account not found or unauthorized" });
      }

      const [item] = await db
        .insert(recurringTransactions)
        .values({
          userId,
          accountId: body.accountId,
          title: body.title,
          amount: body.amount.toString(),
          type: body.type,
          category: body.category,
          frequency: body.frequency,
          nextDate: new Date(body.nextDate),
        })
        .returning();

      return reply.code(201).send(item);
    }
  );

  app.put(
    "/recurring/:id",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const body = updateRecurringSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(recurringTransactions)
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Recurring rule not found" });
      }

      if (body.accountId) {
        const [account] = await db
          .select({ id: accounts.id })
          .from(accounts)
          .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)));

        if (!account) {
          return reply.code(404).send({ message: "Account not found or unauthorized" });
        }
      }

      const [updated] = await db
        .update(recurringTransactions)
        .set({
          accountId: body.accountId ?? existing.accountId,
          title: body.title ?? existing.title,
          amount: body.amount ? body.amount.toString() : existing.amount,
          type: body.type ?? existing.type,
          category: body.category ?? existing.category,
          frequency: body.frequency ?? existing.frequency,
          nextDate: body.nextDate ? new Date(body.nextDate) : existing.nextDate,
        })
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );

  app.delete(
    "/recurring/:id",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(recurringTransactions)
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Recurring rule not found" });
      }

      await db
        .delete(recurringTransactions)
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

      return reply.send({ message: "Recurring rule deleted successfully" });
    }
  );

  // Manually trigger execution of a recurring rule
  app.post(
    "/recurring/:id/execute",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(recurringTransactions)
        .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Recurring rule not found" });
      }

      const [account] = await db
        .select({ id: accounts.id })
        .from(accounts)
        .where(and(eq(accounts.id, existing.accountId), eq(accounts.userId, userId)));

      if (!account) {
        return reply.code(400).send({ message: "Recurring rule account is not owned by the authenticated user" });
      }

      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.name, existing.category)));

      if (!category || category.type !== existing.type) {
        return reply.code(400).send({
          message: "The recurring rule category must exist and match its transaction type.",
        });
      }

      // 1. Post transaction
      const [tx] = await db
        .insert(transactions)
        .values({
          userId,
          accountId: existing.accountId,
          amount: existing.amount,
          categoryId: category.id,
          type: existing.type as "income" | "expense",
          description: `[Recurring] ${existing.title}`,
          transactionDate: new Date(),
        })
        .returning();

      // 2. Advance nextDate
      const nextDate = new Date(existing.nextDate);
      if (existing.frequency === "weekly") nextDate.setDate(nextDate.getDate() + 7);
      else if (existing.frequency === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
      else if (existing.frequency === "annual") nextDate.setFullYear(nextDate.getFullYear() + 1);

      await db
        .update(recurringTransactions)
        .set({ nextDate })
        .where(eq(recurringTransactions.id, id));

      return reply.send({
        transaction: tx,
        message: `Recurring payment for '${existing.title}' processed successfully!`,
      });
    }
  );
}
