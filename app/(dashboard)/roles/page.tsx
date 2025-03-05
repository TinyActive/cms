import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Roles Management",
  description: "Manage user roles and permissions",
}

async function getRoles() {
  try {
    const roles = await db.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })
    return roles
  } catch (error) {
    console.error("Error fetching roles:", error)
    return []
  }
}

export default async function RolesPage() {
  const roles = await getRoles()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Roles Management</h2>
        <div className="flex items-center space-x-2">
          <PermissionGuard permission={PERMISSIONS.CREATE_ROLE}>
            <Button asChild>
              <Link href="/roles/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Role
              </Link>
            </Button>
          </PermissionGuard>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{role.name}</CardTitle>
                <Badge variant="outline">{role._count.users} users</Badge>
              </div>
              <CardDescription>{role.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Permissions:</h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    try {
                      const permissionArray = JSON.parse(role.permissions) as string[];
                      return permissionArray.length > 0 ? (
                        <>
                          {permissionArray.slice(0, 5).map((permission, index) => (
                            <Badge key={index} variant="secondary">
                              {permission.replace(/_/g, " ")}
                            </Badge>
                          ))}
                          {permissionArray.length > 5 && (
                            <Badge variant="outline">+{permissionArray.length - 5} more</Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">No permissions assigned</span>
                      );
                    } catch (e) {
                      return <span className="text-sm text-muted-foreground">Invalid permissions format</span>;
                    }
                  })()}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <PermissionGuard permission={PERMISSIONS.EDIT_ROLE}>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/roles/${role.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              </PermissionGuard>
              <PermissionGuard permission={PERMISSIONS.DELETE_ROLE}>
                <Button variant="destructive" size="sm" disabled={role._count.users > 0}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </PermissionGuard>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

