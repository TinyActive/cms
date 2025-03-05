export async function sendTelegramNotification(chatId: string, message: string) {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN

  if (!telegramBotToken) {
    console.error("TELEGRAM_BOT_TOKEN is not defined in environment variables.")
    return
  }

  const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
      }),
    })

    if (!response.ok) {
      console.error("Failed to send Telegram notification:", response.status, response.statusText)
    }
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
  }
}

