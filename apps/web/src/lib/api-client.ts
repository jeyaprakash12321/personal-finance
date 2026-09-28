import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PRIVATE_API_URL || "http://localhost:4000";

export async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get("wealthly_token")?.value;
}

export async function authenticatedFetch(
  path: string,
  options: RequestInit = {}
) {
  const token = await getAuthToken();

  if (!token) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const headers: Record<string, string> = {
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : (options.headers as Record<string, string> | undefined)),
      Authorization: `Bearer ${token}`,
    };
    if (options.body !== undefined && !headers["content-type"] && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    return response;
  } catch (error) {
    console.error(`API request failed: ${path}`, error);
    return new Response(
      JSON.stringify({ message: "Unable to connect to the API" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/** Forward an upstream API response without trying to serialize a 204 body. */
export async function forwardApiResponse(response: Response) {
  if (response.status === 204) {
    return new NextResponse(null, { status: 204 });
  }

  const data = await response.json().catch(() => ({ message: "Request failed" }));
  return NextResponse.json(data, { status: response.status });
}

export async function proxyRequest(
  path: string,
  request?: Request
) {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const options: RequestInit = {
      method: request?.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    };

    if (request && (request.method === "POST" || request.method === "PUT" || request.method === "PATCH")) {
      options.body = JSON.stringify(await request.json());
    }

    const response = await fetch(`${API_URL}${path}`, options);
    const data = await response.json().catch(() => null);

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`API proxy failed: ${path}`, error);
    return NextResponse.json(
      { message: "Unable to connect to the API" },
      { status: 500 }
    );
  }
}
