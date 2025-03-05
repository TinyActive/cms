import { PrismaClient } from "@prisma/client"

// PrismaClient là một singleton để tránh nhiều kết nối trong dev
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
}

// Xử lý thêm các tùy chọn kết nối và retry logic
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Thêm cấu hình tăng timeout và retry để tránh lỗi kết nối
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// Kiểm tra xem db có tồn tại không trước khi khởi tạo
export const db = globalForPrisma.prisma ?? prismaClientSingleton()

// Không gọi $connect ở đây vì nó có thể gây ra lỗi khi khởi động ứng dụng
// Prisma sẽ tự động kết nối khi cần thiết

// Kiểm tra kết nối async an toàn
export async function checkConnection(): Promise<boolean> {
  try {
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// Hàm truy vấn an toàn với retry
export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  retries = 3
): Promise<{ data: T | null; error: Error | null }> {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      const data = await queryFn();
      return { data, error: null };
    } catch (error) {
      attempt++;
      console.error(`Query error (attempt ${attempt}/${retries}):`, error);
      
      // Nếu hết số lần thử, trả về lỗi
      if (attempt >= retries) {
        return { data: null, error: error as Error };
      }
      
      // Chờ một khoảng thời gian trước khi thử lại
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return { data: null, error: new Error("Maximum retries exceeded") };
}

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
}

// Kiểm tra model tồn tại
export function hasModel(modelName: string): boolean {
  return typeof db[modelName as keyof typeof db] === 'object' && 
    db[modelName as keyof typeof db] !== null;
}

