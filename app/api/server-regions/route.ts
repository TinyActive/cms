import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db } from "@/lib/db"
import { apiHandler, checkDatabaseConnection } from "@/lib/api-utils"

// GET /api/server-regions - Lấy tất cả server regions
export async function GET() {
  // Kiểm tra kết nối trước khi xử lý
  const isConnected = await checkDatabaseConnection();
  if (!isConnected) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 503 });
  }

  return apiHandler(async () => {
    const session = await getServerSession()
    
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    
    // Lấy tất cả server regions
    const regions = await db.serverRegion.findMany({
      orderBy: { name: 'asc' },
    })
    
    return regions;
  }, "Error fetching server regions");
}

// POST /api/server-regions - Tạo server region mới
export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = await getServerSession()
    
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    
    // Kiểm tra quyền
    const userPermissions = session.user.permissions as string
    if (!hasPermission(userPermissions, PERMISSIONS.EDIT_SERVER_CONFIGS)) {
      throw new Error("Forbidden");
    }
    
    // Lấy dữ liệu từ request
    const data = await request.json()
    
    // Validate dữ liệu
    if (!data.name || !data.location) {
      throw new Error("Invalid data");
    }
    
    // Kiểm tra xem region đã tồn tại chưa
    const existingRegion = await db.serverRegion.findFirst({
      where: { name: data.name },
    })
    
    if (existingRegion) {
      throw new Error("Region already exists");
    }
    
    // Tạo server region mới
    const region = await db.serverRegion.create({
      data: {
        name: data.name,
        location: data.location,
        isActive: data.isActive ?? true,
        isAdminOnly: data.isAdminOnly ?? false,
      },
    })
    
    return region;
  }, "Error creating server region");
} 