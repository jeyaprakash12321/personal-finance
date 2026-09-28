import { NextResponse } from "next/server";
import { authenticatedFetch } from "../../../lib/api-client";

export async function GET() {
  const response = await authenticatedFetch("/bank-connections");
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => []);
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }
  const response = await authenticatedFetch("/bank-connections", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (response instanceof NextResponse) return response;
  const data = await response.json().catch(() => ({ message: "Request failed" }));
  return NextResponse.json(data, { status: response.status });
}
