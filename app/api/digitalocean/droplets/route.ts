import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  getDroplets, 
  createDroplet, 
  calculatePrice,
  Droplet as DODroplet,
  DropletCreateRequest
} from "@/lib/digitalocean"

// Hàm chuyển đổi dữ liệu Droplet từ DigitalOcean sang định dạng phù hợp cho frontend
function transformDroplet(doDroplet: DODroplet) {
  // Lấy IPv4 address
  const ipv4Address = doDroplet.networks?.v4?.find(network => network.type === 'public')?.ip_address || null;
  
  return {
    id: doDroplet.id,
    name: doDroplet.name,
    status: doDroplet.status,
    memory: doDroplet.memory,
    vcpus: doDroplet.vcpus,
    disk: doDroplet.disk,
    region: {
      slug: doDroplet.region.slug,
      name: doDroplet.region.name,
    },
    image: {
      id: doDroplet.image.id,
      name: doDroplet.image.name,
      distribution: doDroplet.image.distribution,
    },
    size_slug: doDroplet.size_slug,
    ip: ipv4Address,
    created_at: doDroplet.created_at,
    price_monthly: doDroplet.size?.price_monthly || 0,
    price_with_markup: calculatePrice(doDroplet.size?.price_monthly || 0),
  };
}

// GET /api/digitalocean/droplets
// Lấy danh sách droplets của người dùng hiện tại
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_DROPLETS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view droplets" 
      }, { status: 403 })
    }

    // Lấy danh sách droplets từ database cho người dùng hiện tại
    const dbDroplets = await db.droplet.findMany({
      where: { userId: session.user.id as string }
    });

    // Lấy tất cả droplets từ DigitalOcean
    const doDroplets = await getDroplets();

    // Kết hợp dữ liệu từ cả hai nguồn
    const droplets = dbDroplets.map(dbDroplet => {
      const doDroplet = doDroplets.find(d => d.id === dbDroplet.doId);
      
      if (doDroplet) {
        const transformedDroplet = transformDroplet(doDroplet);
        return {
          ...transformedDroplet,
          originalPrice: (dbDroplet as any).originalPrice,
          price: (dbDroplet as any).price,
          nextBillingDate: (dbDroplet as any).nextBillingDate,
        };
      }

      // Nếu không tìm thấy droplet tương ứng trong DO, trả về dữ liệu từ DB
      return {
        id: dbDroplet.doId,
        name: dbDroplet.name,
        status: dbDroplet.status,
        memory: (dbDroplet as any).memory || 0,
        vcpus: (dbDroplet as any).cpu || 0,
        disk: (dbDroplet as any).disk || 0,
        region: {
          slug: dbDroplet.region || "unknown",
          name: dbDroplet.region || "Unknown",
        },
        image: {
          id: 0,
          name: dbDroplet.image || "Unknown",
          distribution: "Unknown",
        },
        size_slug: dbDroplet.size || "unknown",
        ip: dbDroplet.ip,
        created_at: dbDroplet.createdAt.toISOString(),
        originalPrice: (dbDroplet as any).originalPrice,
        price: (dbDroplet as any).price,
        nextBillingDate: (dbDroplet as any).nextBillingDate,
      };
    });

    return NextResponse.json({ droplets })
  } catch (error: any) {
    console.error("Error fetching droplets:", error);
    return NextResponse.json({ 
      error: "Failed to fetch droplets", 
      message: error.message 
    }, { status: 500 })
  }
}

// POST /api/digitalocean/droplets
// Tạo droplet mới
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.CREATE_DROPLET)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to create droplets" 
      }, { status: 403 })
    }

    const data = await request.json()
    
    // Kiểm tra dữ liệu đầu vào
    if (!data.name || !data.region || !data.size || !data.image) {
      return NextResponse.json({ 
        message: "Missing required fields: name, region, size, image" 
      }, { status: 400 })
    }

    // Kiểm tra số dư người dùng
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, balance: true }
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Lấy thông tin giá từ DigitalOcean
    const sizes = await db.serverTemplate.findMany({
      where: { slug: data.size }
    });
    
    if (sizes.length === 0) {
      return NextResponse.json({ message: "Invalid size" }, { status: 400 })
    }
    
    const originalPrice = sizes[0].price;
    const price = calculatePrice(originalPrice);
    
    // Kiểm tra số dư
    if (user.balance < price) {
      return NextResponse.json({ 
        message: "Insufficient balance. Please add funds to your account." 
      }, { status: 400 })
    }

    // Tạo droplet request
    const dropletRequest: DropletCreateRequest = {
      name: data.name,
      region: data.region,
      size: data.size,
      image: data.image,
      tags: ["cms-managed"],
      // Các tùy chọn khác
      backups: data.backups || false,
      ipv6: data.ipv6 || true,
      monitoring: true,
    };
    
    // Gọi DigitalOcean API để tạo droplet
    const newDroplet = await createDroplet(dropletRequest);
    
    // Tính toán ngày thanh toán tiếp theo (1 tháng từ ngày hiện tại)
    const nextBillingDate = new Date();
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    
    // Lưu thông tin droplet vào database
    const dbDroplet = await db.droplet.create({
      data: {
        doId: newDroplet.id,
        name: newDroplet.name,
        userId: session.user.id,
        status: newDroplet.status,
        region: newDroplet.region.slug,
        size: newDroplet.size_slug,
        image: `${newDroplet.image.distribution} ${newDroplet.image.name}`,
        ip: newDroplet.networks?.v4?.find(net => net.type === 'public')?.ip_address,
        cpu: newDroplet.vcpus,
        memory: newDroplet.memory,
        disk: newDroplet.disk,
        originalPrice: originalPrice,
        price: price,
        nextBillingDate: nextBillingDate
      }
    });
    
    // Tạo transaction để trừ tiền
    await db.transaction.create({
      data: {
        userId: session.user.id,
        amount: -price,
        description: `Payment for Droplet: ${newDroplet.name} (${newDroplet.size_slug})`,
        status: "completed",
      }
    });
    
    // Cập nhật số dư người dùng
    await db.user.update({
      where: { id: session.user.id },
      data: { balance: user.balance - price }
    });
    
    // Trả về thông tin droplet
    return NextResponse.json({ 
      droplet: transformDroplet(newDroplet),
      message: "Droplet created successfully" 
    })
  } catch (error: any) {
    console.error("Error creating droplet:", error);
    return NextResponse.json({ 
      error: "Failed to create droplet", 
      message: error.message 
    }, { status: 500 })
  }
}

