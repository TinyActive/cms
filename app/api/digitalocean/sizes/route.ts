import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { getSizes, calculatePrice } from "@/lib/digitalocean"

// GET /api/digitalocean/sizes
// Lấy danh sách các size (cấu hình) có sẵn với giá gốc và giá sau markup
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view droplet sizes" 
      }, { status: 403 })
    }

    // Lấy danh sách sizes từ DigitalOcean API
    const doSizes = await getSizes();
    
    // Thêm giá sau markup 20%
    const sizes = doSizes.map(size => ({
      ...size,
      original_price_monthly: size.price_monthly,
      price_monthly: calculatePrice(size.price_monthly),
      original_price_hourly: size.price_hourly,
      price_hourly: calculatePrice(size.price_hourly),
    }));

    return NextResponse.json({ sizes })
  } catch (error: any) {
    console.error("Error fetching sizes:", error);
    return NextResponse.json({ 
      error: "Failed to fetch droplet sizes", 
      message: error.message 
    }, { status: 500 })
  }
} 