import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Edit, MoreHorizontal, Plus, Shield, Trash } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { getFirewalls } from "@/lib/digitalocean"
import { notFound } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

async function getFirewallsData() {
  try {
    // Kiểm tra phân quyền
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { firewalls: [] };
    }

    const permissions = (session.user as any).permissions || "";
    if (!hasPermission(permissions, PERMISSIONS.VIEW_FIREWALLS)) {
      return { firewalls: [] };
    }

    // Lấy dữ liệu từ DigitalOcean API
    const doFirewalls = await getFirewalls();

    // Chuyển đổi dữ liệu để hiển thị
    const firewalls = doFirewalls.map(firewall => {
      // Chuyển đổi IDs của droplet sang tên
      const dropletNames: string[] = [];
      if (firewall.droplet_ids && firewall.droplet_ids.length > 0) {
        // Lấy thông tin droplet từ database - trong thực tế cần truy vấn tên
        // nhưng để đơn giản hóa, ta sẽ hiển thị ID
        dropletNames.push(...firewall.droplet_ids.map(id => `droplet-${id}`));
      }

      return {
        id: firewall.id,
        name: firewall.name,
        status: firewall.status || "unknown",
        droplets: dropletNames,
        inboundRules: firewall.inbound_rules.map(rule => {
          const sources = rule.addresses?.addresses 
            ? rule.addresses.addresses.join(", ")
            : rule.addresses?.droplet_ids 
              ? `${rule.addresses.droplet_ids.length} droplets`
              : rule.addresses?.tags
                ? `Tags: ${rule.addresses.tags.join(", ")}`
                : "All sources";

          return {
            protocol: rule.protocol,
            ports: rule.ports || "all",
            sources
          };
        }),
        outboundRules: firewall.outbound_rules.map(rule => {
          const destinations = rule.addresses?.addresses 
            ? rule.addresses.addresses.join(", ")
            : rule.addresses?.droplet_ids 
              ? `${rule.addresses.droplet_ids.length} droplets`
              : rule.addresses?.tags
                ? `Tags: ${rule.addresses.tags.join(", ")}`
                : "All destinations";

          return {
            protocol: rule.protocol,
            ports: rule.ports || "all",
            destinations
          };
        }),
      };
    });

    return { firewalls };
  } catch (error) {
    console.error("Failed to fetch firewalls:", error);
    return { firewalls: [] };
  }
}

export default async function FirewallsPage() {
  const { firewalls } = await getFirewallsData();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Firewalls</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/firewalls/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Firewall
            </Link>
          </Button>
        </div>
      </div>
      
      {firewalls.length === 0 && (
        <div className="flex flex-col items-center justify-center space-y-4 py-12">
          <Shield className="h-12 w-12 text-muted-foreground" />
          <div className="text-xl font-medium">No firewalls found</div>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have any firewalls yet. Create a firewall to control network traffic to your Droplets.
          </p>
          <Button asChild>
            <Link href="/firewalls/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Firewall
            </Link>
          </Button>
        </div>
      )}
      
      {firewalls.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {firewalls.map((firewall) => (
            <Card key={firewall.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{firewall.name}</CardTitle>
                <Badge variant={firewall.status === "active" ? "default" : "secondary"}>{firewall.status}</Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/firewalls/${firewall.id}`} className="w-full">
                        View details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/firewalls/${firewall.id}/edit`} className="w-full">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="text-destructive">
                      <Link href={`/firewalls/${firewall.id}/delete`} className="w-full">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-4">
                  <div>
                    <strong>Applied to:</strong> {firewall.droplets.length > 0 ? firewall.droplets.join(", ") : "No droplets"}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-1" /> Inbound Rules
                    </h4>
                    <div className="text-xs space-y-1">
                      {firewall.inboundRules.length > 0 ? (
                        firewall.inboundRules.map((rule, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              {rule.protocol.toUpperCase()} {rule.ports}
                            </span>
                            <span>{rule.sources}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">No inbound rules</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Shield className="h-4 w-4 mr-1" /> Outbound Rules
                    </h4>
                    <div className="text-xs space-y-1">
                      {firewall.outboundRules.length > 0 ? (
                        firewall.outboundRules.map((rule, index) => (
                          <div key={index} className="flex justify-between">
                            <span>
                              {rule.protocol.toUpperCase()} {rule.ports}
                            </span>
                            <span>{rule.destinations}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">No outbound rules</div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/firewalls/${firewall.id}`}>View details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

