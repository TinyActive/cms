import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeQuery } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { callDigitalOceanAPI } from "@/lib/digitalocean"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 })
    }
    
    // Check if permissions is a property on user (TypeScript fix)
    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ message: "Forbidden - You don't have permission to view droplets" }, { status: 403 })
    }

    try {
      // Kiểm tra token trước khi gọi API
      const { data: tokenRecord, error: tokenError } = await safeQuery(() => 
        db.digitalOceanToken.findFirst({
          where: { isActive: true },
        })
      );
      
      if (tokenError || !tokenRecord) {
        console.error("No valid DigitalOcean token found:", tokenError);
        return NextResponse.json({ 
          message: "Cannot fetch droplets - No valid DigitalOcean API token found",
          error: "TOKEN_NOT_FOUND"
        }, { status: 503 });
      }
      
      // Gọi API với token và xử lý lỗi
      try {
        const { droplets } = await callDigitalOceanAPI("/droplets");
        return NextResponse.json({ droplets });
      } catch (apiError: any) {
        // Xử lý lỗi cụ thể từ API DigitalOcean
        if (apiError.message?.includes("Unauthorized")) {
          return NextResponse.json({ 
            message: "Cannot connect to DigitalOcean - API token invalid or expired",
            error: "INVALID_TOKEN"
          }, { status: 401 });
        }
        
        throw apiError; // Ném lại lỗi để xử lý ở catch bên ngoài
      }
    } catch (error: any) {
      console.error("Error fetching droplets:", error);
      return NextResponse.json({ 
        message: "Failed to fetch droplets", 
        error: error.message || "Unknown error"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Unexpected error in droplets API:", error);
    return NextResponse.json({ 
      message: "An unexpected error occurred", 
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 })
    }
    
    // Check if permissions is a property on user (TypeScript fix)
    const permissions = (session.user as any).permissions || "";
    const userId = (session.user as any).id;
    
    if (!permissions || !userId) {
      return NextResponse.json({ 
        message: "Invalid user session - missing permissions or ID", 
      }, { status: 403 });
    }

    if (!hasPermission(permissions, PERMISSIONS.CREATE_DROPLET)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to create droplets" 
      }, { status: 403 });
    }

    try {
      const dropletData = await req.json()
      
      // Kiểm tra dữ liệu đầu vào
      if (!dropletData || !dropletData.name) {
        return NextResponse.json({ 
          message: "Invalid droplet data - name is required" 
        }, { status: 400 });
      }
      
      // Gọi API DigitalOcean và xử lý lỗi
      try {
        const { droplet } = await callDigitalOceanAPI("/droplets", "POST", dropletData);
        
        // Kiểm tra response từ DO
        if (!droplet || !droplet.id) {
          throw new Error("Invalid response from DigitalOcean API");
        }
        
        // Lưu droplet vào database local
        const { data: savedDroplet, error: saveError } = await safeQuery(() => 
          db.droplet.create({
            data: {
              doId: parseInt(droplet.id.toString()),  // Sửa digitalOceanId thành doId theo schema
              name: droplet.name,
              status: droplet.status,
              ip: droplet.networks.v4?.[0]?.ip_address || null,
              region: droplet.region.slug,
              size: droplet.size.slug,
              image: droplet.image.slug,
              userId: userId,
            },
          })
        );
        
        if (saveError) {
          console.error("Error saving droplet to database:", saveError);
          // Vẫn trả về thành công nhưng với warning
          return NextResponse.json({ 
            droplet, 
            warning: "Droplet created on DigitalOcean but failed to save to local database" 
          });
        }
        
        return NextResponse.json({ droplet: savedDroplet });
      } catch (apiError: any) {
        // Xử lý lỗi cụ thể từ API DigitalOcean
        if (apiError.message?.includes("Unauthorized")) {
          return NextResponse.json({ 
            message: "Cannot connect to DigitalOcean - API token invalid or expired",
            error: "INVALID_TOKEN"
          }, { status: 401 });
        }
        
        throw apiError; // Ném lại lỗi để xử lý ở catch bên ngoài
      }
    } catch (error: any) {
      console.error("Error creating droplet:", error);
      return NextResponse.json({ 
        message: "Failed to create droplet", 
        error: error.message || "Unknown error"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Unexpected error in droplets API:", error);
    return NextResponse.json({ 
      message: "An unexpected error occurred", 
      error: error.message || "Unknown error"
    }, { status: 500 });
  }
}

