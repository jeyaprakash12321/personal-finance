import { hashPassword, verifyPassword } from "./auth";

describe("password authentication helpers", () => {
  it("creates a salted hash that verifies only the original password", () => {
    const hash = hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse battery staple");
    expect(hashPassword("correct horse battery staple")).not.toBe(hash);
    expect(verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(verifyPassword("wrong password", hash)).toBe(false);
  });

  it.each(["", "malformed", "salt:", ":deadbeef", "salt:not-hex"]) (
    "rejects malformed stored hash %j",
    (storedHash) => {
      expect(verifyPassword("password", storedHash)).toBe(false);
    },
  );
});
