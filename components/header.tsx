"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { Bell, HelpCircle, LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession, signOut } from "next-auth/react"
import { PermissionGuard } from "@/components/permission-guard"
import { PERMISSIONS } from "@/lib/permissions"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">DigitalOcean VPS Management</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <PermissionGuard permission={PERMISSIONS.VIEW_DROPLETS}>
              <Link href="/droplets" className="transition-colors hover:text-foreground/80">
                Droplets
              </Link>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.VIEW_FIREWALLS}>
              <Link href="/firewalls" className="transition-colors hover:text-foreground/80">
                Firewalls
              </Link>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.VIEW_USERS}>
              <Link href="/users" className="transition-colors hover:text-foreground/80">
                Users
              </Link>
            </PermissionGuard>
            <PermissionGuard permission={PERMISSIONS.VIEW_SETTINGS}>
              <Link href="/settings" className="transition-colors hover:text-foreground/80">
                Settings
              </Link>
            </PermissionGuard>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button variant="outline" size="icon" className="mr-2">
              <Bell className="h-4 w-4" />
              <span className="sr-only">Notifications</span>
            </Button>
            <Button variant="outline" size="icon" className="mr-2">
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">Help</span>
            </Button>
          </div>
          <ModeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={session?.user?.image || "/placeholder-user.jpg"}
                    alt={session?.user?.name || "User"}
                  />
                  <AvatarFallback>
                    {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <PermissionGuard permission={PERMISSIONS.VIEW_SETTINGS}>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
              </PermissionGuard>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

