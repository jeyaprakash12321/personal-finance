import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { TransactionsClient } from "./transactions-client";

const API_URL = "http://localhost:4000";

type Transaction = {
  id: string;
  categoryName: string;
  description: string | null;
  amount: string;
  type: "income" | "expense";
  transactionDate: string;
};

async function getTransactions(): Promise<
  Transaction[]
> {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("wealthly_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const response = await fetch(
    `${API_URL}/transactions`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error(
      "Failed to load transactions"
    );
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