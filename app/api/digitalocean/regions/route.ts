import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { getRegions } from "@/lib/digitalocean"

// GET /api/digitalocean/regions
// Lấy danh sách các regions (vùng) có sẵn
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view regions" 
      }, { status: 403 })
    }

    // Lấy danh sách regions từ DigitalOcean API
    const regions = await getRegions();
    
    // Thêm thông tin display name cho dễ đọc
    const enhancedRegions = regions.map(region => {
      let displayName = region.name;
      
      // Thêm thông tin vùng dựa trên slug
      if (region.slug.startsWith('nyc')) {
        displayName = `New York (${region.name})`;
      } else if (region.slug.startsWith('sfo')) {
        displayName = `San Francisco (${region.name})`;
      } else if (region.slug.startsWith('ams')) {
        displayName = `Amsterdam (${region.name})`;
      } else if (region.slug.startsWith('sgp')) {
        displayName = `Singapore (${region.name})`;
      } else if (region.slug.startsWith('lon')) {
        displayName = `London (${region.name})`;
      } else if (region.slug.startsWith('fra')) {
        displayName = `Frankfurt (${region.name})`;
      } else if (region.slug.startsWith('tor')) {
        displayName = `Toronto (${region.name})`;
      } else if (region.slug.startsWith('blr')) {
        displayName = `Bangalore (${region.name})`;
      }
      
      return {
        ...region,
        displayName
      };
    });

    return NextResponse.json({ regions: enhancedRegions })
  } catch (error: any) {
    console.error("Error fetching regions:", error);
    return NextResponse.json({ 
      error: "Failed to fetch regions", 
      message: error.message 
    }, { status: 500 })
  }
} 