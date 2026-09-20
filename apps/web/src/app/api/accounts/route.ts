import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get("wealthly_token")?.value;
}

function unauthorizedResponse() {
  return NextResponse.json(
    {
      message: "Unauthorized",
    },
    {
      status: 401,
    }
  );
}

export async function GET() {
  const token = await getToken();

  if (!token) {
    return unauthorizedResponse();
  }

  const response = await fetch(`${API_URL}/accounts`, {
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}

export async function POST(request: NextRequest) {
  const token = await getToken();

  if (!token) {
    return unauthorizedResponse();
  }

  const body = await request.json();

  const response = await fetch(`${API_URL}/accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
  });
}