import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  const targetUrl = new URL(`${API_URL}/budgets`);

  if (month) {
    targetUrl.searchParams.set("month", month);
  }

  const response = await fetch(
    targetUrl.toString(),
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response
    .json()
    .catch(() => ({
      message: "Request failed",
    }));

  return NextResponse.json(data, {
    status: response.status,
  });
}

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

  const response = await fetch(
    `${API_URL}/budgets`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response
    .json()
    .catch(() => ({
      message: "Request failed",
    }));

  return NextResponse.json(data, {
    status: response.status,
  });
}