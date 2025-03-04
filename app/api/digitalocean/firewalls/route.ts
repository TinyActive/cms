import { NextResponse } from "next/server"

// This is a mock implementation. In a real application, you would use the DigitalOcean API
export async function GET() {
  const firewalls = [
    {
      id: 1,
      name: "Web Servers",
      status: "active",
      droplets: ["web-01", "web-02"],
      inboundRules: [
        { protocol: "tcp", ports: "80", sources: "0.0.0.0/0" },
        { protocol: "tcp", ports: "443", sources: "0.0.0.0/0" },
        { protocol: "tcp", ports: "22", sources: "192.168.1.0/24" },
      ],
      outboundRules: [
        { protocol: "tcp", ports: "all", destinations: "0.0.0.0/0" },
        { protocol: "udp", ports: "all", destinations: "0.0.0.0/0" },
      ],
    },
    {
      id: 2,
      name: "Database Servers",
      status: "active",
      droplets: ["db-01"],
      inboundRules: [
        { protocol: "tcp", ports: "3306", sources: "10.0.0.0/8" },
        { protocol: "tcp", ports: "22", sources: "192.168.1.0/24" },
      ],
      outboundRules: [
        { protocol: "tcp", ports: "all", destinations: "0.0.0.0/0" },
        { protocol: "udp", ports: "all", destinations: "0.0.0.0/0" },
      ],
    },
    {
      id: 3,
      name: "Development",
      status: "inactive",
      droplets: ["staging-01"],
      inboundRules: [{ protocol: "tcp", ports: "all", sources: "192.168.1.0/24" }],
      outboundRules: [
        { protocol: "tcp", ports: "all", destinations: "0.0.0.0/0" },
        { protocol: "udp", ports: "all", destinations: "0.0.0.0/0" },
      ],
    },
  ]

  return NextResponse.json({ firewalls })
}

export async function POST(request: Request) {
  const data = await request.json()

  // In a real application, you would create a new firewall using the DigitalOcean API
  const newFirewall = {
    id: Math.floor(Math.random() * 1000),
    name: data.name,
    status: "active",
    droplets: data.droplets || [],
    inboundRules: data.inboundRules || [],
    outboundRules: data.outboundRules || [],
  }

  return NextResponse.json({ firewall: newFirewall })
}

