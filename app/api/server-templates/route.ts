import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db, hasModel, safeQuery, checkConnection } from "@/lib/db"
import { apiHandler, checkDatabaseConnection } from "@/lib/api-utils"

// GET /api/server-templates - Lấy tất cả server templates
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
    const templateModelExists = hasModel('serverTemplate');
    
    if (!templateModelExists) {
      return NextResponse.json({ 
        error: "ServerTemplate model not found"
      }, { status: 500 });
    }
    
    // Sử dụng safeQuery để lấy tất cả server templates
    const { data: templates, error: templatesError } = await safeQuery(() => 
      db.serverTemplate.findMany({
        orderBy: { name: 'asc' },
      })
    );
    
    if (templatesError || !templates) {
      return NextResponse.json({ 
        error: "Error fetching server templates", 
        message: templatesError?.message 
      }, { status: 500 });
    }
    
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching server templates:", error);
    return NextResponse.json({ 
      error: "Error fetching server templates", 
      message: error.message,
    }, { status: 500 });
  }
}

// POST /api/server-templates - Tạo server template mới
export async function POST(request: Request) {
  // Kiểm tra kết nối đến database
  const connected = await checkConnection();
  if (!connected) {
    return NextResponse.json({ 
      error: "Database connection failed", 
    }, { status: 503 });
  }
  
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
    if (!data.name || data.cpu <= 0 || data.ram <= 0 || data.disk <= 0 || data.price < 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }
    
    // Sử dụng safeQuery để tạo server template mới
    const { data: template, error: templateError } = await safeQuery(() => 
      db.serverTemplate.create({
        data: {
          name: data.name,
          cpu: data.cpu,
          ram: data.ram,
          disk: data.disk,
          price: data.price,
          isActive: data.isActive ?? true,
        },
      })
    );
    
    if (templateError || !template) {
      return NextResponse.json({ 
        error: "Error creating server template", 
        message: templateError?.message 
      }, { status: 500 });
    }
    
    // Tạo liên kết với các role
    if (data.availableRoles && Array.isArray(data.availableRoles) && data.availableRoles.length > 0) {
      const roleLinks = data.availableRoles.map((roleId: string) => ({
        roleId,
        serverTemplateId: template.id,
        maxServers: 10, // Default value
      }))
      
      const { error: rolesError } = await safeQuery(() => 
        db.roleServerTemplate.createMany({
          data: roleLinks,
        })
      );
      
      if (rolesError) {
        console.error("Error linking roles:", rolesError);
        // Không trả về lỗi vì server template đã được tạo
      }
    }
    
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating server template:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      message: error.message
    }, { status: 500 })
  }
} 