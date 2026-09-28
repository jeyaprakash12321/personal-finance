import { z } from "zod";
import { hashPassword, verifyPassword } from "../lib/auth.js";

import { db, eq, users, accounts, categories } from "@personal-finance/db";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100),
});

export default async function authRoutes(app: any) {
  app.post(
    "/auth/register",
    async (request: any, reply: any) => {
      const body = registerSchema.parse(request.body);

      const email = body.email
        .trim()
        .toLowerCase();

      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (existingUsers.length > 0) {
        return reply.code(409).send({
          message: "An account with this email already exists",
        });
      }

      const passwordHash = hashPassword(
        body.password
      );

      const defaultCategories = [
        { name: "Food & Dining", type: "expense" },
        { name: "Bills & Utilities", type: "expense" },
        { name: "Shopping", type: "expense" },
        { name: "Transportation", type: "expense" },
        { name: "Entertainment", type: "expense" },
        { name: "Salary", type: "income" },
        { name: "Freelance", type: "income" },
        { name: "Investments", type: "income" },
      ] as const;

      // User creation and first-run data must succeed or fail together.
      const user = await db.transaction(async (tx) => {
        const [createdUser] = await tx
          .insert(users)
          .values({
            name: body.name.trim(),
            email,
            passwordHash,
          })
          .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
          });

        await tx.insert(accounts).values({
          userId: createdUser.id,
          name: "Primary Checking Account",
          type: "checking",
          initialBalance: "0",
          currency: "INR",
          isActive: true,
        });

        await tx.insert(categories).values(
          defaultCategories.map((category) => ({
            userId: createdUser.id,
            name: category.name,
            type: category.type,
          })),
        );

        return createdUser;
      });

      const token = await app.jwt.sign({
        id: user.id,
        email: user.email,
      });

      return reply.code(201).send({
        user,
        token,
      });
    }
  );

  app.post(
    "/auth/login",
    async (request: any, reply: any) => {
      const body = loginSchema.parse(request.body);

      const email = body.email
        .trim()
        .toLowerCase();

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      if (
        !user ||
        !verifyPassword(
          body.password,
          user.passwordHash
        )
      ) {
        return reply.code(401).send({
          message: "Invalid email or password",
        });
      }

      const token = await app.jwt.sign({
        id: user.id,
        email: user.email,
      });

      return reply.code(200).send({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      });
    }
  );

  app.get(
    "/auth/me",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(
          eq(users.id, request.user.id)
        );

      if (!user) {
        return reply.code(404).send({
          message: "User not found",
        });
      }

      return user;
    }
  );

  app.post(
    "/auth/logout",
    async (request: any, reply: any) => {
      return reply.code(200).send({
        message: "Logged out successfully",
      });
    }
  );
}
