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

// Kiểm tra xem db có tồn tại không trước khi khởi tạo
export const db = globalForPrisma.prisma ?? prismaClientSingleton()

// Kiểm tra kết nối ngay khi khởi tạo
try {
  db.$connect();
  console.log("Prisma connected successfully");
} catch (error) {
  console.error("Failed to connect to database:", error);
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

// Kiểm tra model tồn tại
export function hasModel(modelName: string): boolean {
  return typeof db[modelName as keyof typeof db] === 'object' && 
    db[modelName as keyof typeof db] !== null;
}

