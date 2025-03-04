import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const servers = [
  {
    id: 1,
    name: "web-01",
    status: "running",
    ip: "142.93.121.45",
    region: "NYC1",
    cpu: 65,
    memory: 42,
    disk: 23,
  },
  {
    id: 2,
    name: "db-01",
    status: "running",
    ip: "142.93.121.46",
    region: "NYC1",
    cpu: 32,
    memory: 78,
    disk: 56,
  },
  {
    id: 3,
    name: "worker-01",
    status: "running",
    ip: "142.93.121.47",
    region: "NYC1",
    cpu: 12,
    memory: 24,
    disk: 18,
  },
  {
    id: 4,
    name: "staging-01",
    status: "stopped",
    ip: "142.93.121.48",
    region: "NYC1",
    cpu: 0,
    memory: 0,
    disk: 12,
  },
]

export function ServerStatus() {
  return (
    <div className="space-y-8">
      {servers.map((server) => (
        <div key={server.id} className="flex flex-col space-y-3">
          <div className="flex items-center">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{server.name}</span>
                <Badge variant={server.status === "running" ? "default" : "secondary"}>{server.status}</Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {server.ip} • {server.region}
              </span>
            </div>
            <div className="ml-auto text-xs text-muted-foreground">
              {server.status === "running" ? "Online" : "Offline"}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>CPU</span>
              <span>{server.cpu}%</span>
            </div>
            <Progress value={server.cpu} className="h-1" />
            <div className="flex justify-between text-xs">
              <span>Memory</span>
              <span>{server.memory}%</span>
            </div>
            <Progress value={server.memory} className="h-1" />
            <div className="flex justify-between text-xs">
              <span>Disk</span>
              <span>{server.disk}%</span>
            </div>
            <Progress value={server.disk} className="h-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

