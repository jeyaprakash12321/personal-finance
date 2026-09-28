import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../lib/api-client";

export async function GET() {
  const response = await authenticatedFetch("/intelligence/spending");
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ summary: {}, categorySpending: [], largestExpenses: [] }));
  return NextResponse.json(data, { status: response.status });
}
