jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("next/server", () => ({
  NextResponse: class extends Response {
    static json(body: unknown, init?: ResponseInit) {
      return new Response(JSON.stringify(body), {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
}));

import { authenticatedFetch, forwardApiResponse, getAuthToken, proxyRequest } from "./api-client";
import { cookies } from "next/headers";

const cookiesMock = cookies as jest.Mock;

describe("server API client", () => {
  const originalFetch = globalThis.fetch;
  const originalError = console.error;

  beforeEach(() => {
    cookiesMock.mockResolvedValue({ get: jest.fn(() => ({ value: "token-123" })) });
    console.error = jest.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalError;
    jest.clearAllMocks();
  });

  it("reads the authentication cookie", async () => {
    await expect(getAuthToken()).resolves.toBe("token-123");
  });

  it("returns 401 without an authentication cookie", async () => {
    cookiesMock.mockResolvedValue({ get: jest.fn(() => undefined) });

    const response = await authenticatedFetch("/accounts");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Unauthorized" });
  });

  it("adds bearer authentication and no-store to API requests", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    globalThis.fetch = fetchMock;

    await authenticatedFetch("/accounts", { method: "GET", headers: { "X-Trace": "test" } });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:4000/accounts", expect.objectContaining({
      cache: "no-store",
      headers: expect.objectContaining({ Authorization: "Bearer token-123", "X-Trace": "test" }),
    }));
  });

  it("returns a safe 500 response when the API is unavailable", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("offline"));

    const response = await authenticatedFetch("/accounts");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Unable to connect to the API" });
  });

  it("proxies JSON request bodies and preserves the upstream status", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "account-1" }), { status: 201 }),
    );
    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name: "Checking" }),
    });

    const response = await proxyRequest("/accounts", request);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: "account-1" });
    expect(globalThis.fetch).toHaveBeenCalledWith("http://localhost:4000/accounts", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Checking" }),
    }));
  });

  it("returns 401 and does not call the API when proxy authentication is absent", async () => {
    cookiesMock.mockResolvedValue({ get: jest.fn(() => undefined) });
    const fetchMock = jest.fn();
    globalThis.fetch = fetchMock;

    const response = await proxyRequest("/accounts");

    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe 500 response when proxying fails", async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error("offline"));

    const response = await proxyRequest("/accounts");

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Unable to connect to the API" });
  });

  it("forwards an empty 204 response without parsing a body", async () => {
    const response = await forwardApiResponse(new Response(null, { status: 204 }));

    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
  });
});
