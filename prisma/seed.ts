import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"
import { PERMISSIONS, ROLES, DEFAULT_ROLE_PERMISSIONS } from "../lib/permissions"

const prisma = new PrismaClient()

async function main() {
  // Create roles
  for (const [roleName, perms] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: { permissions: JSON.stringify(perms) },
      create: {
        name: roleName,
        permissions: JSON.stringify(perms),
      },
    })
  }

  // Create admin user
  const adminRole = await prisma.role.findUnique({ where: { name: ROLES.ADMIN } })
  if (!adminRole) throw new Error("Admin role not found")

  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword123"
  const hashedAdminPassword = await hash(adminPassword, 10)

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedAdminPassword,
      roleId: adminRole.id,
      balance: 100, // Starting balance for admin
    },
  })

  // Create regular user
  const userRole = await prisma.role.findUnique({ where: { name: ROLES.USER } })
  if (!userRole) throw new Error("User role not found")

  const userPassword = "userpassword123"
  const hashedUserPassword = await hash(userPassword, 10)

  const regularUser = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      name: "Regular User",
      email: "user@example.com",
      password: hashedUserPassword,
      roleId: userRole.id,
      balance: 50, // Starting balance for regular user
    },
  })

  // Create sample VPS for admin
  await prisma.vPS.create({
    data: {
      digitalOceanId: "123456789",
      name: "Admin VPS",
      status: "active",
      ip: "192.168.1.1",
      region: "nyc3",
      size: "s-1vcpu-1gb",
      userId: adminUser.id,
    },
  })

  // Create sample VPS for regular user
  await prisma.vPS.create({
    data: {
      digitalOceanId: "987654321",
      name: "User VPS",
      status: "active",
      ip: "192.168.1.2",
      region: "sfo2",
      size: "s-1vcpu-1gb",
      userId: regularUser.id,
    },
  })

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        amount: 100,
        type: "DEPOSIT",
        status: "COMPLETED",
        userId: adminUser.id,
      },
      {
        amount: 50,
        type: "DEPOSIT",
        status: "COMPLETED",
        userId: regularUser.id,
      },
    ],
  })

  // Create sample Telegram notification settings
  await prisma.telegramNotification.createMany({
    data: [
      {
        chatId: "admin_chat_id",
        userId: adminUser.id,
      },
      {
        chatId: "user_chat_id",
        userId: regularUser.id,
      },
    ],
  })

  console.log("Database has been seeded with sample data.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

