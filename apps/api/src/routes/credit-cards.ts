import { z } from "zod";
import { db, eq, and, creditCards, accounts } from "@personal-finance/db";

const createCardSchema = z.object({
  cardName: z.string().min(1).max(100),
  bankIssuer: z.string().min(1).max(100),
  cardType: z.string().default("Visa"),
  last4: z.string().length(4),
  creditLimit: z.number().positive(),
  currentOutstanding: z.number().nonnegative().default(0),
  statementDate: z.string().max(2).default("1"),
  paymentDueDate: z.string().max(2).default("15"),
  interestRate: z.number().nonnegative().default(18.5),
  annualFee: z.number().nonnegative().default(0),
});

const updateCardSchema = z.object({
  cardName: z.string().min(1).max(100).optional(),
  bankIssuer: z.string().min(1).max(100).optional(),
  cardType: z.string().optional(),
  last4: z.string().length(4).optional(),
  creditLimit: z.number().positive().optional(),
  currentOutstanding: z.number().nonnegative().optional(),
  statementDate: z.string().max(2).optional(),
  paymentDueDate: z.string().max(2).optional(),
  interestRate: z.number().nonnegative().optional(),
  annualFee: z.number().nonnegative().optional(),
  cardStatus: z.enum(["active", "inactive", "blocked"]).optional(),
});

const recordPaymentSchema = z.object({
  amount: z.number().positive(),
});

export default async function creditCardRoutes(app: any) {
  app.get(
    "/credit-cards",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;
      const cards = await db
        .select()
        .from(creditCards)
        .where(eq(creditCards.userId, userId));

      const today = new Date();
      const currentDay = today.getDate();

      return cards.map((card) => {
        const limit = Number(card.creditLimit);
        const outstanding = Number(card.currentOutstanding);
        const available = Math.max(0, limit - outstanding);
        const utilization = limit > 0 ? (outstanding / limit) * 100 : 0;

        const dueDay = Number(card.paymentDueDate) || 15;
        let daysUntilDue = dueDay - currentDay;
        if (daysUntilDue < 0) {
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          daysUntilDue += daysInMonth;
        }

        return {
          ...card,
          availableCredit: available,
          utilizationPercentage: Number(utilization.toFixed(1)),
          daysUntilDue,
        };
      });
    }
  );

  app.post(
    "/credit-cards",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const body = createCardSchema.parse(request.body);

      const [ledgerAccount] = await db
        .insert(accounts)
        .values({
          userId,
          name: `${body.cardName} · Credit Card`,
          type: "credit_card",
          currency: "INR",
          initialBalance: "0",
        })
        .returning({ id: accounts.id });

      const [card] = await db
        .insert(creditCards)
        .values({
          userId,
          accountId: ledgerAccount.id,
          cardName: body.cardName,
          bankIssuer: body.bankIssuer,
          cardType: body.cardType,
          last4: body.last4,
          creditLimit: body.creditLimit.toString(),
          currentOutstanding: body.currentOutstanding.toString(),
          statementDate: body.statementDate,
          paymentDueDate: body.paymentDueDate,
          interestRate: body.interestRate.toString(),
          annualFee: body.annualFee.toString(),
        })
        .returning();

      return reply.code(201).send(card);
    }
  );

  app.put(
    "/credit-cards/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const body = updateCardSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(creditCards)
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Credit card not found" });
      }

      const [updated] = await db
        .update(creditCards)
        .set({
          cardName: body.cardName ?? existing.cardName,
          bankIssuer: body.bankIssuer ?? existing.bankIssuer,
          cardType: body.cardType ?? existing.cardType,
          last4: body.last4 ?? existing.last4,
          creditLimit: body.creditLimit ? body.creditLimit.toString() : existing.creditLimit,
          currentOutstanding: body.currentOutstanding !== undefined ? body.currentOutstanding.toString() : existing.currentOutstanding,
          statementDate: body.statementDate ?? existing.statementDate,
          paymentDueDate: body.paymentDueDate ?? existing.paymentDueDate,
          interestRate: body.interestRate ? body.interestRate.toString() : existing.interestRate,
          annualFee: body.annualFee !== undefined ? body.annualFee.toString() : existing.annualFee,
          cardStatus: body.cardStatus ?? existing.cardStatus,
        })
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );

  app.delete(
    "/credit-cards/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(creditCards)
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Credit card not found" });
      }

      await db
        .delete(creditCards)
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));

      if (existing.accountId) {
        await db
          .update(accounts)
          .set({ isActive: false })
          .where(and(eq(accounts.id, existing.accountId), eq(accounts.userId, userId)));
      }

      return reply.send({ message: "Credit card deleted successfully" });
    }
  );

  app.post(
    "/credit-cards/:id/payment",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const { amount } = recordPaymentSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(creditCards)
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Credit card not found" });
      }

      const currentOutstandingNum = Number(existing.currentOutstanding);
      const newOutstanding = Math.max(0, currentOutstandingNum - amount);

      const [updated] = await db
        .update(creditCards)
        .set({
          currentOutstanding: newOutstanding.toString(),
        })
        .where(and(eq(creditCards.id, id), eq(creditCards.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );
}
