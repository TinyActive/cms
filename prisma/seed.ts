import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Xóa dữ liệu hiện có để tránh lỗi unique constraint
  await prisma.telegramNotification.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.vPS.deleteMany({});
  await prisma.droplet.deleteMany({});
  await prisma.firewallDroplet.deleteMany({});
  await prisma.firewall.deleteMany({});
  await prisma.activity.deleteMany({});
  await prisma.roleServerTemplate.deleteMany({});
  await prisma.serverTemplate.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.serverRegion.deleteMany({});
  await prisma.digitalOceanToken.deleteMany({});

  console.log('Creating roles...');
  // Tạo roles
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Administrator with full access',
      permissions: 'ADMIN,CREATE_ROLE,EDIT_ROLES,VIEW_USERS,EDIT_USERS,VIEW_SERVER_CONFIGS,EDIT_SERVER_CONFIGS',
      maxServers: 10,
      isDefault: false,
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: 'User',
      description: 'Regular user with limited access',
      permissions: 'VIEW_SERVER_CONFIGS',
      maxServers: 3,
      isDefault: true,
    },
  });

  console.log('Creating server regions...');
  // Tạo server regions
  const sgRegion = await prisma.serverRegion.create({
    data: {
      name: 'Singapore',
      location: 'Asia/Singapore',
      isActive: true,
      isAdminOnly: false,
    },
  });

  const usRegion = await prisma.serverRegion.create({
    data: {
      name: 'New York',
      location: 'America/New_York',
      isActive: true,
      isAdminOnly: false,
    },
  });

  const euRegion = await prisma.serverRegion.create({
    data: {
      name: 'Amsterdam',
      location: 'Europe/Amsterdam',
      isActive: true,
      isAdminOnly: true,
    },
  });

  console.log('Creating server templates...');
  // Tạo server templates
  const basicTemplate = await prisma.serverTemplate.create({
    data: {
      name: 'Basic',
      cpu: 1,
      ram: 1,
      disk: 25,
      price: 5,
      cpuCount: 1,
      memoryGB: 1,
      storageGB: 25,
      description: 'Basic server for simple applications',
      isActive: true,
    },
  });

  const standardTemplate = await prisma.serverTemplate.create({
    data: {
      name: 'Standard',
      cpu: 2,
      ram: 2,
      disk: 50,
      price: 10,
      cpuCount: 2,
      memoryGB: 2,
      storageGB: 50,
      description: 'Standard server for most applications',
      isActive: true,
    },
  });

  const premiumTemplate = await prisma.serverTemplate.create({
    data: {
      name: 'Premium',
      cpu: 4,
      ram: 8,
      disk: 100,
      price: 20,
      cpuCount: 4,
      memoryGB: 8,
      storageGB: 100,
      description: 'Premium server for demanding applications',
      isActive: true,
    },
  });

  console.log('Creating role-template relationships...');
  // Liên kết roles và templates
  await prisma.roleServerTemplate.createMany({
    data: [
      {
        roleId: adminRole.id,
        serverTemplateId: basicTemplate.id,
        maxServers: 10,
      },
      {
        roleId: adminRole.id,
        serverTemplateId: standardTemplate.id,
        maxServers: 10,
      },
      {
        roleId: adminRole.id,
        serverTemplateId: premiumTemplate.id,
        maxServers: 10,
      },
      {
        roleId: userRole.id,
        serverTemplateId: basicTemplate.id,
        maxServers: 3,
      },
      {
        roleId: userRole.id,
        serverTemplateId: standardTemplate.id,
        maxServers: 2,
      },
    ],
  });

  console.log('Creating users...');
  // Tạo users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: await hash('password123', 10),
      permissions: 'ADMIN',
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      name: 'Regular User',
      email: 'user@example.com',
      password: await hash('password123', 10),
      permissions: '',
      roleId: userRole.id,
      isActive: true,
    },
  });

  console.log('Creating VPS instances...');
  // Tạo VPS instances
  await prisma.vPS.create({
    data: {
      name: 'Web Server',
      userId: adminUser.id,
      status: 'active',
      ip: '192.168.1.1',
      region: 'Singapore',
      cpu: 2,
      ram: 2,
      disk: 50,
      price: 10,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  await prisma.vPS.create({
    data: {
      name: 'Database Server',
      userId: regularUser.id,
      status: 'active',
      ip: '192.168.1.2',
      region: 'New York',
      cpu: 1,
      ram: 1,
      disk: 25,
      price: 5,
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  console.log('Creating transactions...');
  // Tạo transactions
  await prisma.transaction.createMany({
    data: [
      {
        userId: adminUser.id,
        amount: 100,
        status: 'completed',
        description: 'Initial deposit',
      },
      {
        userId: regularUser.id,
        amount: 50,
        status: 'completed',
        description: 'Initial deposit',
      },
    ],
  });

  console.log('Creating Digital Ocean token...');
  // Tạo Digital Ocean token
  await prisma.digitalOceanToken.create({
    data: {
      token: 'sample_do_token_123456',
      isActive: true,
    },
  });

  console.log('Creating Telegram notifications...');
  // Tạo Telegram notifications
  await prisma.telegramNotification.createMany({
    data: [
      {
        chatId: '123456789',
        message: 'Welcome to the system, Admin!',
        sent: true,
      },
      {
        chatId: '987654321',
        message: 'Welcome to the system, User!',
        sent: true,
      },
    ],
  });

  console.log('Creating Droplets...');
  // Tạo Droplets
  const droplet1 = await prisma.droplet.create({
    data: {
      doId: 12345,
      name: 'Web Droplet',
      userId: adminUser.id,
      status: 'active',
      ip: '10.0.0.1',
      region: 'sgp1',
      size: 's-1vcpu-1gb',
      image: 'ubuntu-20-04-x64',
    },
  });

  const droplet2 = await prisma.droplet.create({
    data: {
      doId: 67890,
      name: 'DB Droplet',
      userId: regularUser.id,
      status: 'active',
      ip: '10.0.0.2',
      region: 'nyc1',
      size: 's-1vcpu-1gb',
      image: 'ubuntu-20-04-x64',
    },
  });

  console.log('Creating Firewalls...');
  // Tạo Firewalls
  const firewall1 = await prisma.firewall.create({
    data: {
      doId: 'fw-123456',
      name: 'Web Firewall',
      status: 'active',
    },
  });

  const firewall2 = await prisma.firewall.create({
    data: {
      doId: 'fw-654321',
      name: 'DB Firewall',
      status: 'active',
    },
  });

  console.log('Creating Firewall-Droplet relationships...');
  // Liên kết Firewalls và Droplets
  await prisma.firewallDroplet.createMany({
    data: [
      {
        firewallId: firewall1.id,
        dropletId: droplet1.id,
      },
      {
        firewallId: firewall2.id,
        dropletId: droplet2.id,
      },
    ],
  });

  console.log('Creating activities...');
  // Tạo Activity logs
  await prisma.activity.createMany({
    data: [
      {
        action: 'user_login',
        userId: adminUser.id,
        details: { ip: '192.168.1.100', browser: 'Chrome' },
      },
      {
        action: 'user_login',
        userId: regularUser.id,
        details: { ip: '192.168.1.101', browser: 'Firefox' },
      },
      {
        action: 'server_created',
        userId: adminUser.id,
        details: { name: 'Web Server', region: 'Singapore' },
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

