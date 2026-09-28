import { getErrorMessage } from "./errors";

describe("safe UI error messages", () => {
  it("uses Error messages when available", () => {
    expect(getErrorMessage(new Error("Network failed"), "Fallback")).toBe("Network failed");
  });

  it("uses the fallback for unknown thrown values", () => {
    expect(getErrorMessage({ message: "unsafe" }, "Fallback")).toBe("Fallback");
    expect(getErrorMessage(null, "Fallback")).toBe("Fallback");
  });
});
