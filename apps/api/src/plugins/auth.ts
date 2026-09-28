import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import { FastifyRequest, FastifyReply } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }
}

export default fp(async (app) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  await app.register(fastifyJwt, {
    secret,
  });

  app.decorate(
    "authenticate",
    async function (request, reply) {
      try {
        await request.jwtVerify();
      } catch {
        return reply.code(401).send({
          message: "Unauthorized",
        });
      }
    }
  );
});