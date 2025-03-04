import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Server } from "lucide-react"
import Link from "next/link"
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { ServerStatus } from "@/components/dashboard/server-status"
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export default function Home() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <PermissionGuard permission={PERMISSIONS.CREATE_DROPLET}>
            <Button asChild>
              <Link href="/droplets/new">
                <Server className="mr-2 h-4 w-4" />
                Create Droplet
              </Link>
            </Button>
          </PermissionGuard>
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <DashboardMetrics />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Server Status</CardTitle>
                <CardDescription>Current status of your droplets</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ServerStatus />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest actions performed on your servers</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Link href="/activity" className="flex items-center justify-center w-full">
                    View all activity
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

