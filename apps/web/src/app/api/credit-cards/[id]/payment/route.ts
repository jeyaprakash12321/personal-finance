import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../../lib/api-client";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const response = await authenticatedFetch(`/credit-cards/${id}/payment`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ message: "Request failed" }));
  return NextResponse.json(data, { status: response.status });
}
