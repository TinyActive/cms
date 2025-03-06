import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { getImages } from "@/lib/digitalocean"

// GET /api/digitalocean/images
// Lấy danh sách các images (hệ điều hành) có sẵn
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view images" 
      }, { status: 403 })
    }

    // Lấy tham số query
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'distribution' // Mặc định là distributions

    // Lấy danh sách images từ DigitalOcean API
    const images = await getImages(type);
    
    // Sắp xếp theo distribution và name
    const sortedImages = images.sort((a, b) => {
      if (a.distribution !== b.distribution) {
        return a.distribution.localeCompare(b.distribution);
      }
      return a.name.localeCompare(b.name);
    });
    
    // Nhóm lại theo distribution
    const groupedImages: Record<string, any[]> = {};
    
    for (const image of sortedImages) {
      if (!groupedImages[image.distribution]) {
        groupedImages[image.distribution] = [];
      }
      groupedImages[image.distribution].push(image);
    }

    return NextResponse.json({ 
      images: sortedImages,
      groupedImages
    })
  } catch (error: any) {
    console.error("Error fetching images:", error);
    return NextResponse.json({ 
      error: "Failed to fetch images", 
      message: error.message 
    }, { status: 500 })
  }
} 