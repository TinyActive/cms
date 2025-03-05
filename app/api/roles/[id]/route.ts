import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

const prisma = new PrismaClient()

// GET /api/roles/[id] - Lấy thông tin chi tiết của một role
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
    
    // Lấy thông tin role
    const role = await prisma.role.findUnique({
      where: { id },
    })
    
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    
    // Lấy thông tin về server templates được phép cho role này
    const roleTemplates = await prisma.roleServerTemplate.findMany({
      where: { roleId: id },
      include: {
        serverTemplate: true,
      },
    })
    
    const allowedServerTypes = roleTemplates.map(rt => ({
      id: rt.serverTemplateId,
      name: rt.serverTemplate.name,
      maxServers: rt.maxServers,
    }))
    
    return NextResponse.json({
      id: role.id,
      name: role.name,
      maxServers: role.maxServers,
      allowedServerTypes: allowedServerTypes.map(t => t.id),
      permissions: JSON.parse(role.permissions),
    })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH /api/roles/[id] - Cập nhật thông tin role
export async function PATCH(
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
    if (!hasPermission(userPermissions, PERMISSIONS.EDIT_ROLE)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const id = params.id
    const data = await request.json()
    
    // Kiểm tra xem role có tồn tại không
    const existingRole = await prisma.role.findUnique({
      where: { id },
    })
    
    if (!existingRole) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 })
    }
    
    // Cập nhật role
    const updatedRole = await prisma.role.update({
      where: { id },
      data: {
        maxServers: data.maxServers !== undefined ? data.maxServers : existingRole.maxServers,
      },
    })
    
    // Cập nhật liên kết với server templates
    if (data.allowedServerTypes && Array.isArray(data.allowedServerTypes)) {
      // Xóa tất cả liên kết hiện tại
      await prisma.roleServerTemplate.deleteMany({
        where: { roleId: id },
      })
      
      // Tạo liên kết mới
      const templateLinks = data.allowedServerTypes.map((templateId: string) => ({
        roleId: id,
        serverTemplateId: templateId,
        maxServers: data.maxServers || existingRole.maxServers,
      }))
      
      if (templateLinks.length > 0) {
        await prisma.roleServerTemplate.createMany({
          data: templateLinks,
        })
      }
    }
    
    // Ghi log hoạt động
    await prisma.activity.create({
      data: {
        action: "role_updated",
        details: { roleId: id, updates: data },
        userId: session.user.id as string,
      },
    })
    
    return NextResponse.json({
      id: updatedRole.id,
      name: updatedRole.name,
      maxServers: updatedRole.maxServers,
    })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 