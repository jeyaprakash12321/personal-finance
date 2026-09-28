import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../../lib/api-client";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const response = await authenticatedFetch(`/bank-connections/${id}/reconnect`, { method: "POST" });
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ message: "Reconnect failed" }));
  return NextResponse.json(data, { status: response.status });
}
