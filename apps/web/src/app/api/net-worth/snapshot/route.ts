import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../lib/api-client";

export async function POST() {
  const response = await authenticatedFetch("/net-worth/snapshot", { method: "POST" });
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ message: "Snapshot failed" }));
  return NextResponse.json(data, { status: response.status });
}
