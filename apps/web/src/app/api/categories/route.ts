import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

export async function GET() {
  const cookieStore = await cookies();

  const token =
    cookieStore.get("wealthly_token")?.value;

  if (!token) {
    return NextResponse.json(
      {
        message: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  const response = await fetch(
    `${API_URL}/categories`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}