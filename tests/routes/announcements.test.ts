import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../app.ts";
import prisma from "../../prisma/client.ts";

vi.mock("../../prisma/client.ts", () => ({
  default: { announcement: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Announcements API", () => {
  it("захищає створення оголошення без токена", async () => {
    const response = await request(app).post("/api/announcements").send({});
    expect(response.status).toBe(401);
  });

  const token = () => jwt.sign({ sub: "1", type: "access" }, "test-secret");
  const announcement = {
    id: 10, title: "Продам велосипед", description: "Велосипед у гарному стані",
    price: 8500, category: "sale", imageUrl: "https://example.com/image.jpg",
    userId: 1, createdAt: new Date(), updatedAt: new Date(),
    user: { id: 1, username: "olena", email: "olena@example.com", name: "Олена" },
  };

  it("створює оголошення без фото через multipart", async () => {
    vi.mocked(prisma.announcement.create).mockResolvedValue({ ...announcement, imageUrl: null });
    const response = await request(app).post("/api/announcements")
      .set("Authorization", `Bearer ${token()}`)
      .field("title", announcement.title)
      .field("description", announcement.description)
      .field("price", "8500")
      .field("category", "sale");

    expect(response.status).toBe(201);
    expect(response.body.imageUrl).toBeNull();
    expect(prisma.announcement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ price: 8500, imageUrl: null }),
    }));
  });

  it("не змінює фото при оновленні без нового файлу", async () => {
    vi.mocked(prisma.announcement.findUnique).mockResolvedValue(announcement);
    vi.mocked(prisma.announcement.update).mockResolvedValue({ ...announcement, title: "Нова назва" });
    const response = await request(app).patch("/api/announcements/10")
      .set("Authorization", `Bearer ${token()}`)
      .field("title", "Нова назва");

    expect(response.status).toBe(200);
    expect(response.body.imageUrl).toBe(announcement.imageUrl);
    expect(prisma.announcement.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ imageUrl: undefined }),
    }));
  });
});
