import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(req: Request, { params }: { params: { roleId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_ROLES)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const role = await db.role.findUnique({
      where: {
        id: params.roleId,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 })
    }

    return NextResponse.json({ role })
  } catch (error) {
    console.error("Error fetching role:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { roleId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.EDIT_ROLE)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { name, description, permissions } = await req.json()

    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: {
        id: params.roleId,
      },
    })

    if (!existingRole) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 })
    }

    // Check if name is already taken by another role
    if (name !== existingRole.name) {
      const nameExists = await db.role.findUnique({
        where: {
          name,
        },
      })

      if (nameExists) {
        return NextResponse.json({ message: "Role with this name already exists" }, { status: 409 })
      }
    }

    // Update the role
    const updatedRole = await db.role.update({
      where: {
        id: params.roleId,
      },
      data: {
        name,
        description,
        permissions,
      },
    })

    // Create activity log
    await db.activity.create({
      data: {
        action: "role_updated",
        userId: session.user.id,
        details: { id: params.roleId, name, permissions },
      },
    })

    return NextResponse.json({
      message: "Role updated successfully",
      role: updatedRole,
    })
  } catch (error) {
    console.error("Error updating role:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { roleId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.DELETE_ROLE)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    // Check if role exists
    const role = await db.role.findUnique({
      where: {
        id: params.roleId,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 })
    }

    // Check if role has users
    if (role._count.users > 0) {
      return NextResponse.json({ message: "Cannot delete role with assigned users" }, { status: 400 })
    }

    // Delete the role
    await db.role.delete({
      where: {
        id: params.roleId,
      },
    })

    // Create activity log
    await db.activity.create({
      data: {
        action: "role_deleted",
        userId: session.user.id,
        details: { id: params.roleId, name: role.name },
      },
    })

    return NextResponse.json({
      message: "Role deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting role:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

