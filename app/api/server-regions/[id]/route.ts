import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { PrismaClient } from "@prisma/client"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

const prisma = new PrismaClient()

// GET /api/server-regions/[id] - Lấy thông tin chi tiết của một server region
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
    
    // Lấy thông tin region
    const region = await prisma.serverRegion.findUnique({
      where: { id },
    })
    
    if (!region) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 })
    }
    
    return NextResponse.json(region)
  } catch (error) {
    console.error("Error fetching server region:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// PATCH /api/server-regions/[id] - Cập nhật thông tin server region
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
    if (!hasPermission(userPermissions, PERMISSIONS.EDIT_SERVER_CONFIGS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const id = params.id
    const data = await request.json()
    
    // Kiểm tra xem region có tồn tại không
    const existingRegion = await prisma.serverRegion.findUnique({
      where: { id },
    })
    
    if (!existingRegion) {
      return NextResponse.json({ error: "Region not found" }, { status: 404 })
    }
    
    // Cập nhật region
    const updatedRegion = await prisma.serverRegion.update({
      where: { id },
      data: {
        isActive: data.isActive !== undefined ? data.isActive : existingRegion.isActive,
        isAdminOnly: data.isAdminOnly !== undefined ? data.isAdminOnly : existingRegion.isAdminOnly,
        location: data.location || existingRegion.location,
      },
    })
    
    return NextResponse.json(updatedRegion)
  } catch (error) {
    console.error("Error updating server region:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE /api/server-regions/[id] - Xóa server region
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
    
    // Xóa region
    await prisma.serverRegion.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting server region:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
} 