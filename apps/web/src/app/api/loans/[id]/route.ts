import { NextResponse } from "next/server";
import { authenticatedFetch, forwardApiResponse } from "../../../../lib/api-client";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const response = await authenticatedFetch(`/loans/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (response instanceof NextResponse) return response;
  return forwardApiResponse(response);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const response = await authenticatedFetch(`/loans/${id}`, { method: "DELETE" });
  if (response instanceof NextResponse) return response;
  return forwardApiResponse(response);
}
