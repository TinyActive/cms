import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import {
  getDroplet,
  deleteDroplet,
  powerOnDroplet,
  powerOffDroplet,
  rebootDroplet,
  calculatePrice,
  Droplet as DODroplet
} from "@/lib/digitalocean"

// Hàm chuyển đổi dữ liệu (để giữ nhất quán với route.ts)
function transformDroplet(doDroplet: DODroplet) {
  // Lấy IPv4 address
  const ipv4Address = doDroplet.networks?.v4?.find(network => network.type === 'public')?.ip_address || null;
  
  return {
    id: doDroplet.id,
    name: doDroplet.name,
    status: doDroplet.status,
    memory: doDroplet.memory,
    vcpus: doDroplet.vcpus,
    disk: doDroplet.disk,
    region: {
      slug: doDroplet.region.slug,
      name: doDroplet.region.name,
    },
    image: {
      id: doDroplet.image.id,
      name: doDroplet.image.name,
      distribution: doDroplet.image.distribution,
    },
    size_slug: doDroplet.size_slug,
    ip: ipv4Address,
    created_at: doDroplet.created_at,
    price_monthly: doDroplet.size?.price_monthly || 0,
    price_with_markup: calculatePrice(doDroplet.size?.price_monthly || 0),
  };
}

// GET /api/digitalocean/droplets/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view droplets" 
      }, { status: 403 })
    }

    const { id } = params
    const dropletId = parseInt(id)
    
    if (isNaN(dropletId)) {
      return NextResponse.json({ message: "Invalid droplet ID" }, { status: 400 })
    }

    // Kiểm tra droplet có thuộc về user hiện tại không
    const dbDroplet = await db.droplet.findFirst({
      where: { 
        doId: dropletId,
        userId: session.user.id as string
      }
    })

    if (!dbDroplet) {
      return NextResponse.json({ message: "Droplet not found" }, { status: 404 })
    }

    // Lấy thông tin chi tiết từ DigitalOcean
    const doDroplet = await getDroplet(dropletId)
    
    // Kết hợp dữ liệu
    const transformedDroplet = transformDroplet(doDroplet)
    
    const droplet = {
      ...transformedDroplet,
      originalPrice: (dbDroplet as any).originalPrice,
      price: (dbDroplet as any).price,
      nextBillingDate: (dbDroplet as any).nextBillingDate,
    }

    return NextResponse.json({ droplet })
  } catch (error: any) {
    console.error(`Error fetching droplet ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to fetch droplet", 
      message: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/digitalocean/droplets/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.DELETE_DROPLET)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to delete droplets" 
      }, { status: 403 })
    }

    const { id } = params
    const dropletId = parseInt(id)
    
    if (isNaN(dropletId)) {
      return NextResponse.json({ message: "Invalid droplet ID" }, { status: 400 })
    }

    // Kiểm tra droplet có thuộc về user hiện tại không
    const dbDroplet = await db.droplet.findFirst({
      where: { 
        doId: dropletId,
        userId: session.user.id as string
      }
    })

    if (!dbDroplet) {
      return NextResponse.json({ message: "Droplet not found" }, { status: 404 })
    }

    // Xóa droplet trên DigitalOcean
    await deleteDroplet(dropletId)
    
    // Xóa droplet trong database
    await db.droplet.delete({
      where: { id: dbDroplet.id }
    })

    return NextResponse.json({ 
      message: "Droplet deleted successfully" 
    })
  } catch (error: any) {
    console.error(`Error deleting droplet ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to delete droplet", 
      message: error.message 
    }, { status: 500 })
  }
}

// POST /api/digitalocean/droplets/[id]/power
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.POWER_DROPLET)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to power droplets" 
      }, { status: 403 })
    }

    const { id } = params
    const dropletId = parseInt(id)
    
    if (isNaN(dropletId)) {
      return NextResponse.json({ message: "Invalid droplet ID" }, { status: 400 })
    }

    // Kiểm tra droplet có thuộc về user hiện tại không
    const dbDroplet = await db.droplet.findFirst({
      where: { 
        doId: dropletId,
        userId: session.user.id as string 
      }
    })

    if (!dbDroplet) {
      return NextResponse.json({ message: "Droplet not found" }, { status: 404 })
    }

    // Lấy hành động từ body
    const data = await request.json()
    const action = data.action
    
    if (!action || !['power_on', 'power_off', 'reboot'].includes(action)) {
      return NextResponse.json({ 
        message: "Invalid action. Must be one of: power_on, power_off, reboot" 
      }, { status: 400 })
    }

    // Thực hiện hành động
    switch (action) {
      case 'power_on':
        await powerOnDroplet(dropletId)
        // Cập nhật status trong database
        await db.droplet.update({
          where: { id: dbDroplet.id },
          data: { status: 'active' }
        })
        break
      case 'power_off':
        await powerOffDroplet(dropletId)
        // Cập nhật status trong database
        await db.droplet.update({
          where: { id: dbDroplet.id },
          data: { status: 'off' }
        })
        break
      case 'reboot':
        await rebootDroplet(dropletId)
        break
    }

    return NextResponse.json({ 
      message: `Droplet ${action} action initiated successfully` 
    })
  } catch (error: any) {
    console.error(`Error performing action on droplet ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to perform action on droplet", 
      message: error.message 
    }, { status: 500 })
  }
} 