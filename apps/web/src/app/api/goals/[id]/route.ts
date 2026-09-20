import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = "http://localhost:4000";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("wealthly_token")?.value;

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const response = await fetch(`${API_URL}/goals/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({
    message: "Request failed",
  }));

  return NextResponse.json(data, {
    status: response.status,
  });
}