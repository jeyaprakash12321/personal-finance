import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { GoalsClient } from "./goals-client";

async function getGoals() {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const response = await fetch(`${baseUrl}/api/goals`, {
    cache: "no-store",
    headers: {
      Cookie: `wealthly_token=${token}`,
    },
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Failed to load goals");
  }

  return response.json();
}

export default async function GoalsPage() {
  const goals = await getGoals();

  return <GoalsClient goals={goals} />;
}