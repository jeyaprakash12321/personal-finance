import { z } from "zod";
import { db, eq, and, insurancePolicies } from "@personal-finance/db";

const createPolicySchema = z.object({
  provider: z.string().min(1).max(100),
  policyNumber: z.string().min(1).max(100),
  policyType: z.enum(["health", "life", "vehicle", "home", "travel", "other"]).default("health"),
  coverageAmount: z.number().positive(),
  premium: z.number().positive(),
  premiumFrequency: z.string().default("annual"),
  startDate: z.string().datetime(),
  renewalDate: z.string().datetime(),
  nominee: z.string().max(100).optional().nullable(),
  notes: z.string().max(255).optional().nullable(),
});

const updatePolicySchema = z.object({
  provider: z.string().min(1).max(100).optional(),
  policyNumber: z.string().min(1).max(100).optional(),
  policyType: z.enum(["health", "life", "vehicle", "home", "travel", "other"]).optional(),
  coverageAmount: z.number().positive().optional(),
  premium: z.number().positive().optional(),
  premiumFrequency: z.string().min(1).max(20).optional(),
  startDate: z.string().datetime().optional(),
  renewalDate: z.string().datetime().optional(),
  nominee: z.string().max(100).optional().nullable(),
  notes: z.string().max(255).optional().nullable(),
});

export default async function insuranceRoutes(app: any) {
  app.get(
    "/insurance",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;
      const policies = await db
        .select()
        .from(insurancePolicies)
        .where(eq(insurancePolicies.userId, userId));

      const today = new Date();

      return policies.map((policy) => {
        const renewal = new Date(policy.renewalDate);
        const diffTime = renewal.getTime() - today.getTime();
        const daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isRenewalDueSoon = daysUntilRenewal <= 30 && daysUntilRenewal >= 0;

        return {
          ...policy,
          daysUntilRenewal,
          isRenewalDueSoon,
        };
      });
    }
  );

  app.post(
    "/insurance",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const body = createPolicySchema.parse(request.body);

      const [policy] = await db
        .insert(insurancePolicies)
        .values({
          userId,
          provider: body.provider,
          policyNumber: body.policyNumber,
          policyType: body.policyType,
          coverageAmount: body.coverageAmount.toString(),
          premium: body.premium.toString(),
          premiumFrequency: body.premiumFrequency,
          startDate: new Date(body.startDate),
          renewalDate: new Date(body.renewalDate),
          nominee: body.nominee ?? null,
          notes: body.notes ?? null,
        })
        .returning();

      return reply.code(201).send(policy);
    }
  );

  app.put(
    "/insurance/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const body = updatePolicySchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(insurancePolicies)
        .where(and(eq(insurancePolicies.id, id), eq(insurancePolicies.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Insurance policy not found" });
      }

      const [updated] = await db
        .update(insurancePolicies)
        .set({
          provider: body.provider ?? existing.provider,
          policyNumber: body.policyNumber ?? existing.policyNumber,
          policyType: body.policyType ?? existing.policyType,
          coverageAmount: body.coverageAmount ? body.coverageAmount.toString() : existing.coverageAmount,
          premium: body.premium ? body.premium.toString() : existing.premium,
          premiumFrequency: body.premiumFrequency ?? existing.premiumFrequency,
          startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
          renewalDate: body.renewalDate ? new Date(body.renewalDate) : existing.renewalDate,
          nominee: body.nominee !== undefined ? body.nominee : existing.nominee,
          notes: body.notes !== undefined ? body.notes : existing.notes,
        })
        .where(and(eq(insurancePolicies.id, id), eq(insurancePolicies.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );

  app.delete(
    "/insurance/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(insurancePolicies)
        .where(and(eq(insurancePolicies.id, id), eq(insurancePolicies.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Insurance policy not found" });
      }

      await db
        .delete(insurancePolicies)
        .where(and(eq(insurancePolicies.id, id), eq(insurancePolicies.userId, userId)));

      return reply.send({ message: "Insurance policy deleted successfully" });
    }
  );
}
