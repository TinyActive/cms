import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Server, Shield, Trash, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { getFirewall } from "@/lib/digitalocean"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

async function getFirewallData(id: string) {
  try {
    // Kiểm tra phân quyền
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return null;
    }

    const permissions = (session.user as any).permissions || "";
    if (!hasPermission(permissions, PERMISSIONS.VIEW_FIREWALLS)) {
      return null;
    }

    // Lấy dữ liệu từ DigitalOcean API
    const doFirewall = await getFirewall(id);
    if (!doFirewall) {
      return null;
    }

    // Chuyển đổi IDs của droplet sang tên
    const dropletNames: string[] = [];
    const dropletList: { id: number; name: string }[] = [];
    
    if (doFirewall.droplet_ids && doFirewall.droplet_ids.length > 0) {
      // Lấy thông tin droplet từ database - trong thực tế cần truy vấn tên
      // nhưng để đơn giản hóa, ta sẽ hiển thị ID
      
      for (const dropletId of doFirewall.droplet_ids) {
        dropletList.push({
          id: dropletId,
          name: `droplet-${dropletId}`
        });
        dropletNames.push(`droplet-${dropletId}`);
      }
    }

    // Chuyển đổi dữ liệu để hiển thị
    return {
      id: doFirewall.id,
      name: doFirewall.name,
      status: doFirewall.status || "unknown",
      created_at: doFirewall.created_at 
        ? new Date(doFirewall.created_at).toLocaleString() 
        : "Unknown",
      droplets: dropletNames,
      dropletList,
      tags: doFirewall.tags || [],
      inboundRules: doFirewall.inbound_rules.map(rule => {
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
          sources,
          rawRule: rule
        };
      }),
      outboundRules: doFirewall.outbound_rules.map(rule => {
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
          destinations,
          rawRule: rule
        };
      }),
    };
  } catch (error) {
    console.error(`Failed to fetch firewall ${id}:`, error);
    return null;
  }
}

export default async function FirewallDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firewall = await getFirewallData(id);
  
  if (!firewall) {
    notFound();
  }
  
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/firewalls">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h2 className="text-3xl font-bold tracking-tight">{firewall.name}</h2>
          <Badge variant={firewall.status === "active" ? "default" : "secondary"}>
            {firewall.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/firewalls/${firewall.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" asChild>
            <Link href={`/firewalls/${firewall.id}/delete`}>
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">ID</div>
                <div className="text-sm font-medium">{firewall.id}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-sm font-medium">
                  <Badge variant={firewall.status === "active" ? "default" : "secondary"}>
                    {firewall.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm">{firewall.created_at}</div>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <div className="text-sm text-muted-foreground">Tags</div>
                <div className="text-sm">
                  {firewall.tags && firewall.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {firewall.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No tags</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Applied to Droplets</CardTitle>
          </CardHeader>
          <CardContent>
            {firewall.dropletList && firewall.dropletList.length > 0 ? (
              <div className="space-y-2">
                {firewall.dropletList.map((droplet) => (
                  <div key={droplet.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center">
                      <Server className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{droplet.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/droplets/${droplet.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Server className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No droplets are using this firewall</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href={`/firewalls/${firewall.id}/droplets`}>Add Droplets</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="inbound">
        <TabsList>
          <TabsTrigger value="inbound">Inbound Rules</TabsTrigger>
          <TabsTrigger value="outbound">Outbound Rules</TabsTrigger>
        </TabsList>
        <TabsContent value="inbound" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Inbound Rules</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/firewalls/${firewall.id}/rules/inbound/add`}>Add Rule</Link>
            </Button>
          </div>
          
          {firewall.inboundRules && firewall.inboundRules.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b">
                <div className="col-span-2">Protocol</div>
                <div className="col-span-2">Ports</div>
                <div className="col-span-7">Sources</div>
                <div className="col-span-1"></div>
              </div>
              {firewall.inboundRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-4 border-b last:border-0">
                  <div className="col-span-2">{rule.protocol.toUpperCase()}</div>
                  <div className="col-span-2">{rule.ports}</div>
                  <div className="col-span-7">{rule.sources}</div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/firewalls/${firewall.id}/rules/inbound/edit/${index}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <Shield className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No inbound rules configured</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/firewalls/${firewall.id}/rules/inbound/add`}>Add Inbound Rule</Link>
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="outbound" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Outbound Rules</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/firewalls/${firewall.id}/rules/outbound/add`}>Add Rule</Link>
            </Button>
          </div>
          
          {firewall.outboundRules && firewall.outboundRules.length > 0 ? (
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-2 p-4 font-medium border-b">
                <div className="col-span-2">Protocol</div>
                <div className="col-span-2">Ports</div>
                <div className="col-span-7">Destinations</div>
                <div className="col-span-1"></div>
              </div>
              {firewall.outboundRules.map((rule, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-4 border-b last:border-0">
                  <div className="col-span-2">{rule.protocol.toUpperCase()}</div>
                  <div className="col-span-2">{rule.ports}</div>
                  <div className="col-span-7">{rule.destinations}</div>
                  <div className="col-span-1 flex justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/firewalls/${firewall.id}/rules/outbound/edit/${index}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 border rounded-md">
              <Shield className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No outbound rules configured</p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/firewalls/${firewall.id}/rules/outbound/add`}>Add Outbound Rule</Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 