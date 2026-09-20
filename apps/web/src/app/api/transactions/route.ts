import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

export async function POST(
  request: Request
) {
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

  try {
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "Unable to create transaction",
      },
      {
        status: 500,
      }
    );
  }
}