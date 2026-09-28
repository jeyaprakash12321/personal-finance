import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../lib/api-client";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const response = await authenticatedFetch("/portfolio/broker-sync", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ message: "Broker sync failed" }));
  return NextResponse.json(data, { status: response.status });
}
