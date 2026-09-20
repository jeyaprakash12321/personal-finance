import { z } from "zod";

import {
  db,
  eq,
  goalContributions,
  goals,
} from "@personal-finance/db";

const createContributionSchema = z.object({
  goalId: z.string().uuid(),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/),
  contributionDate: z.string().datetime(),
  note: z.string().max(255).optional(),
});

export default async function goalContributionRoutes(
  app: any
) {
  app.post(
    "/goal-contributions",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body =
        createContributionSchema.parse(
          request.body
        );

      const userId = request.user.id;

      const [goal] = await db
        .select()
        .from(goals)
        .where(eq(goals.id, body.goalId));

      if (
        !goal ||
        goal.userId !== userId
      ) {
        return reply.code(404).send({
          message: "Goal not found",
        });
      }

      const [contribution] = await db
        .insert(goalContributions)
        .values({
          userId,
          goalId: body.goalId,
          amount: body.amount,
          contributionDate: new Date(
            body.contributionDate
          ),
          note: body.note,
        })
        .returning();

      return reply
        .code(201)
        .send(contribution);
    }
  );

  app.get(
    "/goal-contributions",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      return db
        .select()
        .from(goalContributions)
        .where(
          eq(
            goalContributions.userId,
            userId
          )
        );
    }
  );
}