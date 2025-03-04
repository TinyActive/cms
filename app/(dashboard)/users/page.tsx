import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Edit, MoreHorizontal, Plus, Shield, Trash, User } from "lucide-react"
import Link from "next/link"
import { db } from "@/lib/db"
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export const metadata: Metadata = {
  title: "Users Management",
  description: "Manage users and their roles",
}

async function getUsers() {
  try {
    const users = await db.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return users
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
        <div className="flex items-center space-x-2">
          <PermissionGuard permission={PERMISSIONS.CREATE_USER}>
            <Button asChild>
              <Link href="/users/new">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Link>
            </Button>
          </PermissionGuard>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user.image || "/placeholder-user.jpg"} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
                  <CardDescription className="text-xs">{user.email}</CardDescription>
                </div>
              </div>
              <PermissionGuard permission={PERMISSIONS.EDIT_USER}>
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
                      <Link href={`/users/${user.id}`}>View details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGuard permission={PERMISSIONS.DELETE_USER}>
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </PermissionGuard>
                  </DropdownMenuContent>
                </DropdownMenu>
              </PermissionGuard>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Role</span>
                  <div className="flex items-center mt-1">
                    {user.role.name === "admin" ? (
                      <Shield className="h-3 w-3 mr-1 text-primary" />
                    ) : user.role.name === "support" ? (
                      <User className="h-3 w-3 mr-1 text-primary" />
                    ) : (
                      <User className="h-3 w-3 mr-1 text-muted-foreground" />
                    )}
                    <span className="capitalize">{user.role.name}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center mt-1">
                    <Badge variant={user.emailVerified ? "default" : "secondary"} className="text-[10px] h-5">
                      {user.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-muted-foreground">Joined</span>
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <PermissionGuard permission={PERMISSIONS.EDIT_USER}>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/users/${user.id}/edit`}>Edit User</Link>
                </Button>
              </PermissionGuard>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

