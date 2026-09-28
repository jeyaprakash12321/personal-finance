import { z } from "zod";

import {
  categories,
  transactions,
  recurringTransactions,
  db,
  eq,
  and,
} from "@personal-finance/db";

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["income", "expense"]),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["income", "expense"]),
});

export default async function categoryRoutes(app: any) {
  app.post(
    "/categories",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body = createCategorySchema.parse(request.body);
      const userId = request.user.id;

      const [category] = await db
        .insert(categories)
        .values({
          userId,
          name: body.name.trim(),
          type: body.type,
        })
        .returning();

      return reply.code(201).send(category);
    }
  );

  app.get(
    "/categories",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      const existing = await db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));

      const suggestedCategories = [
        { name: "Loan Payment", type: "expense" as const },
        { name: "Insurance Premium", type: "expense" as const },
        { name: "Credit Card Payment", type: "expense" as const },
      ];
      const missing = suggestedCategories.filter(
        (suggested) => !existing.some(
          (category) => category.name.toLowerCase() === suggested.name.toLowerCase() && category.type === suggested.type,
        ),
      );

      if (missing.length > 0) {
        const created = await db.insert(categories).values(
          missing.map((category) => ({ ...category, userId })),
        ).returning();
        return [...existing, ...created];
      }

      return existing;
    }
  );

  app.put(
    "/categories/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const body = updateCategorySchema.parse(request.body);
      const userId = request.user.id;

      const [existingCategory] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));

      if (!existingCategory) {
        return reply.code(404).send({
          message: "Category not found",
        });
      }

      const [updatedCategory] = await db
        .update(categories)
        .set({
          name: body.name.trim(),
          type: body.type,
        })
        .where(and(eq(categories.id, id), eq(categories.userId, userId)))
        .returning();

      if (existingCategory.name !== updatedCategory.name) {
        await db
          .update(recurringTransactions)
          .set({ category: updatedCategory.name })
          .where(
            and(
              eq(recurringTransactions.userId, userId),
              eq(recurringTransactions.category, existingCategory.name),
            ),
          );
      }

      return reply.send(updatedCategory);
    }
  );

  app.delete(
    "/categories/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existingCategory] = await db
        .select()
        .from(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));

      if (!existingCategory) {
        return reply.code(404).send({
          message: "Category not found",
        });
      }

      // Check if transactions use this category
      const existingTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.categoryId, id),
            eq(transactions.userId, userId)
          )
        );

      if (existingTransactions.length > 0) {
        return reply.code(409).send({
          message: `Cannot delete category "${existingCategory.name}" because it is currently used by ${existingTransactions.length} transaction(s).`,
        });
      }

      await db
        .delete(categories)
        .where(and(eq(categories.id, id), eq(categories.userId, userId)));

      return reply.send({
        message: "Category deleted successfully",
      });
    }
  );
}
