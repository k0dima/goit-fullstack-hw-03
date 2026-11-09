import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../app.ts";
import prisma from "../../prisma/client.ts";

vi.mock("../../prisma/client.ts", () => ({
  default: {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    refreshToken: { deleteMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const user = {
  id: 1, username: "olena", email: "olena@example.com",
  name: "Олена", password: "secret123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Auth API", () => {
  it("реєструє користувача та повертає токени без пароля", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({ ...user, createdAt: new Date() });
    vi.mocked(prisma.$transaction).mockResolvedValue([] as never);

    const response = await request(app).post("/api/auth/register").send(user);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body.user.username).toBe(user.username);
    expect(response.body.user).not.toHaveProperty("password");
    const createArgs = vi.mocked(prisma.user.create).mock.calls[0][0];
    expect(await bcrypt.compare(user.password, String(createArgs.data.password))).toBe(true);
  });

  it("відхиляє некоректні дані реєстрації", async () => {
    const response = await request(app).post("/api/auth/register").send({ ...user, email: "invalid" });
    expect(response.status).toBe(422);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("повертає 401 при неправильному паролі", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user, password: await bcrypt.hash(user.password, 10), createdAt: new Date(),
    });
    const response = await request(app).post("/api/auth/login").send({ username: user.username, password: "wrong-password" });
    expect(response.status).toBe(401);
  });

});
