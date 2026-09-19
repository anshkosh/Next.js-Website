import { PrismaClient } from "@prisma/client";

//use: npx tsx scripts/set-admin-password.ts --email someone@example.com --password SomePass@99

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const emailFlag = args.indexOf("--email");
  const passwordFlag = args.indexOf("--password");

  if (emailFlag === -1 || !args[emailFlag + 1]) {
    console.error(
      "❌ Usage: npx tsx scripts/set-admin-password.ts --email <email> [--password <password>]",
    );
    process.exit(1);
  }

  const email = args[emailFlag + 1];
  const plainPassword =
    passwordFlag !== -1 && args[passwordFlag + 1]
      ? args[passwordFlag + 1]
      : "Admin@12345678"; // default temporary password

  const { Scrypt } = await import("oslo/password");
  const scrypt = new Scrypt();
  const hashedPassword = await scrypt.hash(plainPassword);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`❌ User "${email}" not found. Run seed first.`);
    process.exit(1);
  }

  const existing = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: { password: hashedPassword },
    });
    console.log(`✅ Password updated for ${email}`);
  } else {
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
    console.log(`✅ Password set for ${email}`);
  }

  console.log(`   Password: ${plainPassword}`);
  if (passwordFlag === -1) {
    console.log(
      `   ⚠️  No --password provided. Default "Admin@123456" was used — change it after login!`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
