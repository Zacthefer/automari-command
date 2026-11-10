import { describe, expect, it } from "vitest";
import { generatePassword } from "./password";

describe("generatePassword", () => {
  it("is 16 characters by default and meets the backend's 12-character minimum", () => {
    expect(generatePassword()).toHaveLength(16);
  });

  it("uses only letters and digits without look-alikes", () => {
    for (let i = 0; i < 200; i++) {
      expect(generatePassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
    }
  });

  it("gives a different password each time", () => {
    const seen = new Set(Array.from({ length: 500 }, () => generatePassword()));
    expect(seen.size).toBe(500);
  });
});
