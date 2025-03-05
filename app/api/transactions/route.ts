import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const transactions = await db.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ transactions })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const { amount, type } = await req.json()

  const transaction = await db.transaction.create({
    data: {
      amount,
      type,
      status: "PENDING",
      userId: session.user.id,
    },
  })

  return NextResponse.json({ transaction })
}

