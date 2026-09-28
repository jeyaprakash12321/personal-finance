import { db, eq, and, accounts, creditCards, loans, insurancePolicies, recurringTransactions, budgets, transactions } from "@personal-finance/db";

export default async function notificationRoutes(app: any) {
  app.get(
    "/notifications",
    { preHandler: [app.authenticate] },
    async (request: any) => {
      const userId = request.user.id;
      const notifications: Array<{
        id: string;
        title: string;
        message: string;
        type: "card" | "loan" | "insurance" | "recurring" | "balance" | "budget";
        severity: "warning" | "danger" | "info";
        date: string;
      }> = [];

      const today = new Date();

      // 1. Credit Card Reminders
      const cards = await db.select().from(creditCards).where(eq(creditCards.userId, userId));
      cards.forEach((c) => {
        if (c.paymentDueDate) {
          const due = new Date(c.paymentDueDate);
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7 && diffDays >= 0 && parseFloat(c.currentOutstanding) > 0) {
            notifications.push({
              id: `card-${c.id}`,
              title: `Credit Card Due: ${c.cardName}`,
              message: `Payment of ₹${parseFloat(c.currentOutstanding).toLocaleString()} is due in ${diffDays} day(s).`,
              type: "card",
              severity: diffDays <= 3 ? "danger" : "warning",
              date: due.toISOString(),
            });
          }
        }
      });

      // 2. Loan EMI Reminders
      const userLoans = await db.select().from(loans).where(eq(loans.userId, userId));
      userLoans.forEach((l) => {
        if (parseFloat(l.currentOutstanding) > 0) {
          notifications.push({
            id: `loan-${l.id}`,
            title: `Loan EMI Reminder: ${l.lender}`,
            message: `Monthly EMI of ₹${parseFloat(l.emi).toLocaleString()} is scheduled for payment.`,
            type: "loan",
            severity: "info",
            date: today.toISOString(),
          });
        }
      });

      // 3. Insurance Renewal Reminders
      const policies = await db.select().from(insurancePolicies).where(eq(insurancePolicies.userId, userId));
      policies.forEach((p) => {
        const renewal = new Date(p.renewalDate);
        const diffDays = Math.ceil((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30 && diffDays >= 0) {
          notifications.push({
            id: `ins-${p.id}`,
            title: `Insurance Policy Renewal: ${p.provider}`,
            message: `Policy #${p.policyNumber} requires premium renewal of ₹${parseFloat(p.premium).toLocaleString()} in ${diffDays} day(s).`,
            type: "insurance",
            severity: diffDays <= 7 ? "danger" : "warning",
            date: renewal.toISOString(),
          });
        }
      });

      // 4. Low Balance Alerts
      const userAccounts = await db.select().from(accounts).where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId));
      userAccounts.forEach((acc) => {
        const balance = userTransactions
          .filter((transaction) => transaction.accountId === acc.id)
          .reduce((total, transaction) => {
            const amount = parseFloat(transaction.amount);
            return total + (transaction.type === "income" ? amount : -amount);
          }, parseFloat(acc.initialBalance));

        if (balance < 5000) {
          notifications.push({
            id: `acc-${acc.id}`,
            title: `Low Balance Warning: ${acc.name}`,
            message: `Account balance is low (₹${balance.toLocaleString()}).`,
            type: "balance",
            severity: "warning",
            date: today.toISOString(),
          });
        }
      });

      return {
        totalCount: notifications.length,
        notifications,
      };
    }
  );
}
