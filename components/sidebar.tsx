"use client"

import { cn } from "@/lib/utils"
import { Activity, CreditCard, Database, Home, Lock, Server, Settings, Shield, Users, Sliders } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
    permission: null, // Everyone can access the dashboard
  },
  {
    title: "Droplets",
    href: "/droplets",
    icon: Server,
    permission: PERMISSIONS.VIEW_DROPLETS,
  },
  {
    title: "Firewalls",
    href: "/firewalls",
    icon: Shield,
    permission: PERMISSIONS.VIEW_FIREWALLS,
  },
  {
    title: "Databases",
    href: "/databases",
    icon: Database,
    permission: PERMISSIONS.VIEW_DROPLETS, // Reusing droplet permission for databases
  },
  {
    title: "Activity",
    href: "/activity",
    icon: Activity,
    permission: null, // Everyone can view activity
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    permission: PERMISSIONS.VIEW_USERS,
  },
  {
    title: "Billing",
    href: "/billing",
    icon: CreditCard,
    permission: PERMISSIONS.VIEW_SETTINGS,
  },
  {
    title: "API Keys",
    href: "/api-keys",
    icon: Lock,
    permission: PERMISSIONS.VIEW_SETTINGS,
  },
  {
    title: "Server Configs",
    href: "/server-config",
    icon: Sliders,
    permission: PERMISSIONS.VIEW_SERVER_CONFIGS,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    permission: PERMISSIONS.VIEW_SETTINGS,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userPermissions = session?.user?.permissions || ''

  // Filter links based on user permissions
  const filteredLinks = sidebarLinks.filter(
    (link) => link.permission === null || hasPermission(userPermissions, link.permission),
  )

  return (
    <div className="hidden border-r bg-muted/40 lg:block lg:w-60">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {filteredLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname === link.href && "bg-muted text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.title}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}

