import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db } from "@/lib/db"

// GET /api/server-templates - Lấy tất cả server templates
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    return NextResponse.json(templates)
  } catch (error) {
    console.error("Error fetching server templates:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/server-templates - Tạo server template mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Kiểm tra quyền
    const userPermissions = session.user.permissions as string
    if (!hasPermission(userPermissions, PERMISSIONS.EDIT_SERVER_CONFIGS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Lấy dữ liệu từ request
    const data = await request.json()
    
    // Validate dữ liệu
    if (!data.name || data.cpu <= 0 || data.ram <= 0 || data.disk <= 0 || data.price < 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
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
    
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating server template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 