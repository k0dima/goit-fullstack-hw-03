import bcrypt from "bcrypt";
import prisma from "./prisma/client.ts";

async function main() {
  const user1 = await prisma.user.create({
    data: {
      name: "user1",
      username: "username1",
      email: "user1@test.com",
      password: await bcrypt.hash("password", 10),
    },
  });
  const user2 = await prisma.user.create({
    data: {
      name: "user2",
      username: "username2",
      email: "user2@test.com",
      password: await bcrypt.hash("password", 10),
    },
  });

  const categories = ["sale", "service", "job", "other"] as const;

  for (const user of [user1, user2]) {
    for (let i = 1; i <= 5; i++) {
      await prisma.announcement.create({
        data: {
          title: `Title announcement ${i}`,
          description: `Description for announcement ${i}`,
          price: Math.floor(Math.random() * 1000) + 1,
          category: categories[Math.floor(Math.random() * categories.length)],
          imageUrl: i % 2 === 0 ? "https://res.cloudinary.com/demo/image/upload/sample.jpg" : null,
          userId: user.id,
        },
      });
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
} finally {
  await prisma.$disconnect();
}
