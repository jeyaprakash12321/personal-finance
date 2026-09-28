import { z } from "zod";
import { db, eq, and, loans } from "@personal-finance/db";

const createLoanSchema = z.object({
  lender: z.string().min(1).max(100),
  loanType: z.enum(["personal", "home", "vehicle", "education", "other"]).default("personal"),
  originalPrincipal: z.number().positive(),
  currentOutstanding: z.number().nonnegative(),
  interestRate: z.number().nonnegative(),
  emi: z.number().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  paymentFrequency: z.string().default("monthly"),
});

const updateLoanSchema = z.object({
  lender: z.string().min(1).max(100).optional(),
  loanType: z.enum(["personal", "home", "vehicle", "education", "other"]).optional(),
  originalPrincipal: z.number().positive().optional(),
  currentOutstanding: z.number().nonnegative().optional(),
  interestRate: z.number().nonnegative().optional(),
  emi: z.number().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  paymentFrequency: z.string().min(1).max(20).optional(),
});

const recordEmiSchema = z.object({
  amount: z.number().positive(),
});

export default async function loanRoutes(app: any) {
  app.get(
    "/loans",
    {
      preHandler: [app.authenticate],
    },
    async (request: any) => {
      const userId = request.user.id;
      const userLoans = await db
        .select()
        .from(loans)
        .where(eq(loans.userId, userId));

      return userLoans.map((loan) => {
        const principal = Number(loan.originalPrincipal);
        const outstanding = Number(loan.currentOutstanding);
        const emi = Number(loan.emi);
        const paidAmount = Math.max(0, principal - outstanding);
        const progressPercentage = principal > 0 ? (paidAmount / principal) * 100 : 0;
        const remainingEMIs = emi > 0 ? Math.ceil(outstanding / emi) : 0;

        return {
          ...loan,
          paidAmount,
          progressPercentage: Number(progressPercentage.toFixed(1)),
          remainingEMIs,
        };
      });
    }
  );

  app.post(
    "/loans",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const body = createLoanSchema.parse(request.body);

      const [loan] = await db
        .insert(loans)
        .values({
          userId,
          lender: body.lender,
          loanType: body.loanType,
          originalPrincipal: body.originalPrincipal.toString(),
          currentOutstanding: body.currentOutstanding.toString(),
          interestRate: body.interestRate.toString(),
          emi: body.emi.toString(),
          startDate: new Date(body.startDate),
          endDate: body.endDate ? new Date(body.endDate) : null,
          paymentFrequency: body.paymentFrequency,
        })
        .returning();

      return reply.code(201).send(loan);
    }
  );

  app.put(
    "/loans/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const body = updateLoanSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Loan not found" });
      }

      const [updated] = await db
        .update(loans)
        .set({
          lender: body.lender ?? existing.lender,
          loanType: body.loanType ?? existing.loanType,
          originalPrincipal: body.originalPrincipal ? body.originalPrincipal.toString() : existing.originalPrincipal,
          currentOutstanding: body.currentOutstanding !== undefined ? body.currentOutstanding.toString() : existing.currentOutstanding,
          interestRate: body.interestRate ? body.interestRate.toString() : existing.interestRate,
          emi: body.emi ? body.emi.toString() : existing.emi,
          startDate: body.startDate ? new Date(body.startDate) : existing.startDate,
          endDate: body.endDate !== undefined ? (body.endDate ? new Date(body.endDate) : null) : existing.endDate,
          paymentFrequency: body.paymentFrequency ?? existing.paymentFrequency,
        })
        .where(and(eq(loans.id, id), eq(loans.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );

  app.delete(
    "/loans/:id",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Loan not found" });
      }

      await db
        .delete(loans)
        .where(and(eq(loans.id, id), eq(loans.userId, userId)));

      return reply.send({ message: "Loan deleted successfully" });
    }
  );

  app.post(
    "/loans/:id/payment",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const { amount } = recordEmiSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(loans)
        .where(and(eq(loans.id, id), eq(loans.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Loan not found" });
      }

      const currentOutstandingNum = Number(existing.currentOutstanding);
      const newOutstanding = Math.max(0, currentOutstandingNum - amount);

      const [updated] = await db
        .update(loans)
        .set({
          currentOutstanding: newOutstanding.toString(),
        })
        .where(and(eq(loans.id, id), eq(loans.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );
}
