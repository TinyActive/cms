import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db, safeQuery } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { callDigitalOceanAPI, testDigitalOceanToken } from "@/lib/digitalocean"

// Lấy thông tin token (đã được mask)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 })
    }
    
    // Check if permissions is a property on user
    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_SETTINGS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view settings" 
      }, { status: 403 })
    }

    // Sử dụng safeQuery để tránh lỗi database
    const { data: token, error } = await safeQuery(() => 
      db.digitalOceanToken.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      })
    );
    
    if (error) {
      console.error("Error fetching DigitalOcean token:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }
    
    // Kiểm tra token có hợp lệ không
    let isTokenValid = false;
    let validationMessage = null;
    
    if (token?.token) {
      try {
        const tokenTest = await testDigitalOceanToken(token.token);
        isTokenValid = tokenTest.isValid;
        validationMessage = tokenTest.message;
      } catch (e) {
        console.error("Error testing token:", e);
        isTokenValid = false;
        validationMessage = "Error testing token";
      }
    }
    
    return NextResponse.json({
      token: token?.token || null,
      isActive: !!token?.isActive,
      isValid: isTokenValid,
      validationMessage: validationMessage,
      lastUpdated: token?.updatedAt?.toISOString() || null
    });
  } catch (error) {
    console.error("Error in GET /api/settings/digitalocean-token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Cập nhật token
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized - Please log in" }, { status: 401 })
    }
    
    // Check if permissions is a property on user
    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.EDIT_SETTINGS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to edit settings" 
      }, { status: 403 })
    }

    // Lấy token từ request
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || token.trim() === '') {
      return NextResponse.json({ 
        message: "Valid token is required"
      }, { status: 400 });
    }
    
    // Kiểm tra token có hợp lệ không
    try {
      // Sử dụng hàm testDigitalOceanToken để kiểm tra token
      const tokenTest = await testDigitalOceanToken(token);
      
      if (!tokenTest.isValid) {
        return NextResponse.json({ 
          message: `Invalid token: ${tokenTest.message}`,
          details: tokenTest.details,
          isValid: false
        }, { status: 400 });
      }
      
      // Kiểm tra xem token đã tồn tại chưa
      const { data: existingToken } = await safeQuery(() =>
        db.digitalOceanToken.findUnique({
          where: {
            token: token
          }
        })
      );

      let savedToken;
      
      if (existingToken) {
        // Nếu token đã tồn tại, cập nhật trạng thái hoạt động
        const { data: updatedToken, error: updateError } = await safeQuery(() =>
          db.digitalOceanToken.update({
            where: {
              id: existingToken.id
            },
            data: {
              isActive: true,
              updatedAt: new Date()
            }
          })
        );
        
        if (updateError) {
          console.error("Error updating existing token:", updateError);
          return NextResponse.json({ 
            message: "Token is valid but could not be updated in database"
          }, { status: 500 });
        }
        
        savedToken = updatedToken;
      } else {
        // Nếu token chưa tồn tại, tạo mới
        const { data: newToken, error } = await safeQuery(() =>
          db.digitalOceanToken.create({
            data: {
              token,
              isActive: true
            }
          })
        );
        
        if (error) {
          console.error("Error saving token:", error);
          return NextResponse.json({ 
            message: "Token is valid but could not be saved to database"
          }, { status: 500 });
        }
        
        savedToken = newToken;
      }
      
      // Vô hiệu hóa các token cũ
      await safeQuery(() =>
        db.digitalOceanToken.updateMany({
          where: {
            id: { not: savedToken.id },
            isActive: true
          },
          data: {
            isActive: false
          }
        })
      );
      
      return NextResponse.json({ 
        message: "DigitalOcean API token updated successfully",
        isValid: true
      });
    } catch (error) {
      console.error("Error validating token:", error);
      return NextResponse.json({ 
        message: "Invalid DigitalOcean API token. Please check and try again.",
        isValid: false
      }, { status: 400 });
    }
  } catch (error) {
    console.error("Error in POST /api/settings/digitalocean-token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

