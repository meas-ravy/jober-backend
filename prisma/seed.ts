import "dotenv/config";
import prisma from "@/src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const passwordHash = await bcrypt.hash("iamStudy!", 10);

  const admins = [
    {
      email: "admin@gmail.com",
      name: "Owner System",
      avatarUrl: null,
    },
    {
      email: "testing@gmail.com",
      name: "Testing",
      avatarUrl: null,
    },
  ];

  for (const admin of admins) {
    const email = admin.email.trim().toLowerCase();

    await prisma.adminUser.upsert({
      where: { email },
      update: {
        passwordHash,
        name: admin.name ?? null,
        avatarUrl: admin.avatarUrl ?? null,
      },
      create: {
        email,
        passwordHash,
        name: admin.name ?? null,
        avatarUrl: admin.avatarUrl ?? null,
      },
    });
  }

  const adminEmails = admins.map(admin => admin.email).join(", ");
  // eslint-disable-next-line no-console
  console.log(`Admin users ready: ${adminEmails}`);
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
