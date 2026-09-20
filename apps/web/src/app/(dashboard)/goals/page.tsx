import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { GoalsClient } from "./goals-client";

const API_URL = "http://localhost:4000";

async function getGoals() {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const response = await fetch(`${API_URL}/goals`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
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