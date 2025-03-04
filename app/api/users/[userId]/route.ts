import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET(req: Request, { params }: { params: { userId: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_USERS)) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: {
        id: params.userId,
      },
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
            permissions: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.EDIT_USER)) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    const { name, email, password, roleId } = await req.json();

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: {
        id: params.userId,
      },
    });

    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

// Check if\

