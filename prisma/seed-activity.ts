import { hash } from "bcryptjs"
import { db } from "../lib/db"

async function main() {
  console.log(`Bắt đầu tạo dữ liệu mẫu cho Activity...`)

  // Tìm hoặc tạo role Admin cho user
  const adminRoleCount = await db.role.count({
    where: {
      name: "ADMIN"
    }
  })

  let adminRole
  if (adminRoleCount === 0) {
    console.log(`Tạo role ADMIN...`)
    adminRole = await db.role.create({
      data: {
        name: "ADMIN",
        permissions: JSON.stringify(["*"]),
      }
    })
  } else {
    adminRole = await db.role.findFirst({
      where: {
        name: "ADMIN"
      }
    })
  }

  // Tìm hoặc tạo role User cho user thường
  const userRoleCount = await db.role.count({
    where: {
      name: "USER"
    }
  })

  let userRole
  if (userRoleCount === 0) {
    console.log(`Tạo role USER...`)
    userRole = await db.role.create({
      data: {
        name: "USER",
        permissions: JSON.stringify(["read:own_vps", "create:vps", "update:own_vps", "delete:own_vps"]),
      }
    })
  } else {
    userRole = await db.role.findFirst({
      where: {
        name: "USER"
      }
    })
  }

  // Kiểm tra xem đã có users chưa, nếu chưa thì tạo
  const adminCount = await db.user.count({
    where: {
      email: "admin@example.com",
    },
  })

  let adminUser
  if (adminCount === 0) {
    console.log(`Tạo user mẫu admin...`)
    adminUser = await db.user.create({
      data: {
        name: "Admin User",
        email: "admin@example.com",
        password: await hash("password123", 12),
        image: "/placeholder-user.jpg",
        roleId: adminRole?.id || "",
        balance: 100,
      },
    })
  } else {
    adminUser = await db.user.findFirst({
      where: {
        email: "admin@example.com",
      },
    })
  }

  // Tạo user thứ hai nếu chưa có
  const user2Count = await db.user.count({
    where: {
      email: "user@example.com",
    },
  })

  let regularUser
  if (user2Count === 0) {
    regularUser = await db.user.create({
      data: {
        name: "Regular User",
        email: "user@example.com",
        password: await hash("password123", 12),
        image: "/placeholder-user.jpg",
        roleId: userRole?.id || "",
        balance: 50,
      },
    })
  } else {
    regularUser = await db.user.findFirst({
      where: {
        email: "user@example.com",
      },
    })
  }

  // Kiểm tra xem đã có droplet chưa, nếu chưa thì tạo
  const dropletCount = await db.droplet.count()
  
  let webServer
  let dbServer
  if (dropletCount === 0) {
    console.log(`Tạo droplets mẫu...`)
    webServer = await db.droplet.create({
      data: {
        name: "web-server-01",
        region: "sgp1",
        size: "s-1vcpu-1gb",
        image: "ubuntu-20-04-x64",
        status: "active",
        ip: "123.45.67.89",
        cpu: 1,
        memory: 1024,
        disk: 25,
        userId: adminUser?.id || "",
      },
    })

    dbServer = await db.droplet.create({
      data: {
        name: "db-server-01",
        region: "sgp1",
        size: "s-2vcpu-2gb",
        image: "ubuntu-20-04-x64",
        status: "active",
        ip: "123.45.67.90",
        cpu: 2,
        memory: 2048,
        disk: 50,
        userId: adminUser?.id || "",
      },
    })
  } else {
    webServer = await db.droplet.findFirst({
      where: {
        name: "web-server-01",
      },
    })
    
    dbServer = await db.droplet.findFirst({
      where: {
        name: "db-server-01",
      },
    })
  }

  // Kiểm tra xem đã có firewall chưa, nếu chưa thì tạo
  const firewallCount = await db.firewall.count()
  
  let webFirewall
  if (firewallCount === 0) {
    console.log(`Tạo firewall mẫu...`)
    webFirewall = await db.firewall.create({
      data: {
        name: "web-firewall",
        status: "active",
        inboundRules: [
          {
            protocol: "tcp",
            ports: "80,443",
            sources: "0.0.0.0/0",
          },
          {
            protocol: "tcp",
            ports: "22",
            sources: "0.0.0.0/0",
          },
        ],
        outboundRules: [
          {
            protocol: "tcp",
            ports: "all",
            destinations: "0.0.0.0/0",
          },
          {
            protocol: "udp",
            ports: "all",
            destinations: "0.0.0.0/0",
          },
        ],
      },
    })

    // Gán firewall cho droplet
    if (webFirewall && webServer) {
      await db.firewallDroplet.create({
        data: {
          firewallId: webFirewall.id,
          dropletId: webServer.id,
        },
      })
    }
  } else {
    webFirewall = await db.firewall.findFirst({
      where: {
        name: "web-firewall",
      },
    })
  }

  // Xóa các activity cũ nếu có (để tránh trùng lặp khi chạy lại script)
  console.log(`Xóa các activity cũ...`)
  await db.activity.deleteMany({})

  // Tạo dữ liệu mẫu cho Activity
  console.log(`Tạo dữ liệu mẫu cho activity...`)
  
  // Activity 1: Tạo droplet
  await db.activity.create({
    data: {
      action: "Tạo một droplet mới",
      details: {
        name: webServer?.name,
        region: webServer?.region,
        size: webServer?.size,
      },
      userId: adminUser?.id || "",
      dropletId: webServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 2), // 2 giờ trước
    },
  })

  // Activity 2: Cập nhật firewall
  await db.activity.create({
    data: {
      action: "Cập nhật firewall rules",
      details: {
        addedRules: ["TCP:80,443 from 0.0.0.0/0", "TCP:22 from 0.0.0.0/0"],
      },
      userId: adminUser?.id || "",
      firewallId: webFirewall?.id,
      createdAt: new Date(Date.now() - 3600000 * 3), // 3 giờ trước
    },
  })

  // Activity 3: Khởi động lại server
  await db.activity.create({
    data: {
      action: "Khởi động lại server",
      details: {
        server: webServer?.name,
        reason: "Maintenance",
      },
      userId: adminUser?.id || "",
      dropletId: webServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 5), // 5 giờ trước
    },
  })

  // Activity 4: Tạo snapshot
  await db.activity.create({
    data: {
      action: "Tạo snapshot",
      details: {
        name: `${webServer?.name}-snapshot-1`,
        server: webServer?.name,
      },
      userId: adminUser?.id || "",
      dropletId: webServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 24), // 1 ngày trước
    },
  })

  // Activity 5: Thêm user
  await db.activity.create({
    data: {
      action: "Thêm user mới",
      details: {
        user: regularUser?.email,
      },
      userId: adminUser?.id || "",
      createdAt: new Date(Date.now() - 3600000 * 36), // 1.5 ngày trước
    },
  })

  // Activity 6: Backup database
  await db.activity.create({
    data: {
      action: "Backup database",
      details: {
        server: dbServer?.name,
        backup_size: "1.2GB",
      },
      userId: regularUser?.id || "",
      dropletId: dbServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 48), // 2 ngày trước
    },
  })

  // Activity 7: Cập nhật server
  await db.activity.create({
    data: {
      action: "Cập nhật hệ điều hành",
      details: {
        server: webServer?.name,
        from: "Ubuntu 20.04 LTS",
        to: "Ubuntu 22.04 LTS",
      },
      userId: adminUser?.id || "",
      dropletId: webServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 72), // 3 ngày trước
    },
  })

  // Activity 8: Cấu hình bảo mật
  await db.activity.create({
    data: {
      action: "Cấu hình bảo mật",
      details: {
        server: dbServer?.name,
        changes: ["Disabled root login", "Changed SSH port", "Enabled 2FA"],
      },
      userId: adminUser?.id || "",
      dropletId: dbServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 96), // 4 ngày trước
    },
  })

  // Activity 9: Thêm firewall
  await db.activity.create({
    data: {
      action: "Gán firewall cho server",
      details: {
        firewall: webFirewall?.name,
        server: webServer?.name,
      },
      userId: regularUser?.id || "",
      dropletId: webServer?.id,
      firewallId: webFirewall?.id,
      createdAt: new Date(Date.now() - 3600000 * 120), // 5 ngày trước
    },
  })

  // Activity 10: Tăng cấp server
  await db.activity.create({
    data: {
      action: "Tăng cấp server",
      details: {
        server: dbServer?.name,
        from: "1GB RAM, 1vCPU",
        to: "2GB RAM, 2vCPU",
      },
      userId: adminUser?.id || "",
      dropletId: dbServer?.id,
      createdAt: new Date(Date.now() - 3600000 * 144), // 6 ngày trước
    },
  })

  console.log(`Tạo dữ liệu mẫu hoàn tất.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  }) 