import { PrismaClient } from "@prisma/client"

// PrismaClient là một singleton để tránh nhiều kết nối trong dev
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Xử lý thêm các tùy chọn kết nối
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

