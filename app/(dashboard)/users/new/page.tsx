import type { Metadata } from "next"
import { UserForm } from "@/components/users/user-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Create User",
  description: "Create a new user account",
}

async function getRoles() {
  try {
    const roles = await db.role.findMany({
      orderBy: {
        name: "asc",
      },
    })
    return roles
  } catch (error) {
    console.error("Error fetching roles:", error)
    return []
  }
}

export default async function NewUserPage() {
  const roles = await getRoles()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Create User</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Details</CardTitle>
          <CardDescription>Create a new user account</CardDescription>
        </CardHeader>
        <CardContent>
          <UserForm
            roles={roles}
            initialData={{
              name: "",
              email: "",
              password: "",
              roleId: "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}

