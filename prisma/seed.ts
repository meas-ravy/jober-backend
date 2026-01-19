import "dotenv/config";
import prisma from "@/src/lib/prisma";
import { email } from "zod";
import bcrypt from "bcryptjs";

async function main() {
  const defaultPassword = await bcrypt.hash("password123!", 10);

  const admins = [
    { email: "admin@gmail.com", password: defaultPassword },
    { email: "testing@gmail.com", password: defaultPassword },
  ];

  for (const admin of admins) {
    const email = admin.email.trim().toLowerCase();
    const passwordHash = defaultPassword;

    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Admin user ready: ${email}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
