import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sendTelegramNotification } from "@/lib/telegram"

export async function POST(req: Request) {
  const { event_type, droplet } = await req.json()

  const vps = await db.vps.findUnique({
    where: { digitalOceanId: droplet.id },
    include: { user: true },
  })

  if (!vps) {
    return NextResponse.json({ message: "VPS not found" }, { status: 404 })
  }

  const telegramNotification = await db.telegramNotification.findFirst({
    where: { userId: vps.userId },
  })

  if (telegramNotification) {
    await sendTelegramNotification(telegramNotification.chatId, `VPS ${vps.name} ${event_type}`)
  }

  return NextResponse.json({ message: "Webhook processed successfully" })
}

