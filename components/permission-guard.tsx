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

  if (!session || !session.user) {
    return null
  }

  const userPermissions = session.user.permissions || ''

  if (!hasPermission(userPermissions, permission)) {
    return null
  }

  return <>{children}</>
}

