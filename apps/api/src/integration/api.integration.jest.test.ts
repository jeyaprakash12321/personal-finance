import { buildApp } from "../app";
import { closeDb, db, eq, users } from "@personal-finance/db";

describe("API authentication and user isolation", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
    await app.close();
    await closeDb();
  });

  async function register(label: string) {
    const response = await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: {
        name: `Integration ${label}`,
        email: `integration-${label.toLowerCase()}-${Date.now()}-${Math.random()}@example.test`,
        password: "TestPassword123!",
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as { user: { id: string }; token: string };
    createdUserIds.push(body.user.id);
    return body;
  }

  it("rejects protected requests without a token", async () => {
    const response = await app.inject({ method: "GET", url: "/accounts" });
    expect(response.statusCode).toBe(401);
  });

  it("isolates accounts between authenticated users", async () => {
    const userA = await register("A");
    const userB = await register("B");

    const create = await app.inject({
      method: "POST",
      url: "/accounts",
      headers: { authorization: `Bearer ${userA.token}` },
      payload: { name: "A Savings", type: "savings", currency: "INR", initialBalance: "100.00" },
    });
    expect(create.statusCode).toBe(201);
    const account = create.json() as { id: string };

    const ownAccounts = await app.inject({
      method: "GET",
      url: "/accounts",
      headers: { authorization: `Bearer ${userA.token}` },
    });
    expect(ownAccounts.json()).toEqual(expect.arrayContaining([expect.objectContaining({ id: account.id })]));

    const otherAccounts = await app.inject({
      method: "GET",
      url: "/accounts",
      headers: { authorization: `Bearer ${userB.token}` },
    });
    expect(otherAccounts.json()).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: account.id })]));

    const forgedRead = await app.inject({
      method: "GET",
      url: `/accounts/${account.id}`,
      headers: { authorization: `Bearer ${userB.token}` },
    });
    expect(forgedRead.statusCode).toBe(404);
  });

  it("returns structured validation errors", async () => {
    const user = await register("Validation");
    const response = await app.inject({
      method: "POST",
      url: "/accounts",
      headers: { authorization: `Bearer ${user.token}` },
      payload: { name: "", type: "invalid" },
    });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(expect.objectContaining({ message: "Invalid request data" }));
  });
});
