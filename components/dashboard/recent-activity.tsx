import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Activity, Power, Server, Shield } from "lucide-react"

const activities = [
  {
    id: 1,
    user: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder-user.jpg",
    },
    action: "Created a new droplet",
    timestamp: "2 hours ago",
    icon: Server,
  },
  {
    id: 2,
    user: {
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "/placeholder-user.jpg",
    },
    action: "Updated firewall rules",
    timestamp: "3 hours ago",
    icon: Shield,
  },
  {
    id: 3,
    user: {
      name: "Admin User",
      email: "admin@example.com",
      avatar: "/placeholder-user.jpg",
    },
    action: "Restarted server web-01",
    timestamp: "5 hours ago",
    icon: Power,
  },
  {
    id: 4,
    user: {
      name: "John Doe",
      email: "john@example.com",
      avatar: "/placeholder-user.jpg",
    },
    action: "Created a snapshot",
    timestamp: "1 day ago",
    icon: Activity,
  },
]

export function RecentActivity() {
  return (
    <div className="space-y-8">
      {activities.map((activity) => {
        const Icon = activity.icon
        return (
          <div className="flex items-center" key={activity.id}>
            <Avatar className="h-9 w-9">
              <AvatarImage src={activity.user.avatar} alt="Avatar" />
              <AvatarFallback>
                {activity.user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{activity.user.name}</p>
              <div className="flex items-center text-sm text-muted-foreground">
                <Icon className="mr-1 h-3 w-3" />
                <span>{activity.action}</span>
              </div>
            </div>
            <div className="ml-auto font-medium text-xs text-muted-foreground">{activity.timestamp}</div>
          </div>
        )
      })}
    </div>
  )
}

