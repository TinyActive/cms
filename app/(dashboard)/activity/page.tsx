import { Metadata } from "next"
import { Activity } from "lucide-react"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DataTable } from "@/components/ui/data-table"
import { formatDistanceToNow } from "date-fns"
import { columns } from "./columns"

export const metadata: Metadata = {
  title: "Activity Log",
  description: "View all activity across your account",
}

async function getActivities() {
  try {
    const activities = await db.activity.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        droplet: true,
        firewall: true,
      },
    })

    return activities
  } catch (error) {
    console.error("Failed to fetch activities:", error)
    return []
  }
}

export default async function ActivityPage() {
  const session = await getServerSession(authOptions)
  const activities = await getActivities()

  // Transform activities to include formatted data for display
  const formattedActivities = activities.map((activity) => ({
    id: activity.id,
    action: activity.action,
    details: activity.details,
    user: {
      id: activity.user.id,
      name: activity.user.name,
      email: activity.user.email,
      image: activity.user.image,
    },
    resource: activity.droplet ? `Droplet: ${activity.droplet.name}` : 
              activity.firewall ? `Firewall: ${activity.firewall.name}` : 
              "System",
    timestamp: formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true }),
    createdAt: activity.createdAt,
  }))

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Log</h2>
          <p className="text-muted-foreground">
            Monitor all activity across your account
          </p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            All Activity
          </CardTitle>
          <CardDescription>
            View a complete history of actions taken across your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={formattedActivities} />
        </CardContent>
      </Card>
    </div>
  )
} 