import { z } from "zod";
import { db, eq, userPreferences } from "@personal-finance/db";

const updatePreferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  accent: z.enum(["green", "blue", "purple", "rose", "amber", "mono"]).optional(),
});

export default async function preferenceRoutes(app: any) {
  app.get(
    "/preferences",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      if (!existing) {
        return reply.send({
          theme: "system",
          accent: "purple",
        });
      }

      return reply.send({
        theme: existing.theme,
        accent: existing.accent,
      });
    }
  );

  app.put(
    "/preferences",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const body = updatePreferencesSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));

      if (!existing) {
        const [created] = await db
          .insert(userPreferences)
          .values({
            userId,
            theme: body.theme ?? "system",
            accent: body.accent ?? "purple",
          })
          .returning();

        return reply.send({
          theme: created.theme,
          accent: created.accent,
        });
      }

      const [updated] = await db
        .update(userPreferences)
        .set({
          theme: body.theme ?? existing.theme,
          accent: body.accent ?? existing.accent,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, userId))
        .returning();

      return reply.send({
        theme: updated.theme,
        accent: updated.accent,
      });
    }
  );
}
