import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url)
    const limit = searchParams.get("limit") 
      ? parseInt(searchParams.get("limit") as string) 
      : 50
    const page = searchParams.get("page") 
      ? parseInt(searchParams.get("page") as string) 
      : 1
    const skip = (page - 1) * limit

    // Get activities with pagination
    const activities = await db.activity.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        droplet: {
          select: {
            id: true,
            name: true,
          },
        },
        firewall: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      skip,
      take: limit,
    })

    // Get total count for pagination
    const total = await db.activity.count()

    return NextResponse.json({
      activities,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    })
  } catch (error) {
    console.error("[ACTIVITY_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
} 