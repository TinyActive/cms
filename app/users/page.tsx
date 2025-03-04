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

const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    status: "active",
    avatar: "/placeholder-user.jpg",
    lastActive: "2 hours ago",
  },
  {
    id: 2,
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    status: "active",
    avatar: "/placeholder-user.jpg",
    lastActive: "1 day ago",
  },
  {
    id: 3,
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    status: "active",
    avatar: "/placeholder-user.jpg",
    lastActive: "3 days ago",
  },
  {
    id: 4,
    name: "Support Staff",
    email: "support@example.com",
    role: "support",
    status: "active",
    avatar: "/placeholder-user.jpg",
    lastActive: "5 hours ago",
  },
  {
    id: 5,
    name: "Inactive User",
    email: "inactive@example.com",
    role: "user",
    status: "inactive",
    avatar: "/placeholder-user.jpg",
    lastActive: "2 months ago",
  },
]

export default function UsersPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src={user.avatar} alt={user.name} />
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
                    <Link href={`/users/${user.id}`} className="flex w-full">
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
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Role</span>
                  <div className="flex items-center mt-1">
                    {user.role === "admin" ? (
                      <Shield className="h-3 w-3 mr-1 text-primary" />
                    ) : user.role === "support" ? (
                      <User className="h-3 w-3 mr-1 text-primary" />
                    ) : (
                      <User className="h-3 w-3 mr-1 text-muted-foreground" />
                    )}
                    <span className="capitalize">{user.role}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Status</span>
                  <div className="flex items-center mt-1">
                    <Badge variant={user.status === "active" ? "default" : "secondary"} className="text-[10px] h-5">
                      {user.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-muted-foreground">Last Active</span>
                  <span>{user.lastActive}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/users/${user.id}`}>View details</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

