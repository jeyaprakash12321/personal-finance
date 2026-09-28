import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TransactionsClient } from "./transactions-client";

type Transaction = {
  id: string;
  accountId: string;
  categoryName: string;
  description: string | null;
  amount: string;
  type: "income" | "expense";
  transactionDate: string;
};

async function getTransactions(): Promise<Transaction[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/transactions`, {
    cache: "no-store",
    headers: {
      Cookie: `wealthly_token=${token}`,
    },
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Failed to load transactions");
  }

  return response.json();
}

export default async function TransactionsPage() {
  const transactions =
    await getTransactions();

  return (
    <TransactionsClient
      transactions={transactions}
    />
  );
}
