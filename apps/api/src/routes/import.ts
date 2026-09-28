import { z } from "zod";
import { db, eq, and, transactions, accounts, categories } from "@personal-finance/db";

const importExecuteSchema = z.object({
  accountId: z.string().uuid(),
  rows: z.array(
    z.object({
      amount: z.number().finite().nonnegative(),
      type: z.enum(["income", "expense"]),
      categoryName: z.string().optional(),
      description: z.string().optional(),
      date: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid transaction date"),
    })
  ),
  skipDuplicates: z.boolean().default(true),
});

export default async function importRoutes(app: any) {
  // Preview endpoint to analyze rows & check for duplicates before import
  app.post(
    "/import/preview",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const previewSchema = importExecuteSchema.pick({ accountId: true, rows: true });
      const { accountId, rows } = previewSchema.parse(request.body);

      if (!rows || !Array.isArray(rows)) {
        return reply.code(400).send({ message: "Invalid payload, 'rows' array required" });
      }

      if (accountId) {
        const [account] = await db
          .select({ id: accounts.id })
          .from(accounts)
          .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
        if (!account) {
          return reply.code(404).send({ message: "Target account not found or access denied" });
        }
      }

      // Fetch user's existing transactions for this account to perform duplicate detection
      let existing = [];
      if (accountId) {
        existing = await db
          .select({
            amount: transactions.amount,
            date: transactions.transactionDate,
            description: transactions.description,
          })
          .from(transactions)
          .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)));
      } else {
        existing = await db
          .select({
            amount: transactions.amount,
            date: transactions.transactionDate,
            description: transactions.description,
          })
          .from(transactions)
          .where(eq(transactions.userId, userId));
      }

      const existingSet = new Set(
        existing.map((e) => `${new Date(e.date).toISOString().slice(0, 10)}_${parseFloat(e.amount)}_${e.description || ""}`)
      );

      let duplicateCount = 0;
      const previewRows = rows.map((row) => {
        const dateStr = new Date(row.date).toISOString().slice(0, 10);
        const amt = row.amount;
        const desc = row.description || "";
        const key = `${dateStr}_${amt}_${desc}`;
        const isDuplicate = existingSet.has(key);
        if (isDuplicate) duplicateCount++;

        return {
          ...row,
          isDuplicate,
        };
      });

      return reply.send({
        totalRows: rows.length,
        duplicateCount,
        previewRows,
      });
    }
  );

  // Execute import endpoint
  app.post(
    "/import/execute",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const { accountId, rows, skipDuplicates } = importExecuteSchema.parse(request.body);

      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));

      if (!account) {
        return reply.code(404).send({ message: "Target account not found or access denied" });
      }

      // Existing transactions check
      const existing = await db
        .select({
          amount: transactions.amount,
          date: transactions.transactionDate,
          description: transactions.description,
        })
        .from(transactions)
        .where(and(eq(transactions.userId, userId), eq(transactions.accountId, accountId)));

      const existingSet = new Set(
        existing.map((e) => `${new Date(e.date).toISOString().slice(0, 10)}_${parseFloat(e.amount)}_${e.description || ""}`)
      );

      let insertedCount = 0;
      let skippedCount = 0;

      // Get user's categories for import
      const userCategories = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));

      const defaultCategories = new Map<"income" | "expense", typeof userCategories[number]>();
      for (const type of ["income", "expense"] as const) {
        let category = userCategories.find((item) => item.name === "Uncategorized" && item.type === type);
        if (!category) {
          const [created] = await db
            .insert(categories)
            .values({ userId, name: "Uncategorized", type })
            .returning();
          category = created;
        }
        defaultCategories.set(type, category);
      }

      for (const row of rows) {
        const txDate = new Date(row.date);
        const dateStr = txDate.toISOString().slice(0, 10);
        const key = `${dateStr}_${row.amount}_${row.description || ""}`;

        if (skipDuplicates && existingSet.has(key)) {
          skippedCount++;
          continue;
        }

        // Find category by name or use default
        let categoryId = defaultCategories.get(row.type)!.id;
        if (row.categoryName) {
          const found = userCategories.find(c => c.name === row.categoryName && c.type === row.type);
          if (found) {
            categoryId = found.id;
          }
        }

        await db.insert(transactions).values({
          userId,
          accountId,
          amount: row.amount.toString(),
          type: row.type,
          categoryId,
          description: row.description || "",
          transactionDate: txDate,
        });

        insertedCount++;
      }

      return reply.send({
        message: `Import complete. ${insertedCount} transactions imported, ${skippedCount} duplicates skipped.`,
        insertedCount,
        skippedCount,
      });
    }
  );
}
