import fp from "fastify-plugin";
import { db } from "@personal-finance/db";

declare module "fastify" {
  interface FastifyInstance {
    db: typeof db;
  }
}

export default fp(async (app) => {
  app.decorate("db", db);
});