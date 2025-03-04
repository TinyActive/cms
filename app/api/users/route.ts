import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_USERS)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.CREATE_USER)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const { name, email, password, roleId } = await req.json()

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Check if role exists
    const role = await db.role.findUnique({
      where: {
        id: roleId,
      },
    })

    if (!role) {
      return NextResponse.json({ message: "Role not found" }, { status: 404 })
    }

    // Hash the password
    const hashedPassword = await hash(password, 10)

    // Create the user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId,
      },
    })

    // Create activity log
    await db.activity.create({
      data: {
        action: "user_created",
        userId: session.user.id,
        details: { name, email, roleId },
      },
    })

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, name: user.name, email: user.email } },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

