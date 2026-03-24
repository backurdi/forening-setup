import { describe, expect, it } from "vitest";

import { membershipSignupSchema } from "@/lib/validations/membership";

describe("membershipSignupSchema", () => {
  it("accepts a valid signup payload", () => {
    const result = membershipSignupSchema.safeParse({
      firstName: "Amina",
      lastName: "Jensen",
      email: "amina@example.com",
      phone: "12345678",
      consentToEmail: true
    });

    expect(result.success).toBe(true);
  });
});
