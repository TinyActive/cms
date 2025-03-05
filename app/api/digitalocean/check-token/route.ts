import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeQuery } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { callDigitalOceanAPI, testDigitalOceanToken } from "@/lib/digitalocean"

/**
 * Kiểm tra tính hợp lệ của token DigitalOcean
 * GET /api/digitalocean/check-token
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 })
    }
    
    // Check if permissions is a property on user
    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to check token" 
      }, { status: 403 })
    }

    // Lấy token từ database
    const { data: tokenRecord, error: tokenError } = await safeQuery(() => 
      db.digitalOceanToken.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
    );
    
    // Nếu không có token
    if (tokenError || !tokenRecord) {
      console.error("No DigitalOcean token found:", tokenError);
      return NextResponse.json({ 
        isValid: false, 
        message: "No DigitalOcean API token found",
        error: "TOKEN_NOT_FOUND"
      }, { status: 404 });
    }
    
    // Kiểm tra token với DigitalOcean API
    const tokenTest = await testDigitalOceanToken(tokenRecord.token);
    
    return NextResponse.json({ 
      isValid: tokenTest.isValid,
      message: tokenTest.message,
      details: tokenTest.details
    });
  } catch (error: any) {
    console.error("Error checking DigitalOcean token:", error);
    return NextResponse.json({ 
      isValid: false, 
      message: error.message || "Error checking token",
      error: "CHECK_ERROR"
    }, { status: 500 });
  }
} 