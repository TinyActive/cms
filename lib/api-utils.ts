import { NextResponse } from "next/server";
import { db, checkConnection } from "./db";
import { Prisma } from "@prisma/client";

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

/**
 * Middleware để kiểm tra kết nối database trước khi xử lý request
 */
export async function checkDatabaseConnection() {
  const connected = await checkConnection();
  if (!connected) {
    return NextResponse.json({ 
      error: "Database connection failed", 
    }, { status: 503 });
  }
  return null;
}

/**
 * Handler bọc các API route để xử lý lỗi chung
 */
export function apiHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return async () => {
    // Kiểm tra kết nối database
    const connectionCheck = await checkDatabaseConnection();
    if (connectionCheck) return connectionCheck;

    try {
      return await handler();
    } catch (error) {
      return handlePrismaError(error);
    }
  };
}

/**
 * Xử lý các lỗi Prisma một cách thống nhất
 */
export function handlePrismaError(error: any): NextResponse {
  console.error("Prisma error:", error);

  // Lỗi kết nối
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return NextResponse.json({
      error: "Database connection error",
      message: "Cannot establish connection to the database",
    }, { status: 503 });
  }

  // Lỗi timeout
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2024') {
      return NextResponse.json({
        error: "Database timeout",
        message: "Database query timed out",
      }, { status: 504 });
    }

    // Lỗi không tìm thấy bản ghi
    if (error.code === 'P2001' || error.code === 'P2025') {
      return NextResponse.json({
        error: "Record not found",
        message: error.message,
      }, { status: 404 });
    }

    // Lỗi bản ghi đã tồn tại (vi phạm unique constraint)
    if (error.code === 'P2002') {
      return NextResponse.json({
        error: "Conflict",
        message: `Record already exists with this ${(error.meta?.target as string[])?.join(', ') || 'field'}`,
      }, { status: 409 });
    }

    // Lỗi foreign key
    if (error.code === 'P2003') {
      return NextResponse.json({
        error: "Foreign key constraint failed",
        message: "Referenced record does not exist",
      }, { status: 400 });
    }
  }

  // Lỗi validation
  if (error instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({
      error: "Validation error",
      message: error.message,
    }, { status: 400 });
  }

  // Các lỗi khác
  return NextResponse.json({
    error: "Internal server error",
    message: error.message || "An unexpected error occurred",
  }, { status: 500 });
} 