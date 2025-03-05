import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db, hasModel, safeQuery, checkConnection } from "@/lib/db"
import { handlePrismaError } from "@/lib/api-utils"

// Hàm xử lý BigInt trước khi serialize
const serializeData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  if (typeof data === 'bigint') return data.toString();
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, serializeData(value)])
  );
};

// GET /api/server-regions - Lấy tất cả server regions
export async function GET() {
  // Kiểm tra kết nối đến database
  const connected = await checkConnection();
  if (!connected) {
    return NextResponse.json({ 
      error: "Database connection failed", 
    }, { status: 503 });
  }
  
  try {
    // Kiểm tra session
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Kiểm tra model
    const regionModelExists = hasModel('serverRegion');
    
    if (!regionModelExists) {
      return NextResponse.json({ 
        error: "ServerRegion model not found"
      }, { status: 500 });
    }
    
    // Sử dụng safeQuery để lấy tất cả server regions
    const { data: regions, error: regionsError } = await safeQuery(() => 
      db.serverRegion.findMany({
        orderBy: { name: 'asc' },
      })
    );
    
    if (regionsError || !regions) {
      return NextResponse.json({ 
        error: "Error fetching server regions", 
        message: regionsError?.message 
      }, { status: 500 });
    }
    
    return NextResponse.json(serializeData(regions));
  } catch (error) {
    return handlePrismaError(error);
  }
}

// POST /api/server-regions - Tạo server region mới
export async function POST(request: Request) {
  // Kiểm tra kết nối đến database
  const connected = await checkConnection();
  if (!connected) {
    return NextResponse.json({ 
      error: "Database connection failed", 
    }, { status: 503 });
  }
  
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Kiểm tra quyền
    const userPermissions = session.user.permissions as string;
    if (!hasPermission(userPermissions, PERMISSIONS.EDIT_SERVER_CONFIGS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Lấy dữ liệu từ request
    const data = await request.json();
    
    // Validate dữ liệu
    if (!data.name || !data.location) {
      return NextResponse.json({ error: "Invalid data: name and location are required" }, { status: 400 });
    }
    
    // Sử dụng safeQuery để tạo server region mới
    const { data: region, error: regionError } = await safeQuery(() => 
      db.serverRegion.create({
        data: {
          name: data.name,
          location: data.location,
          isActive: data.isActive ?? true,
          isAdminOnly: data.isAdminOnly ?? false,
        },
      })
    );
    
    if (regionError || !region) {
      return NextResponse.json({ 
        error: "Error creating server region", 
        message: regionError?.message 
      }, { status: 500 });
    }
    
    return NextResponse.json(serializeData(region), { status: 201 });
  } catch (error) {
    return handlePrismaError(error);
  }
} 