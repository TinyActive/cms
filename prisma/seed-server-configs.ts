import { PrismaClient } from "@prisma/client"
import { ROLES } from "../lib/permissions"

const prisma = new PrismaClient()

async function main() {
  // Reset existing data (optional, comment out if you want to keep existing data)
  await prisma.roleServerTemplate.deleteMany({})
  await prisma.serverTemplate.deleteMany({})
  await prisma.serverRegion.deleteMany({})

  // Get roles
  const roles = await prisma.role.findMany()
  const adminRole = roles.find(role => role.name === ROLES.ADMIN)
  const userRole = roles.find(role => role.name === ROLES.USER)
  const supportRole = roles.find(role => role.name === ROLES.SUPPORT)
  const readonlyRole = roles.find(role => role.name === ROLES.READONLY)

  if (!adminRole || !userRole || !supportRole || !readonlyRole) {
    throw new Error("One or more roles not found. Please run the main seed first.")
  }

  // Set max servers count for each role
  await prisma.role.update({
    where: { id: adminRole.id },
    data: { maxServers: 10 },
  })
  
  await prisma.role.update({
    where: { id: userRole.id },
    data: { maxServers: 3 },
  })
  
  await prisma.role.update({
    where: { id: supportRole.id },
    data: { maxServers: 0 },
  })
  
  await prisma.role.update({
    where: { id: readonlyRole.id },
    data: { maxServers: 0 },
  })

  // Create server templates
  const basicTemplate = await prisma.serverTemplate.create({
    data: {
      name: "Basic",
      cpu: 1,
      ram: 1,
      disk: 25,
      price: 5.00,
      isActive: true,
    },
  })

  const standardTemplate = await prisma.serverTemplate.create({
    data: {
      name: "Standard",
      cpu: 2,
      ram: 2,
      disk: 50,
      price: 10.00,
      isActive: true,
    },
  })

  const premiumTemplate = await prisma.serverTemplate.create({
    data: {
      name: "Premium",
      cpu: 4,
      ram: 8,
      disk: 160,
      price: 40.00,
      isActive: true,
    },
  })

  const highMemoryTemplate = await prisma.serverTemplate.create({
    data: {
      name: "High Memory",
      cpu: 8,
      ram: 16,
      disk: 320,
      price: 80.00,
      isActive: true,
    },
  })

  const cpuOptimizedTemplate = await prisma.serverTemplate.create({
    data: {
      name: "CPU Optimized",
      cpu: 8,
      ram: 8,
      disk: 160,
      price: 60.00,
      isActive: true,
    },
  })

  // Create role-template relationships
  // Admin can use all templates
  await prisma.roleServerTemplate.createMany({
    data: [
      { roleId: adminRole.id, serverTemplateId: basicTemplate.id, maxServers: 10 },
      { roleId: adminRole.id, serverTemplateId: standardTemplate.id, maxServers: 10 },
      { roleId: adminRole.id, serverTemplateId: premiumTemplate.id, maxServers: 5 },
      { roleId: adminRole.id, serverTemplateId: highMemoryTemplate.id, maxServers: 3 },
      { roleId: adminRole.id, serverTemplateId: cpuOptimizedTemplate.id, maxServers: 3 },
    ],
  })

  // Regular users can only use basic and standard templates
  await prisma.roleServerTemplate.createMany({
    data: [
      { roleId: userRole.id, serverTemplateId: basicTemplate.id, maxServers: 3 },
      { roleId: userRole.id, serverTemplateId: standardTemplate.id, maxServers: 1 },
    ],
  })

  // Create server regions
  await prisma.serverRegion.createMany({
    data: [
      { name: "nyc1", location: "New York, USA", isActive: true, isAdminOnly: false },
      { name: "sfo2", location: "San Francisco, USA", isActive: true, isAdminOnly: false },
      { name: "ams3", location: "Amsterdam, Netherlands", isActive: true, isAdminOnly: true },
      { name: "sgp1", location: "Singapore", isActive: true, isAdminOnly: false },
      { name: "lon1", location: "London, UK", isActive: false, isAdminOnly: false },
    ],
  })

  console.log("Server configurations have been seeded with sample data.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 