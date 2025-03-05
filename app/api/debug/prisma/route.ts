import { NextResponse } from "next/server";
import { checkPrismaTables } from "@/lib/prisma-check";
import { db } from "@/lib/db";

// GET /api/debug/prisma - Kiểm tra kết nối Prisma
export async function GET() {
  try {
    // Kiểm tra kết nối cơ bản
    const testConnection = await db.$queryRaw`SELECT 1 as test`;
    
    // Kiểm tra chi tiết các bảng
    const schemaCheck = await checkPrismaTables();
    
    // Kiểm tra danh sách bảng từ cơ sở dữ liệu
    const tables = await db.$queryRaw`SHOW TABLES`;
    
    return NextResponse.json({
      connection: testConnection,
      schemaCheck,
      tables,
      prismaClientType: typeof db,
      prismaModels: Object.keys(db).filter(key => 
        !key.startsWith('$') && 
        !key.startsWith('_')
      ),
    });
  } catch (error) {
    console.error("Error checking Prisma connection:", error);
    return NextResponse.json({ 
      error: error.message, 
      stack: error.stack,
      type: error.constructor.name
    }, { status: 500 });
  }
} 