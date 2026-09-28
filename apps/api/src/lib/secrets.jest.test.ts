import { decryptSecret, encryptSecret } from "./secrets";

describe("encrypted secrets", () => {
  const originalKey = process.env.BANK_TOKEN_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.BANK_TOKEN_ENCRYPTION_KEY = "test-only-bank-token-key";
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.BANK_TOKEN_ENCRYPTION_KEY;
    else process.env.BANK_TOKEN_ENCRYPTION_KEY = originalKey;
  });

  it("encrypts tokens without storing the plaintext and decrypts them", () => {
    const encrypted = encryptSecret("demo-provider-token");
    expect(encrypted).not.toContain("demo-provider-token");
    expect(decryptSecret(encrypted)).toBe("demo-provider-token");
  });

  it("uses a fresh nonce for every encryption", () => {
    expect(encryptSecret("same-value")).not.toBe(encryptSecret("same-value"));
  });

  it("rejects malformed ciphertext", () => {
    expect(() => decryptSecret("invalid")).toThrow("Invalid encrypted secret");
  });

  it("fails closed when no encryption secret is configured", () => {
    delete process.env.BANK_TOKEN_ENCRYPTION_KEY;
    const jwtSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => encryptSecret("token")).toThrow("required");
    if (jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = jwtSecret;
  });
});
