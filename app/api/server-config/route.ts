import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { db } from "@/lib/db"

// Kiểm tra xem model có tồn tại không
function hasModel(modelName: string): boolean {
  return typeof db[modelName] === 'object' && 
    db[modelName] !== null && 
    typeof db[modelName].findMany === 'function';
}

// GET /api/server-config - Lấy tất cả cấu hình server
export async function GET() {
  try {
    // Kiểm tra kết nối cơ bản
    await db.$queryRaw`SELECT 1`;
    
    // Liệt kê các models có sẵn để debug
    const availableModels = Object.keys(db)
      .filter(k => !k.startsWith('_') && typeof db[k] === 'object');
    console.log("Available models:", availableModels);
    
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Kiểm tra quyền
    const userPermissions = session.user.permissions as string;
    if (!hasPermission(userPermissions, PERMISSIONS.VIEW_SERVER_CONFIGS)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    
    // Chuẩn bị kết quả
    const result: any = {
      templates: [],
      roles: [],
      regions: []
    };
    
    // Lấy dữ liệu server templates nếu có
    if (hasModel('serverTemplate')) {
      result.templates = await db.serverTemplate.findMany({
        orderBy: { name: 'asc' },
      });
    }
    
    // Lấy dữ liệu roles nếu có
    if (hasModel('role')) {
      const roles = await db.role.findMany({
        orderBy: { name: 'asc' },
      });
      
      // Nếu có model RoleServerTemplate, thêm thông tin templates cho mỗi role
      if (hasModel('roleServerTemplate') && hasModel('serverTemplate')) {
        result.roles = await Promise.all(roles.map(async (role) => {
          try {
            const templates = await db.roleServerTemplate.findMany({
              where: { roleId: role.id },
            });
            
            const templateIds = templates.map(t => t.serverTemplateId);
            
            const allowedTemplates = await db.serverTemplate.findMany({
              where: { id: { in: templateIds } },
            });
            
            return {
              ...role,
              allowedServerTypes: allowedTemplates,
            };
          } catch (error) {
            console.error(`Error fetching templates for role ${role.id}:`, error);
            return role;
          }
        }));
      } else {
        result.roles = roles;
      }
    }
    
    // Lấy dữ liệu regions nếu có
    if (hasModel('serverRegion')) {
      result.regions = await db.serverRegion.findMany({
        orderBy: { name: 'asc' },
      });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching server configurations:", error);
    return NextResponse.json({ 
      error: "Error fetching server configurations", 
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 