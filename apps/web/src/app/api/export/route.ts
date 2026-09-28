import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PRIVATE_API_URL || "http://localhost:4000";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  const response = await fetch(`${API_URL}/export?${searchParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ message: "Export failed" }));
    return NextResponse.json(err, { status: response.status });
  }

  const csvData = await response.text();
  const contentDisposition =
    response.headers.get("content-disposition") || 'attachment; filename="export.csv"';

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": contentDisposition,
    },
  });
}
