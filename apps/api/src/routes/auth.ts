import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { z } from "zod";

import { db, eq, users } from "@personal-finance/db";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(100),
});

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");

  const hash = scryptSync(
    password,
    salt,
    64
  ).toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(
  password: string,
  storedHash: string
) {
  const [salt, key] = storedHash.split(":");

  if (!salt || !key) {
    return false;
  }

  const derivedKey = scryptSync(
    password,
    salt,
    64
  );

  const storedKey = Buffer.from(key, "hex");

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return timingSafeEqual(
    derivedKey,
    storedKey
  );
}

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

      const [user] = await db
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

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
        token,
      };
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
}