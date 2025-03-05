import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  addDropletsToFirewall,
  removeDropletsFromFirewall
} from "@/lib/digitalocean"

// POST /api/digitalocean/firewalls/[id]/droplets
// Thêm droplets vào firewall
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
    
    if (!hasPermission(permissions, PERMISSIONS.EDIT_FIREWALL)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to edit firewalls" 
      }, { status: 403 })
    }

    const { id } = params
    const data = await request.json()
    
    if (!data.dropletIds || !Array.isArray(data.dropletIds) || data.dropletIds.length === 0) {
      return NextResponse.json({ 
        message: "At least one droplet ID is required" 
      }, { status: 400 })
    }
    
    // Gọi DigitalOcean API
    await addDropletsToFirewall(id, data.dropletIds);
    
    // Cập nhật các liên kết trong database
    const firewall = await db.firewall.findUnique({
      where: { doId: id }
    });
    
    if (!firewall) {
      return NextResponse.json({ 
        message: "Firewall not found in database" 
      }, { status: 404 })
    }
    
    // Lấy các droplet từ database
    const droplets = await db.droplet.findMany({
      where: {
        doId: {
          in: data.dropletIds
        }
      }
    });
    
    // Tạo các liên kết mới
    for (const droplet of droplets) {
      await db.firewallDroplet.upsert({
        where: {
          firewallId_dropletId: {
            firewallId: firewall.id,
            dropletId: droplet.id
          }
        },
        update: {},
        create: {
          firewallId: firewall.id,
          dropletId: droplet.id
        }
      });
    }
    
    return NextResponse.json({ 
      message: "Droplets added to firewall successfully" 
    })
  } catch (error: any) {
    console.error(`Error adding droplets to firewall ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to add droplets to firewall", 
      message: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/digitalocean/firewalls/[id]/droplets
// Xóa droplets khỏi firewall
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
    
    if (!hasPermission(permissions, PERMISSIONS.EDIT_FIREWALL)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to edit firewalls" 
      }, { status: 403 })
    }

    const { id } = params
    const data = await request.json()
    
    if (!data.dropletIds || !Array.isArray(data.dropletIds) || data.dropletIds.length === 0) {
      return NextResponse.json({ 
        message: "At least one droplet ID is required" 
      }, { status: 400 })
    }
    
    // Gọi DigitalOcean API
    await removeDropletsFromFirewall(id, data.dropletIds);
    
    // Cập nhật các liên kết trong database
    const firewall = await db.firewall.findUnique({
      where: { doId: id }
    });
    
    if (!firewall) {
      return NextResponse.json({ 
        message: "Firewall not found in database" 
      }, { status: 404 })
    }
    
    // Lấy các droplet từ database
    const droplets = await db.droplet.findMany({
      where: {
        doId: {
          in: data.dropletIds
        }
      }
    });
    
    // Xóa các liên kết
    for (const droplet of droplets) {
      await db.firewallDroplet.deleteMany({
        where: {
          firewallId: firewall.id,
          dropletId: droplet.id
        }
      });
    }
    
    return NextResponse.json({ 
      message: "Droplets removed from firewall successfully" 
    })
  } catch (error: any) {
    console.error(`Error removing droplets from firewall ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to remove droplets from firewall", 
      message: error.message 
    }, { status: 500 })
  }
} 