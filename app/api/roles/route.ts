import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db } from "@/lib/db"
import { apiHandler, checkDatabaseConnection } from "@/lib/api-utils"

// GET /api/roles - Lấy tất cả roles và thông tin về quyền hạn
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
    
    // Lấy tất cả roles
    const roles = await db.role.findMany({
      orderBy: { name: 'asc' },
    })
    
    // Lấy thông tin về server templates được phép cho mỗi role
    const roleTemplates = await db.roleServerTemplate.findMany({
      include: {
        serverTemplate: true,
      },
    })
    
    // Tạo danh sách roles với thông tin về server templates
    const rolesWithTemplates = roles.map(role => {
      const templates = roleTemplates
        .filter(rt => rt.roleId === role.id)
        .map(rt => rt.serverTemplate.id)
      
      return {
        id: role.id,
        name: role.name,
        maxServers: role.maxServers,
        allowedServerTypes: templates,
      }
    })
    
    return rolesWithTemplates;
  }, "Error fetching roles");
}

export async function POST(req: Request) {
  return apiHandler(async () => {
    const session = await getServerSession()

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.CREATE_ROLE)) {
      throw new Error("Unauthorized");
    }

    const { name, description, permissions } = await req.json()

    // Check if role already exists
    const existingRole = await db.role.findUnique({
      where: {
        name,
      },
    })

    if (existingRole) {
      throw new Error("Role with this name already exists");
    }

    // Create the role
    const role = await db.role.create({
      data: {
        name,
        description,
        permissions,
      },
    })

    // Create activity log
    await db.activity.create({
      data: {
        action: "role_created",
        userId: session.user.id,
        details: { name, permissions },
      },
    })

    return { message: "Role created successfully", role };
  }, "Error creating role");
}

