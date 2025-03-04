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
import { Progress } from "@/components/ui/progress"
import { ArrowUpDown, Download, MoreHorizontal, Plus, Power, Trash } from "lucide-react"
import Link from "next/link"

const droplets = [
  {
    id: 1,
    name: "web-01",
    status: "running",
    ip: "142.93.121.45",
    region: "NYC1",
    size: "s-1vcpu-1gb",
    cpu: 65,
    memory: 42,
    disk: 23,
    image: "Ubuntu 20.04",
  },
  {
    id: 2,
    name: "db-01",
    status: "running",
    ip: "142.93.121.46",
    region: "NYC1",
    size: "s-1vcpu-2gb",
    cpu: 32,
    memory: 78,
    disk: 56,
    image: "Ubuntu 20.04",
  },
  {
    id: 3,
    name: "worker-01",
    status: "running",
    ip: "142.93.121.47",
    region: "NYC1",
    size: "s-1vcpu-1gb",
    cpu: 12,
    memory: 24,
    disk: 18,
    image: "Ubuntu 20.04",
  },
  {
    id: 4,
    name: "staging-01",
    status: "stopped",
    ip: "142.93.121.48",
    region: "NYC1",
    size: "s-1vcpu-1gb",
    cpu: 0,
    memory: 0,
    disk: 12,
    image: "Ubuntu 20.04",
  },
]

export default function DropletsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Droplets</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Droplet
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {droplets.map((droplet) => (
          <Card key={droplet.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{droplet.name}</CardTitle>
              <Badge variant={droplet.status === "running" ? "default" : "secondary"}>{droplet.status}</Badge>
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
                    <Link href={`/droplets/${droplet.id}`} className="flex w-full">
                      View details
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Power className="mr-2 h-4 w-4" />
                    <span>{droplet.status === "running" ? "Power off" : "Power on"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <span>Resize</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" />
                    <span>Create snapshot</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>IP: {droplet.ip}</div>
                  <div>Region: {droplet.region}</div>
                  <div>Size: {droplet.size}</div>
                  <div>Image: {droplet.image}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>CPU</span>
                  <span>{droplet.cpu}%</span>
                </div>
                <Progress value={droplet.cpu} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Memory</span>
                  <span>{droplet.memory}%</span>
                </div>
                <Progress value={droplet.memory} className="h-1" />
                <div className="flex justify-between text-xs">
                  <span>Disk</span>
                  <span>{droplet.disk}%</span>
                </div>
                <Progress value={droplet.disk} className="h-1" />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/droplets/${droplet.id}`}>View details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

