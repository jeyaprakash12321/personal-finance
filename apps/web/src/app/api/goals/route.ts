import { authenticatedFetch } from "../../../lib/api-client";
import { NextResponse } from "next/server";

export async function GET() {
  const response = await authenticatedFetch("/goals");

  if (response instanceof NextResponse) {
    return response;
  }

  try {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to parse response" },
      { status: response.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  const response = await authenticatedFetch("/goals", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (response instanceof NextResponse) {
    return response;
  }

  try {
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Failed to parse response" },
      { status: response.status || 500 }
    );
  }
}
