import { apiFetch } from "./auth";

describe("browser authentication fetch", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "window", { value: undefined, configurable: true });
  });

  it("adds JSON content type when a request has a body", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    globalThis.fetch = fetchMock;

    await apiFetch("/api/accounts", { method: "POST", body: JSON.stringify({ name: "Checking" }) });

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
    expect((options.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("preserves an explicitly supplied content type", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response("ok", { status: 200 }));
    globalThis.fetch = fetchMock;

    await apiFetch("/api/export", { headers: { "Content-Type": "text/csv" }, body: "csv" });

    const [, options] = fetchMock.mock.calls[0];
    expect((options.headers as Headers).get("Content-Type")).toBe("text/csv");
  });

  it("returns unauthorized responses to the caller for route-level handling", async () => {
    const fetchMock = jest.fn().mockResolvedValue(new Response(null, { status: 401 }));
    globalThis.fetch = fetchMock;

    const response = await apiFetch("/api/me");

    expect(response.status).toBe(401);
  });
});
