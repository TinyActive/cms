import { db } from './db';
import { Prisma } from '@prisma/client';

/**
 * Thiết lập middleware cho Prisma để xử lý lỗi
 * Gọi hàm này khi khởi động ứng dụng
 */
export function setupPrismaMiddleware() {
  // Middleware xử lý trước khi query
  db.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      // Log lỗi chi tiết
      console.error(`Prisma query error in ${params.model}.${params.action}:`, error);
      
      // Thêm thông tin vào lỗi để dễ debug
      if (error instanceof Error) {
        error.message = `[${params.model}.${params.action}] ${error.message}`;
      }
      
      // Ném lại lỗi để được xử lý ở tầng cao hơn
      throw error;
    }
  });
  
  // Middleware xử lý timeout
  db.$use(async (params, next) => {
    const timeout = 30000; // 30 giây
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(
          new Prisma.PrismaClientKnownRequestError(
            `Query timeout after ${timeout}ms`,
            {
              code: 'P2024',
              clientVersion: Prisma.prismaVersion.client,
            }
          )
        );
      }, timeout);
    });
    
    // Race giữa query và timeout
    try {
      return await Promise.race([next(params), timeoutPromise]);
    } catch (error) {
      // Nếu lỗi timeout, thêm thông tin model và action
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2024') {
        console.error(`Prisma query timeout in ${params.model}.${params.action}`);
      }
      throw error;
    }
  });
  
  // Middleware retry query nếu gặp lỗi kết nối
  db.$use(async (params, next) => {
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await next(params);
      } catch (error) {
        retries++;
        
        // Chỉ retry đối với lỗi kết nối
        const isConnectionError = 
          error instanceof Prisma.PrismaClientInitializationError ||
          error instanceof Prisma.PrismaClientRustPanicError ||
          (error instanceof Prisma.PrismaClientKnownRequestError && 
           ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code));
        
        if (!isConnectionError || retries >= maxRetries) {
          throw error;
        }
        
        // Thời gian chờ tăng dần
        const delay = retries * 1000;
        console.log(`Retrying Prisma query (${retries}/${maxRetries}) after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  });
  
  console.log('Prisma middleware configured successfully');
}

/**
 * Khởi tạo Prisma với middleware và kiểm tra kết nối
 * Gọi hàm này trong file app startup
 */
export async function initializePrisma() {
  try {
    setupPrismaMiddleware();
    
    // Thử kết nối đến database
    await db.$queryRaw`SELECT 1`;
    console.log('Prisma connected successfully');
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Prisma:', error);
    return false;
  }
} 