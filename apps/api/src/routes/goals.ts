import { z } from "zod";

import {
  db,
  eq,
  goalContributions,
  goals,
} from "@personal-finance/db";

const createGoalSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  targetAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/),
  targetDate: z.string().datetime().optional(),
});

export default async function goalRoutes(
  app: any
) {
  app.post(
    "/goals",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const body =
        createGoalSchema.parse(request.body);

      const userId = request.user.id;

      const [goal] = await db
        .insert(goals)
        .values({
          userId,
          name: body.name,
          description: body.description,
          targetAmount: body.targetAmount,
          targetDate: body.targetDate
            ? new Date(body.targetDate)
            : null,
        })
        .returning();

      return reply.code(201).send(goal);
    }
  );

  app.get(
    "/goals",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;

      const userGoals = await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId));

      const userContributions = await db
        .select()
        .from(goalContributions)
        .where(
          eq(
            goalContributions.userId,
            userId
          )
        );

      return userGoals.map((goal) => {
        const contributionsForGoal =
          userContributions.filter(
            (contribution) =>
              contribution.goalId === goal.id
          );

        const currentAmount =
          contributionsForGoal.reduce(
            (total, contribution) =>
              total + Number(contribution.amount),
            0
          );

        const targetAmount =
          Number(goal.targetAmount);

        const remainingAmount = Math.max(
          targetAmount - currentAmount,
          0
        );

        const progressPercentage =
          targetAmount > 0
            ? Math.min(
                (currentAmount / targetAmount) * 100,
                100
              )
            : 0;

        const isCompleted =
          currentAmount >= targetAmount;

        return {
          ...goal,
          currentAmount,
          remainingAmount,
          progressPercentage,
          isCompleted,
        };
      });
    }
  );
}