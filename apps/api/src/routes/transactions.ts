import { z } from "zod";

import {
  db,
  transactions,
  categories,
  accounts,
  creditCards,
  loans,
  insurancePolicies,
  eq,
  and,
} from "@personal-finance/db";

const createTransactionSchema = z.object({
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/),
  type: z.enum(["income", "expense"]),
  description: z.string().max(255).optional(),
  transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  linkedType: z.enum(["credit_card", "loan", "insurance"]).nullable().optional(),
  linkedId: z.string().uuid().nullable().optional(),
}).superRefine((value, context) => {
  if ((value.linkedType && !value.linkedId) || (!value.linkedType && value.linkedId)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "A linked financial item must include both type and id." });
  }
});

type TransactionLink = {
  linkedType?: "credit_card" | "loan" | "insurance" | null;
  linkedId?: string | null;
};

async function applyLinkedBalance(
  link: TransactionLink,
  accountId: string,
  userId: string,
  type: "income" | "expense",
  amount: number,
  direction = 1,
) {
  if (amount === 0) return;

  if (!link.linkedType || !link.linkedId) {
    const [accountCard] = await db.select().from(creditCards)
      .where(and(eq(creditCards.accountId, accountId), eq(creditCards.userId, userId)));
    if (!accountCard) return;
    link = { linkedType: "credit_card", linkedId: accountCard.id };
  }

  const linkedId = link.linkedId;
  if (!linkedId) return;

  if (link.linkedType === "credit_card") {
    const [card] = await db.select().from(creditCards).where(and(eq(creditCards.id, linkedId), eq(creditCards.userId, userId)));
    if (!card) throw new Error("Linked credit card not found or unauthorized");
    const isCardAccount = card.accountId === accountId;
    const outstandingDelta = type === "expense"
      ? (isCardAccount ? amount : -amount)
      : (isCardAccount ? -amount : amount);
    await db.update(creditCards)
      .set({ currentOutstanding: Math.max(0, Number(card.currentOutstanding) + outstandingDelta * direction).toFixed(2) })
      .where(and(eq(creditCards.id, card.id), eq(creditCards.userId, userId)));
    return;
  }

  if (link.linkedType === "loan") {
    const [loan] = await db.select().from(loans).where(and(eq(loans.id, linkedId), eq(loans.userId, userId)));
    if (!loan) throw new Error("Linked loan not found or unauthorized");
    const outstandingDelta = type === "expense" ? -amount : amount;
    await db.update(loans)
      .set({ currentOutstanding: Math.max(0, Number(loan.currentOutstanding) + outstandingDelta * direction).toFixed(2) })
      .where(and(eq(loans.id, loan.id), eq(loans.userId, userId)));
    return;
  }

  const [policy] = await db.select({ id: insurancePolicies.id })
    .from(insurancePolicies)
    .where(and(eq(insurancePolicies.id, linkedId), eq(insurancePolicies.userId, userId)));
  if (!policy) throw new Error("Linked insurance policy not found or unauthorized");
}

export default async function transactionRoutes(app: any) {
  app.post(
    "/transactions",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body = createTransactionSchema.parse(request.body);
      const userId = request.user.id;

      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, body.accountId), eq(accounts.userId, userId)));

      if (!account) {
        return reply.code(404).send({
          message: "Account not found or unauthorized",
        });
      }

      // Verify category belongs to user
      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, body.categoryId), eq(categories.userId, userId)));

      if (!category) {
        return reply.code(404).send({
          message: "Category not found or unauthorized",
        });
      }

      // Verify category type matches transaction type
      if (category.type !== body.type) {
        return reply.code(400).send({
          message: `Category type "${category.type}" does not match transaction type "${body.type}".`,
        });
      }

      await applyLinkedBalance(body, account.id, userId, body.type, Number(body.amount));

      const [transaction] = await db
        .insert(transactions)
        .values({
          userId,
          accountId: body.accountId,
          categoryId: body.categoryId,
          amount: body.amount,
          type: body.type,
          description: body.description?.trim() || null,
          transactionDate: new Date(body.transactionDate),
          linkedType: body.linkedType ?? null,
          linkedId: body.linkedId ?? null,
        })
        .returning();

      return reply.code(201).send(transaction);
    }
  );

  app.get(
    "/transactions",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      const userTransactions = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          accountId: transactions.accountId,
          categoryId: transactions.categoryId,
          amount: transactions.amount,
          type: transactions.type,
          description: transactions.description,
        transactionDate: transactions.transactionDate,
          linkedType: transactions.linkedType,
          linkedId: transactions.linkedId,
          createdAt: transactions.createdAt,
          categoryName: categories.name,
          categoryType: categories.type,
        })
        .from(transactions)
        .innerJoin(
          categories,
          eq(transactions.categoryId, categories.id)
        )
        .where(eq(transactions.userId, userId));

      return userTransactions;
    }
  );

  // PUT /transactions/:id — update fields, re-validate ownership
  app.put(
    "/transactions/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const updateSchema = z.object({
        accountId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        type: z.enum(["income", "expense"]).optional(),
        description: z.string().max(255).optional().nullable(),
        transactionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: "Invalid date format",
        }).optional(),
        linkedType: z.enum(["credit_card", "loan", "insurance"]).nullable().optional(),
        linkedId: z.string().uuid().nullable().optional(),
      });

      const body = updateSchema.parse(request.body);

      // Verify transaction belongs to user
      const [existing] = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Transaction not found" });
      }

      const resolvedType = body.type ?? existing.type;
      const resolvedAccountId = body.accountId ?? existing.accountId;
      const resolvedCategoryId = body.categoryId ?? existing.categoryId;
      const resolvedLinkedType = body.linkedType !== undefined ? body.linkedType : existing.linkedType;
      const resolvedLinkedId = body.linkedId !== undefined ? body.linkedId : existing.linkedId;

      if ((resolvedLinkedType && !resolvedLinkedId) || (!resolvedLinkedType && resolvedLinkedId)) {
        return reply.code(400).send({ message: "A linked financial item must include both type and id." });
      }

      // Verify account belongs to user (if changed)
      if (body.accountId) {
        const [account] = await db
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, resolvedAccountId), eq(accounts.userId, userId)));

        if (!account) {
          return reply.code(404).send({ message: "Account not found or unauthorized" });
        }
      }

      // Verify category belongs to user and type matches
      const [category] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, resolvedCategoryId), eq(categories.userId, userId)));

      if (!category) {
        return reply.code(404).send({ message: "Category not found or unauthorized" });
      }

      if (category.type !== resolvedType) {
        return reply.code(400).send({
          message: `Category type "${category.type}" does not match transaction type "${resolvedType}".`,
        });
      }

      const [newAccount] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, resolvedAccountId), eq(accounts.userId, userId)));

      if (!newAccount) {
        return reply.code(404).send({ message: "Account not found or unauthorized" });
      }

      await applyLinkedBalance(existing, existing.accountId, userId, existing.type, Number(existing.amount), -1);
      await applyLinkedBalance({ linkedType: resolvedLinkedType, linkedId: resolvedLinkedId }, newAccount.id, userId, resolvedType, Number(body.amount ?? existing.amount));

      const [updated] = await db
        .update(transactions)
        .set({
          ...(body.accountId !== undefined && { accountId: body.accountId }),
          ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
          ...(body.amount !== undefined && { amount: body.amount }),
          ...(body.type !== undefined && { type: body.type }),
          ...(body.description !== undefined && { description: body.description ?? null }),
          ...(body.transactionDate !== undefined && { transactionDate: new Date(body.transactionDate) }),
          ...(body.linkedType !== undefined && { linkedType: body.linkedType }),
          ...(body.linkedId !== undefined && { linkedId: body.linkedId }),
        })
        .where(eq(transactions.id, id))
        .returning();

      return reply.send(updated);
    }
  );

  // DELETE /transactions/:id — hard delete, ownership-scoped
  app.delete(
    "/transactions/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Transaction not found" });
      }

      await applyLinkedBalance(existing, existing.accountId, userId, existing.type, Number(existing.amount), -1);

      await db.delete(transactions).where(eq(transactions.id, id));

      return reply.code(204).send();
    }
  );
}
