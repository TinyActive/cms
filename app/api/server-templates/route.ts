import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db, hasModel } from "@/lib/db"
import { apiHandler, checkDatabaseConnection } from "@/lib/api-utils"

// GET /api/server-templates - Lấy tất cả server templates
export async function GET() {
  try {
    // Kiểm tra kết nối cơ bản
    await db.$queryRaw`SELECT 1`;
    
    // Liệt kê các models có sẵn để debug
    const availableModels = Object.keys(db)
      .filter(k => !k.startsWith('$') && typeof db[k] === 'object');
    console.log("Available models:", availableModels);
    
    // Kiểm tra model
    const templateModelExists = hasModel('serverTemplate');
    const regionModelExists = hasModel('serverRegion');
    
    if (!templateModelExists) {
      return NextResponse.json({ 
        error: "ServerTemplate model not found", 
        availableModels: availableModels
      }, { status: 500 });
    }
    
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Lấy tất cả server templates
    const templates = await db.serverTemplate.findMany({
      orderBy: { name: 'asc' },
    });
    
    // Nếu cần thông tin region, chúng ta cần truy vấn riêng
    let templatesWithRegion = templates;
    
    // Nếu regionId tồn tại trong serverTemplate và model region tồn tại
    if (regionModelExists) {
      try {
        // Kiểm tra xem serverTemplate có trường regionId không
        const hasRegionId = await db.$queryRaw`
          SELECT COLUMN_NAME 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = 'cms' 
          AND TABLE_NAME = 'ServerTemplate' 
          AND COLUMN_NAME = 'regionId'
        `;
        
        // Nếu có trường regionId, lấy thông tin region cho mỗi template
        if (Array.isArray(hasRegionId) && hasRegionId.length > 0) {
          templatesWithRegion = await Promise.all(templates.map(async (template) => {
            if (template.regionId) {
              const region = await db.serverRegion.findUnique({
                where: { id: template.regionId },
              });
              return { ...template, region };
            }
            return template;
          }));
        }
      } catch (error) {
        console.error("Error fetching region data:", error);
        // Vẫn trả về template mà không có region
      }
    }
    
    return NextResponse.json(templatesWithRegion);
  } catch (error) {
    console.error("Error fetching server templates:", error);
    return NextResponse.json({ 
      error: "Error fetching server templates", 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

// POST /api/server-templates - Tạo server template mới
export async function POST(request: Request) {
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
    
    // Tạo server template mới
    const template = await db.serverTemplate.create({
      data: {
        name: data.name,
        cpu: data.cpu,
        ram: data.ram,
        disk: data.disk,
        price: data.price,
        isActive: data.isActive ?? true,
      },
    })
    
    // Tạo liên kết với các role
    if (data.availableRoles && Array.isArray(data.availableRoles)) {
      const roleLinks = data.availableRoles.map((roleId: string) => ({
        roleId,
        serverTemplateId: template.id,
        maxServers: 10, // Default value
      }))
      
      await db.roleServerTemplate.createMany({
        data: roleLinks,
      })
    }
    
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error("Error creating server template:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 