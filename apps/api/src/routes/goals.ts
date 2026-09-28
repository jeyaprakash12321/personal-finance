import { z } from "zod";

import {
  and,
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
          contributions: contributionsForGoal,
        };
      });
    }
  );

  // PUT /goals/:id — update name, description, targetAmount, targetDate
  app.put(
    "/goals/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const updateSchema = z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(255).optional().nullable(),
        targetAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
        targetDate: z.string().datetime().optional().nullable(),
      });

      const body = updateSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Goal not found" });
      }

      const [updated] = await db
        .update(goals)
        .set({
          ...(body.name !== undefined && { name: body.name }),
          ...(body.description !== undefined && { description: body.description ?? null }),
          ...(body.targetAmount !== undefined && { targetAmount: body.targetAmount }),
          ...(body.targetDate !== undefined && {
            targetDate: body.targetDate ? new Date(body.targetDate) : null,
          }),
        })
        .where(eq(goals.id, id))
        .returning();

      return reply.send(updated);
    }
  );

  // DELETE /goals/:id — cascade deletes contributions (FK cascade in schema)
  app.delete(
    "/goals/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params as { id: string };
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(goals)
        .where(and(eq(goals.id, id), eq(goals.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Goal not found" });
      }

      await db.delete(goals).where(eq(goals.id, id));

      return reply.code(204).send();
    }
  );
}