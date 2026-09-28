import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../lib/api-client";

export async function GET(request: NextRequest) {
  const range = request.nextUrl.searchParams.get("range") ?? "30d";

  const response = await authenticatedFetch(`/dashboard/cash-flow?range=${encodeURIComponent(range)}`);

  if (response instanceof NextResponse) {
    return response;
  }

  const data = await response.json().catch(() => ({
    message: "Failed to fetch cash flow data",
  }));

  return NextResponse.json(data, { status: response.status });
}
