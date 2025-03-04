import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { hasPermission } from "@/lib/permissions"
import { PERMISSIONS } from "@/lib/permissions"
import { callDigitalOceanAPI } from "@/lib/digitalocean"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.VIEW_DROPLETS)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  try {
    const { droplets } = await callDigitalOceanAPI("/droplets")
    return NextResponse.json({ droplets })
  } catch (error) {
    console.error("Error fetching droplets:", error)
    return NextResponse.json({ message: "Error fetching droplets" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user || !hasPermission(session.user.permissions, PERMISSIONS.CREATE_DROPLET)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  try {
    const dropletData = await req.json()
    const { droplet } = await callDigitalOceanAPI("/droplets", "POST", dropletData)

    // Save droplet to local database
    await db.droplet.create({
      data: {
        digitalOceanId: droplet.id.toString(),
        name: droplet.name,
        status: droplet.status,
        ip: droplet.networks.v4[0]?.ip_address,
        region: droplet.region.slug,
        size: droplet.size.slug,
        image: droplet.image.slug,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ droplet })
  } catch (error) {
    console.error("Error creating droplet:", error)
    return NextResponse.json({ message: "Error creating droplet" }, { status: 500 })
  }
}

