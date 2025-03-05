import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_SETTINGS)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const token = await db.digitalOceanToken.findFirst()
  return NextResponse.json({ token: token?.token ? "********" : null })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  console.log("Session:", JSON.stringify(session, null, 2))
  console.log("User permissions:", session?.user?.permissions)
  console.log("Required permission:", PERMISSIONS.EDIT_SETTINGS)
  console.log("Has permission:", session?.user ? hasPermission(session.user.permissions, PERMISSIONS.EDIT_SETTINGS) : false)

  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.EDIT_SETTINGS)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const { token } = await req.json()

  if (!token) {
    return NextResponse.json({ message: "Token is required" }, { status: 400 })
  }

  await db.digitalOceanToken.upsert({
    where: { id: "default" },
    update: { token },
    create: { id: "default", token },
  })

  return NextResponse.json({ message: "Token updated successfully" })
}

