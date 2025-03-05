import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Hàm giúp xử lý lỗi Prisma một cách nhất quán
export async function withErrorHandling<T>(
  handler: () => Promise<T>,
  errorMessage: string = "Internal server error"
): Promise<{ data?: T; error?: string; status: number }> {
  try {
    const data = await handler();
    return { data, status: 200 };
  } catch (error) {
    console.error(`API Error: ${errorMessage}`, error);
    return { error: errorMessage, status: 500 };
  }
}

// Kiểm tra kết nối database
export async function checkDatabaseConnection() {
  try {
    // Thực hiện một truy vấn đơn giản để kiểm tra kết nối
    await db.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// Hàm wrapper cho API routes để đảm bảo xử lý lỗi và kết nối DB
export async function apiHandler<T>(
  handler: () => Promise<T>,
  errorMessage: string = "Internal server error"
): Promise<NextResponse> {
  // Kiểm tra kết nối trước khi thực hiện handler
  const isConnected = await checkDatabaseConnection();
  
  if (!isConnected) {
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 503 }
    );
  }
  
  const result = await withErrorHandling(handler, errorMessage);
  
  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status }
    );
  }
  
  return NextResponse.json(result.data);
} 