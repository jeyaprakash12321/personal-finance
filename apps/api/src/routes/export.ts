import { db, eq, and, gte, lte, transactions, accounts, categories, goals, budgets, creditCards, loans, insurancePolicies, portfolioHoldings } from "@personal-finance/db";

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((header) => {
      let val = row[header];
      if (val === null || val === undefined) val = "";
      if (val instanceof Date) val = val.toISOString();
      const stringVal = String(val).replace(/"/g, '""');
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

export default async function exportRoutes(app: any) {
  app.get(
    "/export",
    {
      preHandler: [app.authenticate],
    },
    async (request: any, reply: any) => {
      const userId = request.user.id;
      const { entity = "transactions", range = "all_time", startDate, endDate } = request.query as any;

      let dateFilter: { start?: Date; end?: Date } = {};
      const now = new Date();

      if (range === "current_month") {
        dateFilter.start = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter.end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      } else if (range === "current_year") {
        dateFilter.start = new Date(now.getFullYear(), 0, 1);
        dateFilter.end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      } else if (range === "custom" && startDate && endDate) {
        dateFilter.start = new Date(startDate);
        dateFilter.end = new Date(endDate);
      }

      let data: any[] = [];

      switch (entity) {
        case "transactions": {
          let query = db.select().from(transactions).where(eq(transactions.userId, userId));
          const rows = await query;
          data = rows.filter((r) => {
            const txDate = new Date(r.transactionDate);
            if (dateFilter.start && txDate < dateFilter.start) return false;
            if (dateFilter.end && txDate > dateFilter.end) return false;
            return true;
          });
          break;
        }
        case "accounts": {
          data = await db.select().from(accounts).where(eq(accounts.userId, userId));
          break;
        }
        case "categories": {
          data = await db.select().from(categories).where(eq(categories.userId, userId));
          break;
        }
        case "goals": {
          data = await db.select().from(goals).where(eq(goals.userId, userId));
          break;
        }
        case "budgets": {
          data = await db.select().from(budgets).where(eq(budgets.userId, userId));
          break;
        }
        case "credit_cards": {
          data = await db.select().from(creditCards).where(eq(creditCards.userId, userId));
          break;
        }
        case "loans": {
          data = await db.select().from(loans).where(eq(loans.userId, userId));
          break;
        }
        case "insurance": {
          data = await db.select().from(insurancePolicies).where(eq(insurancePolicies.userId, userId));
          break;
        }
        case "portfolio": {
          data = await db.select().from(portfolioHoldings).where(eq(portfolioHoldings.userId, userId));
          break;
        }
        default:
          return reply.code(400).send({ message: "Invalid export entity" });
      }

      const csvString = convertToCSV(data);
      const filename = `wealthly-${entity}-${range}-${new Date().toISOString().slice(0, 10)}.csv`;

      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      return reply.send(csvString);
    }
  );
}
