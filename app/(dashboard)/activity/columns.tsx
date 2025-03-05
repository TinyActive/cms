"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Activity, Server, Shield } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Define the activity data type based on the DB schema and our formatting
export type ActivityData = {
  id: string
  action: string
  details: any
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
  resource: string
  timestamp: string
  createdAt: Date
}

// Helper function to determine icon
function getActivityIcon(action: string) {
  if (action.toLowerCase().includes("droplet") || action.toLowerCase().includes("server")) {
    return <Server className="h-4 w-4" />
  } else if (action.toLowerCase().includes("firewall")) {
    return <Shield className="h-4 w-4" />
  } else {
    return <Activity className="h-4 w-4" />
  }
}

export const columns: ColumnDef<ActivityData>[] = [
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.getValue("user") as ActivityData["user"]
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || ""} alt={user.name || ""} />
            <AvatarFallback>
              {user.name
                ? user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.getValue("action") as string
      return (
        <div className="flex items-center gap-1">
          {getActivityIcon(action)}
          <span>{action}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "resource",
    header: "Resource",
    cell: ({ row }) => {
      const resource = row.getValue("resource") as string
      return (
        <Badge variant="outline">
          {resource}
        </Badge>
      )
    }
  },
  {
    accessorKey: "timestamp",
    header: "Time",
    cell: ({ row }) => {
      return <div className="text-muted-foreground">{row.getValue("timestamp")}</div>
    },
  },
] 