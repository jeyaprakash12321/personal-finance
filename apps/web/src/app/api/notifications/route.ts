import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../lib/api-client";

export async function GET() {
  const response = await authenticatedFetch("/notifications");
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ totalCount: 0, notifications: [] }));
  return NextResponse.json(data, { status: response.status });
}
