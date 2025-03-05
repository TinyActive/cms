import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db } from "@/lib/db"
import { apiHandler, checkDatabaseConnection } from "@/lib/api-utils"

// GET /api/server-templates - Lấy tất cả server templates
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
    
    // Lấy tất cả server templates
    const templates = await db.serverTemplate.findMany({
      orderBy: { name: 'asc' },
    })
    
    // Lấy thông tin về quyền truy cập của từng role
    const roleTemplates = await db.roleServerTemplate.findMany({
      include: {
        role: true,
      },
    })
    
    // Trả về dữ liệu
    return templates;
  }, "Error fetching server templates");
}

// POST /api/server-templates - Tạo server template mới
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
    if (!data.name || data.cpu <= 0 || data.ram <= 0 || data.disk <= 0 || data.price < 0) {
      throw new Error("Invalid data");
    }
    
    // Tạo server template mới
    const template = await db.serverTemplate.create({
      data: {
        name: data.name,
        cpu: data.cpu,
        ram: data.ram,
        disk: data.disk,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    })
    
    // Tạo liên kết với các role
    if (data.availableRoles && Array.isArray(data.availableRoles)) {
      const roleLinks = data.availableRoles.map((roleId: string) => ({
        roleId,
        serverTemplateId: template.id,
        maxServers: 10, // Default value
      }))
      
      await db.roleServerTemplate.createMany({
        data: roleLinks,
      })
    }
    
    return template;
  }, "Error creating server template");
} 