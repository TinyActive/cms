import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_ROLES)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const roles = await db.role.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.CREATE_ROLE)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { name, description, permissions } = await req.json()

    // Check if role already exists
    const existingRole = await db.role.findUnique({
      where: {
        name,
      },
    })

    if (existingRole) {
      return NextResponse.json({ message: "Role with this name already exists" }, { status: 409 })
    }

    // Create the role
    const role = await db.role.create({
      data: {
        name,
        description,
        permissions,
      },
    })

    // Create activity log
    await db.activity.create({
      data: {
        action: "role_created",
        userId: session.user.id,
        details: { name, permissions },
      },
    })

    return NextResponse.json({ message: "Role created successfully", role }, { status: 201 })
  } catch (error) {
    console.error("Error creating role:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

