import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { db, hasModel } from "@/lib/db"

// GET /api/roles - Lấy tất cả roles
export async function GET() {
  try {
    // Kiểm tra kết nối cơ bản
    await db.$queryRaw`SELECT 1`;
    
    // Liệt kê các models có sẵn để debug
    const availableModels = Object.keys(db)
      .filter(k => !k.startsWith('_') && typeof db[k] === 'object');
    console.log("Available models:", availableModels);
    
    // Kiểm tra model
    const roleModelExists = hasModel('role');
    const templateModelExists = hasModel('serverTemplate');
    const roleServerTemplateModelExists = hasModel('roleServerTemplate');
    
    if (!roleModelExists) {
      return NextResponse.json({ 
        error: "Role model not found", 
        availableModels: availableModels
      }, { status: 500 });
    }
    
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Lấy tất cả roles
    const roles = await db.role.findMany({
      orderBy: { name: 'asc' },
    });
    
    // Nếu cả roleServerTemplate và serverTemplate đều tồn tại, lấy thông tin template cho mỗi role
    if (roleServerTemplateModelExists && templateModelExists) {
      // Lấy templates cho mỗi role và gộp vào kết quả
      const rolesWithTemplates = await Promise.all(roles.map(async (role) => {
        try {
          // Lấy các liên kết role-template
          const roleTemplates = await db.roleServerTemplate.findMany({
            where: { roleId: role.id },
          });
          
          // Lấy thông tin chi tiết về templates
          if (roleTemplates.length > 0) {
            const templateIds = roleTemplates.map(rt => rt.serverTemplateId);
            const templates = await db.serverTemplate.findMany({
              where: { id: { in: templateIds } },
            });
            
            return { 
              ...role, 
              allowedServerTypes: templateIds,
              serverTemplates: templates
            };
          }
        } catch (error) {
          console.error(`Error fetching templates for role ${role.id}:`, error);
        }
        
        return { ...role, allowedServerTypes: [], serverTemplates: [] };
      }));
      
      return NextResponse.json(rolesWithTemplates);
    }
    
    // Trả về roles mà không có thông tin về templates
    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ 
      error: "Error fetching roles", 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

// POST /api/roles - Tạo role mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Chỉ admin mới có thể tạo role mới
    const userPermissions = session.user.permissions as string;
    if (!userPermissions.includes('ADMIN') && !userPermissions.includes('CREATE_ROLE')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Lấy dữ liệu từ request
    const data = await request.json();
    
    // Validate dữ liệu
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    
    // Kiểm tra xem role đã tồn tại chưa
    const existingRole = await db.role.findFirst({
      where: { name: data.name },
    });
    
    if (existingRole) {
      return NextResponse.json({ error: "Role already exists" }, { status: 409 });
    }
    
    // Tạo role mới
    const role = await db.role.create({
      data: {
        name: data.name,
        description: data.description || '',
        permissions: data.permissions || '',
        maxServers: data.maxServers || 5,
        isDefault: data.isDefault || false,
      },
    });
    
    // Tạo liên kết với server templates nếu có
    if (data.allowedServerTypes && Array.isArray(data.allowedServerTypes) && data.allowedServerTypes.length > 0) {
      const serverTemplateLinks = data.allowedServerTypes.map(templateId => ({
        roleId: role.id,
        serverTemplateId: templateId,
        maxServers: data.maxServers || 5,
      }));
      
      await db.roleServerTemplate.createMany({
        data: serverTemplateLinks,
      });
    }
    
    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ 
      error: "Error creating role", 
      message: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

