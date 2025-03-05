import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { 
  addRulesToFirewall,
  removeRulesFromFirewall,
  getFirewall,
  InboundRule,
  OutboundRule
} from "@/lib/digitalocean"

// POST /api/digitalocean/firewalls/[id]/rules
// Thêm rules vào firewall
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.EDIT_FIREWALL)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to edit firewalls" 
      }, { status: 403 })
    }

    const { id } = params
    const data = await request.json()
    
    if ((!data.inboundRules || data.inboundRules.length === 0) && 
        (!data.outboundRules || data.outboundRules.length === 0)) {
      return NextResponse.json({ 
        message: "At least one inbound or outbound rule is required" 
      }, { status: 400 })
    }
    
    // Chuyển đổi cấu trúc dữ liệu từ frontend sang định dạng API của DigitalOcean
    const inboundRules: InboundRule[] = data.inboundRules ? data.inboundRules.map((rule: any) => {
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
    }) : [];
    
    const outboundRules: OutboundRule[] = data.outboundRules ? data.outboundRules.map((rule: any) => {
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
    }) : [];
    
    // Gọi DigitalOcean API
    await addRulesToFirewall(id, inboundRules, outboundRules);
    
    // Lấy thông tin firewall đã cập nhật
    const updatedFirewall = await getFirewall(id);
    
    // Cập nhật database
    await db.firewall.update({
      where: { doId: id },
      data: {
        inboundRules: updatedFirewall.inbound_rules,
        outboundRules: updatedFirewall.outbound_rules
      }
    });
    
    return NextResponse.json({ 
      message: "Rules added to firewall successfully" 
    })
  } catch (error: any) {
    console.error(`Error adding rules to firewall ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to add rules to firewall", 
      message: error.message 
    }, { status: 500 })
  }
}

// DELETE /api/digitalocean/firewalls/[id]/rules
// Xóa rules khỏi firewall
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const permissions = (session.user as any).permissions || "";
    
    if (!hasPermission(permissions, PERMISSIONS.EDIT_FIREWALL)) {
      return NextResponse.json({ 
        message: "Forbidden - You don't have permission to edit firewalls" 
      }, { status: 403 })
    }

    const { id } = params
    const data = await request.json()
    
    if ((!data.inboundRules || data.inboundRules.length === 0) && 
        (!data.outboundRules || data.outboundRules.length === 0)) {
      return NextResponse.json({ 
        message: "At least one inbound or outbound rule is required" 
      }, { status: 400 })
    }
    
    // Chuyển đổi cấu trúc dữ liệu từ frontend sang định dạng API của DigitalOcean
    const inboundRules: InboundRule[] = data.inboundRules ? data.inboundRules.map((rule: any) => {
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
    }) : [];
    
    const outboundRules: OutboundRule[] = data.outboundRules ? data.outboundRules.map((rule: any) => {
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
    }) : [];
    
    // Gọi DigitalOcean API
    await removeRulesFromFirewall(id, inboundRules, outboundRules);
    
    // Lấy thông tin firewall đã cập nhật
    const updatedFirewall = await getFirewall(id);
    
    // Cập nhật database
    await db.firewall.update({
      where: { doId: id },
      data: {
        inboundRules: updatedFirewall.inbound_rules,
        outboundRules: updatedFirewall.outbound_rules
      }
    });
    
    return NextResponse.json({ 
      message: "Rules removed from firewall successfully" 
    })
  } catch (error: any) {
    console.error(`Error removing rules from firewall ${params.id}:`, error)
    return NextResponse.json({ 
      error: "Failed to remove rules from firewall", 
      message: error.message 
    }, { status: 500 })
  }
} 