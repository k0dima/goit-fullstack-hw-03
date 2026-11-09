import { describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { createTokens } from "../../src/services/auth.ts";

vi.mock("../../prisma/client.ts", () => ({ default: {} }));

describe("createTokens", () => {
  it("створює підписані access та refresh токени для користувача", () => {
    const { accessToken, refreshToken } = createTokens(42);

    expect(jwt.verify(accessToken, "test-secret")).toMatchObject({ sub: "42", type: "access" });
    expect(jwt.verify(refreshToken, "test-secret")).toMatchObject({ sub: "42", type: "refresh" });
  });

  it("створює різні refresh токени при повторному виклику", () => {
    expect(createTokens(42).refreshToken).not.toBe(createTokens(42).refreshToken);
  });
});
