import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const paypalSecret = process.env.PAYPAL_SECRET
  // Verify the PayPal signature here (implementation depends on PayPal SDK)

  const event = await req.json()

  if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
    const transactionId = event.resource.id
    const amount = Number.parseFloat(event.resource.amount.value)

    // Update the transaction in the database
    await db.transaction.update({
      where: { id: transactionId },
      data: {
        status: "COMPLETED",
      },
    })

    // Update user balance
    await db.user.update({
      where: { id: event.resource.custom_id }, // Assuming we pass user ID as custom_id
      data: {
        balance: {
          increment: amount,
        },
      },
    })
  }

  return NextResponse.json({ received: true })
}

