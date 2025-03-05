import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

const prisma = new PrismaClient()

// GET /api/roles - Lấy tất cả roles và thông tin về quyền hạn
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Lấy tất cả roles
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' },
    })
    
    // Lấy thông tin về server templates được phép cho mỗi role
    const roleTemplates = await prisma.roleServerTemplate.findMany({
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
    
    return NextResponse.json(rolesWithTemplates)
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession()

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.CREATE_ROLE)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { name, description, permissions } = await req.json()

    // Check if role already exists
    const existingRole = await prisma.role.findUnique({
      where: {
        name,
      },
    })

    if (existingRole) {
      return NextResponse.json({ message: "Role with this name already exists" }, { status: 409 })
    }

    // Create the role
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions,
      },
    })

    // Create activity log
    await prisma.activity.create({
      data: {
        action: "role_created",
        userId: session.user.id,
        details: { name, permissions },
      },
    })

    return NextResponse.json({ message: "Role created successfully", role }, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

