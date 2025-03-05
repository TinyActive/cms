import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

const prisma = new PrismaClient()

// GET /api/server-templates/[id] - Lấy thông tin chi tiết của một server template
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const id = params.id
    
    // Lấy thông tin template
    const template = await prisma.serverTemplate.findUnique({
      where: { id },
    })
    
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    
    // Lấy thông tin về các role được phép sử dụng template này
    const roleTemplates = await prisma.roleServerTemplate.findMany({
      where: { serverTemplateId: id },
      include: {
        role: true,
      },
    })
    
    const availableRoles = roleTemplates.map(rt => ({
      id: rt.roleId,
      name: rt.role.name,
      maxServers: rt.maxServers,
    }))
    
    return NextResponse.json({
      ...template,
      availableRoles,
    })
  } catch (error) {
    console.error("Error fetching server template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PUT /api/server-templates/[id] - Cập nhật thông tin server template
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id
    const data = await request.json()
    
    // Validate dữ liệu
    if (!data.name || data.cpu <= 0 || data.ram <= 0 || data.disk <= 0 || data.price < 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    
    // Kiểm tra xem template có tồn tại không
    const existingTemplate = await prisma.serverTemplate.findUnique({
      where: { id },
    })
    
    if (!existingTemplate) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 })
    }
    
    // Cập nhật template
    const updatedTemplate = await prisma.serverTemplate.update({
      where: { id },
      data: {
        name: data.name,
        cpu: data.cpu,
        ram: data.ram,
        disk: data.disk,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    })
    
    // Cập nhật liên kết với các role
    if (data.availableRoles && Array.isArray(data.availableRoles)) {
      // Xóa tất cả liên kết hiện tại
      await prisma.roleServerTemplate.deleteMany({
        where: { serverTemplateId: id },
      })
      
      // Tạo liên kết mới
      const roleLinks = data.availableRoles.map((roleId: string) => ({
        roleId,
        serverTemplateId: id,
        maxServers: 10, // Default value
      }))
      
      await prisma.roleServerTemplate.createMany({
        data: roleLinks,
      })
    }
    
    return NextResponse.json(updatedTemplate)
  } catch (error) {
    console.error("Error updating server template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/server-templates/[id] - Xóa server template
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    
    const id = params.id
    
    // Xóa tất cả liên kết với các role
    await prisma.roleServerTemplate.deleteMany({
      where: { serverTemplateId: id },
    })
    
    // Xóa template
    await prisma.serverTemplate.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting server template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 