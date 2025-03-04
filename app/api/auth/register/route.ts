import { NextResponse } from "next/server"
import { hash } from "bcrypt"
import { db } from "@/lib/db"
import { ROLES } from "@/lib/permissions"

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json()

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: {
        email,
      },
    })

    if (existingUser) {
      return NextResponse.json({ message: "User with this email already exists" }, { status: 409 })
    }

    // Get the default user role
    const userRole = await db.role.findUnique({
      where: {
        name: ROLES.USER,
      },
    })

    if (!userRole) {
      return NextResponse.json({ message: "Default role not found" }, { status: 500 })
    }

    // Hash the password
    const hashedPassword = await hash(password, 10)

    // Create the user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: userRole.id,
      },
    })

    // Create activity log
    await db.activity.create({
      data: {
        action: "user_registered",
        userId: user.id,
        details: { name, email },
      },
    })

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

