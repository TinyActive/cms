import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db } from "@/lib/db"

// GET /api/server-regions - Lấy tất cả server regions
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Lấy tất cả server regions
    const regions = await db.serverRegion.findMany({
      orderBy: { name: 'asc' },
    })
    
    return NextResponse.json(regions)
  } catch (error) {
    console.error("Error fetching server regions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/server-regions - Tạo server region mới
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
    if (!data.name || !data.location) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    
    // Kiểm tra xem region đã tồn tại chưa
    const existingRegion = await db.serverRegion.findFirst({
      where: { name: data.name },
    })
    
    if (existingRegion) {
      return NextResponse.json({ error: "Region already exists" }, { status: 409 })
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
    
    return NextResponse.json(region, { status: 201 })
  } catch (error) {
    console.error("Error creating server region:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 