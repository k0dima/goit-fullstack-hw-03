import { describe, expect, it } from "vitest";
import { RegisterSchema } from "../../src/validators/auth.validator.ts";
import { CreateAnnouncementSchema } from "../../src/validators/announcements.validator.ts";

describe("Валідація реєстрації", () => {
  const user = {
    username: "ivan_petrenko",
    email: "ivan@example.com",
    password: "password123",
    name: "Іван",
  };

  it("приймає коректні дані", () => {
    expect(RegisterSchema.safeParse(user).success).toBe(true);
  });

  it("відхиляє короткий пароль", () => {
    expect(RegisterSchema.safeParse({ ...user, password: "short" }).success).toBe(false);
  });
});

describe("Валідація оголошення", () => {
  it("перетворює ціну з multipart форми на число", () => {
    const result = CreateAnnouncementSchema.parse({
      title: "Продам велосипед",
      description: "Велосипед у гарному стані",
      price: "8500",
      category: "sale",
    });

    expect(result.price).toBe(8500);
  });
});
