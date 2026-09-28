import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../../lib/api-client";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const response = await authenticatedFetch("/import/execute", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ message: "Import failed" }));
  return NextResponse.json(data, { status: response.status });
}
