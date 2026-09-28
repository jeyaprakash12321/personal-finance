import { authenticatedFetch } from "../../../../lib/api-client";
import { NextResponse } from "next/server";

export async function GET() {
  const response = await authenticatedFetch("/auth/me");

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
