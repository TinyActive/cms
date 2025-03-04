"use client"

import { useSession } from "next-auth/react"
import { hasPermission } from "@/lib/permissions"
import type { ReactNode } from "react"

interface PermissionGuardProps {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGuard({ permission, children, fallback = null }: PermissionGuardProps) {
  const { data: session } = useSession()

  if (!session?.user) {
    return fallback
  }

  const userPermissions = session.user.permissions || []

  if (!hasPermission(userPermissions, permission)) {
    return fallback
  }

  return <>{children}</>
}

