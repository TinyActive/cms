import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  getFirewalls, 
  createFirewall,
  Firewall as DOFirewall 
} from "@/lib/digitalocean"

// Hàm chuyển đổi cấu trúc dữ liệu từ DigitalOcean thành định dạng phù hợp cho frontend
function transformFirewall(doFirewall: DOFirewall) {
  // Chuyển đổi đối tượng addresses của inbound/outbound rules
  const transformRules = (rules: any[]) => {
    return rules.map(rule => {
      const transformed = {
        protocol: rule.protocol,
        ports: rule.ports || "all",
      };

      // Trích xuất thông tin sources/destinations từ addresses
      if (rule.addresses) {
        if (rule.addresses.addresses) {
          return {
            ...transformed,
            sources: rule.addresses.addresses.join(", "), // cho inbound
            destinations: rule.addresses.addresses.join(", ") // cho outbound
          };
        }
        if (rule.addresses.droplet_ids) {
          return {
            ...transformed,
            sourceIds: rule.addresses.droplet_ids, // cho inbound
            destinationIds: rule.addresses.droplet_ids // cho outbound
          };
        }
        if (rule.addresses.tags) {
          return {
            ...transformed,
            sourceTags: rule.addresses.tags, // cho inbound
            destinationTags: rule.addresses.tags // cho outbound
          };
        }
      }
      return transformed;
    });
  };

  return {
    id: doFirewall.id,
    name: doFirewall.name,
    status: doFirewall.status || "unknown",
    created_at: doFirewall.created_at,
    dropletIds: doFirewall.droplet_ids || [],
    tags: doFirewall.tags || [],
    inboundRules: transformRules(doFirewall.inbound_rules || []),
    outboundRules: transformRules(doFirewall.outbound_rules || [])
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.VIEW_FIREWALLS)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to view firewalls" 
      }, { status: 403 })
    }

    // Lấy danh sách firewalls từ DigitalOcean API
    const doFirewalls = await getFirewalls();
    
    // Chuyển đổi dữ liệu DigitalOcean về định dạng phù hợp với frontend
    const firewalls = doFirewalls.map(transformFirewall);

    return NextResponse.json({ firewalls })
  } catch (error: any) {
    console.error("Error fetching firewalls:", error);
    return NextResponse.json({ 
      error: "Failed to fetch firewalls", 
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.CREATE_FIREWALL)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to create firewalls" 
      }, { status: 403 })
    }

    const data = await request.json()
    
    // Kiểm tra dữ liệu đầu vào
    if (!data.name) {
      return NextResponse.json({ message: "Firewall name is required" }, { status: 400 })
    }
    
    // Chuyển đổi cấu trúc dữ liệu từ frontend sang định dạng API của DigitalOcean
    const firewallData: DOFirewall = {
      name: data.name,
      inbound_rules: data.inboundRules ? data.inboundRules.map((rule: any) => {
        const transformedRule: any = {
          protocol: rule.protocol,
          ports: rule.ports
        };
        
        // Xử lý sources
        if (rule.sources) {
          transformedRule.addresses = {
            addresses: rule.sources.split(',').map((s: string) => s.trim())
          };
        } else if (rule.sourceIds) {
          transformedRule.addresses = {
            droplet_ids: Array.isArray(rule.sourceIds) ? rule.sourceIds : [rule.sourceIds]
          };
        } else if (rule.sourceTags) {
          transformedRule.addresses = {
            tags: Array.isArray(rule.sourceTags) ? rule.sourceTags : [rule.sourceTags]
          };
        }
        
        return transformedRule;
      }) : [],
      outbound_rules: data.outboundRules ? data.outboundRules.map((rule: any) => {
        const transformedRule: any = {
          protocol: rule.protocol,
          ports: rule.ports
        };
        
        // Xử lý destinations
        if (rule.destinations) {
          transformedRule.addresses = {
            addresses: rule.destinations.split(',').map((s: string) => s.trim())
          };
        } else if (rule.destinationIds) {
          transformedRule.addresses = {
            droplet_ids: Array.isArray(rule.destinationIds) ? rule.destinationIds : [rule.destinationIds]
          };
        } else if (rule.destinationTags) {
          transformedRule.addresses = {
            tags: Array.isArray(rule.destinationTags) ? rule.destinationTags : [rule.destinationTags]
          };
        }
        
        return transformedRule;
      }) : [],
      droplet_ids: data.dropletIds || [],
      tags: data.tags || []
    };
    
    // Gọi DigitalOcean API để tạo firewall
    const newFirewall = await createFirewall(firewallData);
    
    // Lưu thông tin firewall vào database
    await db.firewall.create({
      data: {
        doId: newFirewall.id!,
        name: newFirewall.name,
        status: newFirewall.status || "active",
        inboundRules: newFirewall.inbound_rules,
        outboundRules: newFirewall.outbound_rules,
        tags: newFirewall.tags || []
      }
    });
    
    // Nếu có droplet IDs, thì tạo liên kết
    if (data.dropletIds && data.dropletIds.length > 0) {
      // Tìm kiếm các droplet trong database
      const droplets = await db.droplet.findMany({
        where: {
          doId: {
            in: data.dropletIds
          }
        }
      });
      
      // Tạo liên kết với firewall
      for (const droplet of droplets) {
        await db.firewallDroplet.create({
          data: {
            firewallId: newFirewall.id!,
            dropletId: droplet.id
          }
        });
      }
    }
    
    // Trả về kết quả đã chuyển đổi sang định dạng frontend
    return NextResponse.json({ 
      firewall: transformFirewall(newFirewall),
      message: "Firewall created successfully" 
    })
  } catch (error: any) {
    console.error("Error creating firewall:", error);
    return NextResponse.json({ 
      error: "Failed to create firewall", 
      message: error.message 
    }, { status: 500 })
  }
}

