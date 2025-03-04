import { db } from "./db"

async function getDigitalOceanToken() {
  const tokenRecord = await db.digitalOceanToken.findFirst()
  if (!tokenRecord) {
    throw new Error("DigitalOcean API token not found")
  }
  return tokenRecord.token
}

export async function callDigitalOceanAPI(endpoint: string, method = "GET", body?: any) {
  const token = await getDigitalOceanToken()
  const response = await fetch(`https://api.digitalocean.com/v2${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`DigitalOcean API error: ${response.statusText}`)
  }

  return response.json()
}

