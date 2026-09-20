import { NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

export async function POST(
  request: Request
) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data,
        {
          status: response.status,
        }
      );
    }

    const nextResponse =
      NextResponse.json({
        user: data.user,
      });

    nextResponse.cookies.set(
      "wealthly_token",
      data.token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        message:
          "Unable to connect to the API",
      },
      {
        status: 500,
      }
    );
  }
}