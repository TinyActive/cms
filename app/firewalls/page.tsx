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

const firewalls = [
  {
    id: 1,
    name: "Web Servers",
    status: "active",
    droplets: ["web-01", "web-02"],
    inboundRules: [
      { protocol: "tcp", ports: "80", sources: "0.0.0.0/0" },
      { protocol: "tcp", ports: "443", sources: "0.0.0.0/0" },
      { protocol: "tcp", ports: "22", sources: "192.168.1.0/24" },
    ],
    outboundRules: [
      { protocol: "tcp", ports: "all", destinations: "0.0.0.0/0" },
      { protocol: "udp", ports: "all", destinations: "0.0.0.0/0" },
    ],
  },
  {
    id: 2,
    name: "Database Servers",
    status: "active",
    droplets: ["db-01"],
    inboundRules: [
      { protocol: "tcp", ports: "3306", sources: "10.0.0.0/8" },
      { protocol: "tcp", ports: "22", sources: "192.168.1.0/24" },
    ],
    outboundRules: [
      { protocol: "tcp", ports: "all", destinations: "0.0.0.0/0" },
      { protocol: "udp", ports: "all", destinations: "0.0.0.0/0" },
    ],
  },
  {
    id: 3,
    name: "Development",
    status: "inactive",
    droplets: ["staging-01"],
    inboundRules: [{ protocol: "tcp", ports: "all", sources: "192.168.1.0/24" }],
    outboundRules: [
      { protocol: "tcp", ports: "all", destinations: "0.0.0.0/0" },
      { protocol: "udp", ports: "all", destinations: "0.0.0.0/0" },
    ],
  },
]

export default function FirewallsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Firewalls</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Firewall
          </Button>
        </div>
      </div>
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
                  <DropdownMenuItem>
                    <Link href={`/firewalls/${firewall.id}`} className="flex w-full">
                      View details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4">
                <div>
                  <strong>Applied to:</strong> {firewall.droplets.join(", ") || "No droplets"}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1" /> Inbound Rules
                  </h4>
                  <div className="text-xs space-y-1">
                    {firewall.inboundRules.map((rule, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {rule.protocol.toUpperCase()} {rule.ports}
                        </span>
                        <span>{rule.sources}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-1" /> Outbound Rules
                  </h4>
                  <div className="text-xs space-y-1">
                    {firewall.outboundRules.map((rule, index) => (
                      <div key={index} className="flex justify-between">
                        <span>
                          {rule.protocol.toUpperCase()} {rule.ports}
                        </span>
                        <span>{rule.destinations}</span>
                      </div>
                    ))}
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
    </div>
  )
}

