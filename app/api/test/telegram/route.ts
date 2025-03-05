import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 })
  }

  const telegramNotification = await db.telegramNotification.findFirst({
    where: { userId: session.user.id },
  })

  if (!telegramNotification) {
    return NextResponse.json({ message: "Telegram notification not set up for this user" }, { status: 404 })
  }

  await sendTelegramNotification(telegramNotification.chatId, "This is a test notification")

  return NextResponse.json({ message: "Test notification sent" })
}

