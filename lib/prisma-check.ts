import { db } from './db';

// Hàm kiểm tra tất cả các bảng có tồn tại
export async function checkPrismaTables() {
  try {
    console.log('--- CHECKING PRISMA SCHEMA ---');
    
    // Kiểm tra các bảng quan trọng
    console.log('Checking Role table...');
    const roleTable = await safeQuery(async () => {
      return await db.role.findFirst();
    });
    console.log('Role table:', roleTable ? 'EXISTS' : 'NOT FOUND');
    
    console.log('Checking ServerTemplate table...');
    const templateTable = await safeQuery(async () => {
      return await db.serverTemplate.findFirst();
    });
    console.log('ServerTemplate table:', templateTable ? 'EXISTS' : 'NOT FOUND');
    
    console.log('Checking RoleServerTemplate table...');
    const roleTemplateTable = await safeQuery(async () => {
      return await db.roleServerTemplate.findFirst();
    });
    console.log('RoleServerTemplate table:', roleTemplateTable ? 'EXISTS' : 'NOT FOUND');
    
    console.log('Checking ServerRegion table...');
    const regionTable = await safeQuery(async () => {
      return await db.serverRegion.findFirst();
    });
    console.log('ServerRegion table:', regionTable ? 'EXISTS' : 'NOT FOUND');
    
    // Kiểm tra tất cả các trường trên đối tượng db để xem đâu là model hợp lệ
    console.log('\nAvailable Prisma models:');
    const models = Object.keys(db).filter(key => 
      typeof db[key] === 'object' && 
      db[key] !== null && 
      !key.startsWith('_') &&
      key !== '$connect' && 
      key !== '$disconnect' && 
      key !== '$on' && 
      key !== '$transaction' && 
      key !== '$use' &&
      key !== '$extends'
    );
    
    models.forEach(model => {
      console.log(`- ${model}`);
    });
    
    return {
      roleExists: !!roleTable,
      templateExists: !!templateTable,
      roleTemplateExists: !!roleTemplateTable,
      regionExists: !!regionTable,
      availableModels: models
    };
  } catch (error) {
    console.error('Error checking Prisma schema:', error);
    return {
      error: error.message,
      roleExists: false,
      templateExists: false,
      roleTemplateExists: false,
      regionExists: false,
      availableModels: []
    };
  }
}

// Hàm trợ giúp an toàn cho truy vấn
async function safeQuery<T>(queryFn: () => Promise<T>): Promise<T | null> {
  try {
    return await queryFn();
  } catch (error) {
    console.error(`Query error: ${error.message}`);
    return null;
  }
} 