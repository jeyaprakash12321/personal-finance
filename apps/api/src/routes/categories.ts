import { z } from "zod";

import {
  categories,
  db,
  eq,
} from "@personal-finance/db";

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["income", "expense"]),
});

export default async function categoryRoutes(
  app: any
) {
  app.post(
    "/categories",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body =
        createCategorySchema.parse(
          request.body
        );

      const userId = request.user.id;

      const [category] = await db
        .insert(categories)
        .values({
          userId,
          name: body.name,
          type: body.type,
        })
        .returning();

      return reply
        .code(201)
        .send(category);
    }
  );

  app.get(
    "/categories",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      return db
        .select()
        .from(categories)
        .where(eq(categories.userId, userId));
    }
  );
}