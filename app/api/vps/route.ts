import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { callDigitalOceanAPI } from "@/lib/digitalocean"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const { name, region, size, image } = await req.json()

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: true },
  })

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 })
  }

  // Check if user has permission to create VPS
  if (!user.role.permissions.includes("CREATE_VPS")) {
    return NextResponse.json({ message: "Permission denied" }, { status: 403 })
  }

  // Check user balance (assuming minimum balance required is $10)
  if (user.balance < 10) {
    return NextResponse.json({ message: "Insufficient balance" }, { status: 400 })
  }

  try {
    const droplet = await callDigitalOceanAPI("/droplets", "POST", {
      name,
      region,
      size,
      image,
    })

    const vps = await db.vps.create({
      data: {
        digitalOceanId: droplet.id.toString(),
        name: droplet.name,
        status: droplet.status,
        ip: droplet.networks.v4[0]?.ip_address,
        region: droplet.region.slug,
        size: droplet.size.slug,
        userId: user.id,
      },
    })

    // Deduct balance (you may want to implement a more sophisticated billing system)
    await db.user.update({
      where: { id: user.id },
      data: { balance: { decrement: 10 } },
    })

    return NextResponse.json({ vps })
  } catch (error) {
    console.error("Error creating VPS:", error)
    return NextResponse.json({ message: "Error creating VPS" }, { status: 500 })
  }
}

