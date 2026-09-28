import { z } from "zod";
import { db, eq, and, portfolioHoldings } from "@personal-finance/db";

const createHoldingSchema = z.object({
  symbol: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  assetType: z.enum(["stock", "etf", "mutual_fund", "bond"]).default("stock"),
  quantity: z.number().positive(),
  averageCost: z.number().positive(),
  currentPrice: z.number().positive(),
});

const updateHoldingSchema = z.object({
  symbol: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  assetType: z.enum(["stock", "etf", "mutual_fund", "bond"]).optional(),
  quantity: z.number().positive().optional(),
  averageCost: z.number().positive().optional(),
  currentPrice: z.number().positive().optional(),
});

export default async function portfolioRoutes(app: any) {
  // Get portfolio holdings & summary
  app.get(
    "/portfolio",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;
      const holdings = await db
        .select()
        .from(portfolioHoldings)
        .where(eq(portfolioHoldings.userId, userId));

      let totalInvested = 0;
      let totalCurrentValue = 0;

      const formattedHoldings = holdings.map((h) => {
        const qty = parseFloat(h.quantity);
        const avgCost = parseFloat(h.averageCost);
        const currPrice = parseFloat(h.currentPrice);

        const invested = qty * avgCost;
        const currentVal = qty * currPrice;
        const pnl = currentVal - invested;
        const pnlPercent = invested > 0 ? (pnl / invested) * 100 : 0;

        totalInvested += invested;
        totalCurrentValue += currentVal;

        return {
          ...h,
          investedValue: invested,
          currentValue: currentVal,
          pnl,
          pnlPercent,
        };
      });

      const totalPnL = totalCurrentValue - totalInvested;
      const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

      return {
        summary: {
          totalInvested,
          totalCurrentValue,
          totalPnL,
          totalPnLPercent,
          holdingsCount: holdings.length,
        },
        holdings: formattedHoldings,
      };
    }
  );

  // Add new holding
  app.post(
    "/portfolio",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const body = createHoldingSchema.parse(request.body);

      const [holding] = await db
        .insert(portfolioHoldings)
        .values({
          userId,
          symbol: body.symbol.toUpperCase(),
          name: body.name,
          assetType: body.assetType,
          quantity: body.quantity.toString(),
          averageCost: body.averageCost.toString(),
          currentPrice: body.currentPrice.toString(),
        })
        .returning();

      return reply.code(201).send(holding);
    }
  );

  // Update holding
  app.put(
    "/portfolio/:id",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;
      const body = updateHoldingSchema.parse(request.body);

      const [existing] = await db
        .select()
        .from(portfolioHoldings)
        .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Holding not found" });
      }

      const [updated] = await db
        .update(portfolioHoldings)
        .set({
          symbol: body.symbol ? body.symbol.toUpperCase() : existing.symbol,
          name: body.name ?? existing.name,
          assetType: body.assetType ?? existing.assetType,
          quantity: body.quantity ? body.quantity.toString() : existing.quantity,
          averageCost: body.averageCost ? body.averageCost.toString() : existing.averageCost,
          currentPrice: body.currentPrice ? body.currentPrice.toString() : existing.currentPrice,
        })
        .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, userId)))
        .returning();

      return reply.send(updated);
    }
  );

  // Delete holding
  app.delete(
    "/portfolio/:id",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const { id } = request.params;
      const userId = request.user.id;

      const [existing] = await db
        .select()
        .from(portfolioHoldings)
        .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, userId)));

      if (!existing) {
        return reply.code(404).send({ message: "Holding not found" });
      }

      await db
        .delete(portfolioHoldings)
        .where(and(eq(portfolioHoldings.id, id), eq(portfolioHoldings.userId, userId)));

      return reply.send({ message: "Holding removed from portfolio successfully" });
    }
  );

  // Broker OAuth Sync (Zerodha / Groww / Upstox authorization flow)
  app.post(
    "/portfolio/broker-sync",
    { preHandler: [app.authenticate] },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const { brokerName } = request.body || { brokerName: "Zerodha Kite" };

      // Sample mock holdings imported from broker authorization
      const mockBrokerHoldings = [
        { symbol: "RELIANCE", name: "Reliance Industries Ltd", assetType: "stock", quantity: 20, averageCost: 2600, currentPrice: 2920 },
        { symbol: "TCS", name: "Tata Consultancy Services", assetType: "stock", quantity: 10, averageCost: 3400, currentPrice: 3820 },
        { symbol: "NIFTYBEES", name: "Nippon India ETF Nifty BeES", assetType: "etf", quantity: 100, averageCost: 230, currentPrice: 255 },
      ];

      const inserted = [];
      for (const item of mockBrokerHoldings) {
        const [holding] = await db
          .insert(portfolioHoldings)
          .values({
            userId,
            symbol: item.symbol,
            name: item.name,
            assetType: item.assetType as any,
            quantity: item.quantity.toString(),
            averageCost: item.averageCost.toString(),
            currentPrice: item.currentPrice.toString(),
          })
          .returning();
        inserted.push(holding);
      }

      return reply.send({
        brokerName,
        importedCount: inserted.length,
        holdings: inserted,
        demo: true,
        message: `Demo broker data added for ${brokerName}; no real broker account was connected.`,
      });
    }
  );
}
