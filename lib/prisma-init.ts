import { setupPrismaMiddleware } from './prisma-middleware';

// Khởi tạo Prisma middleware ngay khi file được import
// Điều này sẽ chạy một lần khi ứng dụng khởi động
setupPrismaMiddleware();

export default {}; 