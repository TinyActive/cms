import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"
import { ROLES, DEFAULT_ROLE_PERMISSIONS } from "../lib/permissions"

const prisma = new PrismaClient()

async function main() {
  // Create roles
  for (const [roleName, permissions] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: { permissions },
      create: {
        name: roleName,
        permissions,
      },
    })
  }

  // Create admin user
  const adminRole = await prisma.role.findUnique({ where: { name: ROLES.ADMIN } })
  if (!adminRole) throw new Error("Admin role not found")

  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword123"
  const hashedPassword = await hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      roleId: adminRole.id,
    },
  })

  console.log("Database has been seeded.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

