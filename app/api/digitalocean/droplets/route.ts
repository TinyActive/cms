import { NextResponse } from "next/server"

// This is a mock implementation. In a real application, you would use the DigitalOcean API
export async function GET() {
  const droplets = [
    {
      id: 1,
      name: "web-01",
      status: "active",
      ip: "142.93.121.45",
      region: "NYC1",
      size: "s-1vcpu-1gb",
      cpu: 65,
      memory: 42,
      disk: 23,
      image: "Ubuntu 20.04",
    },
    {
      id: 2,
      name: "db-01",
      status: "active",
      ip: "142.93.121.46",
      region: "NYC1",
      size: "s-1vcpu-2gb",
      cpu: 32,
      memory: 78,
      disk: 56,
      image: "Ubuntu 20.04",
    },
    {
      id: 3,
      name: "worker-01",
      status: "active",
      ip: "142.93.121.47",
      region: "NYC1",
      size: "s-1vcpu-1gb",
      cpu: 12,
      memory: 24,
      disk: 18,
      image: "Ubuntu 20.04",
    },
    {
      id: 4,
      name: "staging-01",
      status: "off",
      ip: "142.93.121.48",
      region: "NYC1",
      size: "s-1vcpu-1gb",
      cpu: 0,
      memory: 0,
      disk: 12,
      image: "Ubuntu 20.04",
    },
  ]

  return NextResponse.json({ droplets })
}

export async function POST(request: Request) {
  const data = await request.json()

  // In a real application, you would create a new droplet using the DigitalOcean API
  const newDroplet = {
    id: Math.floor(Math.random() * 1000),
    name: data.name,
    status: "new",
    ip: "142.93.121.49",
    region: data.region || "NYC1",
    size: data.size || "s-1vcpu-1gb",
    cpu: 0,
    memory: 0,
    disk: 0,
    image: data.image || "Ubuntu 20.04",
  }

  return NextResponse.json({ droplet: newDroplet })
}

