import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const response = await fetch(`${API_URL}/goal-contributions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({
    message: "Request failed",
  }));

  return NextResponse.json(data, {
    status: response.status,
  });
}