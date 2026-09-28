import { authenticatedFetch } from "../../../lib/api-client";
import { NextResponse } from "next/server";

const DEFAULT_PREFERENCES = {
  theme: "system",
  accent: "green",
};

export async function GET() {
  const response = await authenticatedFetch(
    "/preferences"
  );

  if (response instanceof NextResponse) {
    if (response.status === 401) {
      return NextResponse.json(
        DEFAULT_PREFERENCES
      );
    }

    return response;
  }

  if (!response.ok) {
    return NextResponse.json(
      DEFAULT_PREFERENCES
    );
  }

  const data = await response.json();

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message: "Invalid JSON body",
      },
      {
        status: 400,
      }
    );
  }

  const response = await authenticatedFetch(
    "/preferences",
    {
      method: "PUT",
      body: JSON.stringify(body),
    }
  );

  if (response instanceof NextResponse) {
    return response;
  }

  const data = await response
    .json()
    .catch(() => ({
      message: "Request failed",
    }));

  return NextResponse.json(data, {
    status: response.status,
  });
}