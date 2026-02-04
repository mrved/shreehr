import bcrypt from "bcrypt";
import { prisma } from "./db";

async function seedAdmin() {
  const email = "admin@shreehr.local";
  const password = "admin123"; // Change in production!

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Admin user already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: "Admin User",
      password_hash: passwordHash,
      role: "ADMIN",
      is_active: true,
    },
  });

  console.log("Admin user created:", email);
  console.log("Password:", password);
}

seedAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
